import {Request, Response as ExpressResponse} from 'express'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const API_URL = 'https://openrouter.ai/api/v1/chat/completions'

const PRIMARY_MODEL = 'meta-llama/llama-3.3-70b-instruct:free'
const FALLBACK_MODEL = 'google/gemini-2.0-flash-exp:free'
const TIMEOUT_MS = 10000

const fetchWithTimeout = async(url: string, options: RequestInit, timeoutMs: number): Promise<Response> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        })
        clearTimeout(timeoutId)
        return response
    } catch (error) {
        clearTimeout(timeoutId)
        throw error
    }
}

const executeModelCall = async(model: string, messages: any[], tools: any[], tool_choice: string, req: Request): Promise<Response> => {
    return fetchWithTimeout(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': req.headers['referer'] || 'https://basket-stats.local',
            'X-Title': 'Basket Stats AI'
        },
        body: JSON.stringify({
            model,
            messages,
            tools,
            tool_choice: tool_choice || 'auto'
        })
    }, TIMEOUT_MS)
}

export const handleOpenRouterProxy = async(req: Request, res: ExpressResponse): Promise<void> => {
    if (!OPENROUTER_API_KEY) {
        res.status(500).json({error: 'OpenRouter API Key is not configured on the server'})
        return
    }

    const {messages, tools, tool_choice} = req.body

    if (!messages) {
        res.status(400).json({error: 'Messages are required'})
        return
    }

    let primaryFailed = false
    let primaryErrorMessage = ''

    // 1. Intentamos con el modelo principal
    try {
        const response = await executeModelCall(PRIMARY_MODEL, messages, tools, tool_choice, req)

        if (response.ok) {
            const data = await response.json()
            res.status(200).json(data)
            return // Si sale bien, cortamos aquí
        }

        // Si no arrojó error de red, pero OpenRouter nos devolvió un 4xx/5xx
        const errorData = await response.text()
        primaryErrorMessage = `Status ${response.status}: ${errorData}`
        primaryFailed = true
        console.warn(`[Observability] Primary model (${PRIMARY_MODEL}) failed HTTP validation: ${primaryErrorMessage}`)
    } catch (error: any) {
        // Si falló por Timeout o red caída
        primaryErrorMessage = error.message
        primaryFailed = true
        console.warn(`[Observability] Primary model (${PRIMARY_MODEL}) network or timeout error: ${primaryErrorMessage}`)
    }

    // 2. Si llegamos acá y primaryFailed es true, activamos el Fallback sin usar 'throw'
    if (primaryFailed) {
        console.warn(`[Fallback Activated] Attempting fallback model (${FALLBACK_MODEL}) due to: ${primaryErrorMessage}`)

        try {
            const fallbackResponse = await executeModelCall(FALLBACK_MODEL, messages, tools, tool_choice, req)

            if (!fallbackResponse.ok) {
                const fallbackErrorData = await fallbackResponse.text()
                console.error(`[Observability] Fallback model (${FALLBACK_MODEL}) also failed with status ${fallbackResponse.status}: ${fallbackErrorData}`)
                res.status(fallbackResponse.status).json({error: 'Both primary and fallback models failed'})
                return
            }

            const fallbackData = await fallbackResponse.json()
            console.log(`[Observability] Fallback model (${FALLBACK_MODEL}) resolved the request successfully.`)
            res.status(200).json(fallbackData)
        } catch (fallbackError: any) {
            console.error(`[Observability] Critical failure in both models: ${fallbackError.message}`)
            res.status(500).json({error: 'Internal server error communicating with AI providers'})
        }
    }
}