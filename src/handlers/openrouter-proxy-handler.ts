import {Request, Response} from 'express'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL_NAME = 'meta-llama/llama-3.3-70b-instruct'

export const handleOpenRouterProxy = async(req: Request, res: Response): Promise<void> => {
    try {
        if (!OPENROUTER_API_KEY) {
            res.status(500).json({error: 'OpenRouter API Key is not configured on the server'})
            return
        }

        const {messages, tools, tool_choice} = req.body

        if (!messages) {
            res.status(400).json({error: 'Messages are required'})
            return
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': req.headers['referer'] || 'https://basket-stats.local',
                'X-Title': 'Basket Stats AI'
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages,
                tools,
                tool_choice: tool_choice || 'auto'
            })
        })

        const data = await response.json()

        if (!response.ok) {
            res.status(response.status).json(data)
            return
        }

        res.status(200).json(data)
    } catch (error) {
        console.error('Error in handleOpenRouterProxy:', error)
        res.status(500).json({error: 'Internal server error communicating with OpenRouter'})
    }
}