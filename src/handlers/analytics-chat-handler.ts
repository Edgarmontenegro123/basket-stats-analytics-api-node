import { Request, Response } from 'express'
import { processDocumentBuffer, generateRagResponse } from '../services/ragEngine'

export const handleAnalyticsChat = async (req: Request, res: Response): Promise<void> => {
    try {
        const { prompt } = req.body
        const file = req.file

        if (!prompt) {
            res.status(400).json({ error: 'Prompt is required' })
            return
        }

        if (!file) {
            res.status(400).json({ error: 'Document file is required' })
            return
        }

        const fileExtension = file.originalname.split('.').pop()?.toLowerCase() || ''
        const chunks = await processDocumentBuffer(file.buffer, fileExtension)
        const answer = await generateRagResponse(prompt, chunks)

        res.status(200).json({ answer })
    } catch (error) {
        console.error('Error in handleAnalyticsChat:', error)
        res.status(500).json({ error: 'Internal server error processing analytics query' })
    }
}