import { aiClient } from './iaService'

export const generateRagResponse = async (userPrompt: string, contextText: string): Promise<string> => {
    try {
        const prompt = `
You are an expert basketball analyst assistant for the Basket Stats app.
Answer the user's question accurately using ONLY the following context provided from the match statistics.
If the answer cannot be found in the context, politely inform the user that the provided match data does not contain that information.

---
CONTEXT:
${contextText}
---

USER QUESTION: ${userPrompt}
`

        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        })

        return response.text || 'No response generated.'
    } catch (error) {
        console.error('Error in ragEngine:', error)
        throw new Error('Failed to process analytics query')
    }
}