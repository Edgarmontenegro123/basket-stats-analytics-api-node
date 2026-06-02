import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or invalid token' })
    }

    const token = authHeader.split(' ')[1]
    const jwtSecret = process.env.JWT_SECRET

    if (!jwtSecret) {
        return res.status(500).json({ message: 'JWT secret is not configured' })
    }

    try {
        jwt.verify(token, jwtSecret)
        next()
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token' })
    }
}