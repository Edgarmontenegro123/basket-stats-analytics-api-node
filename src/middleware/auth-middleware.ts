import {NextFunction, Request, Response} from 'express'
import jwt from 'jsonwebtoken'

type AuthenticatedRequest = Request & {
    user?: {
        id?: string
        email?: string
        role?: string
        source?: string
    }
}

export const authMiddleware = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({message: 'Missing or invalid token'})
    }

    const token = authHeader.split(' ')[1]
    const jwtSecret = process.env.JWT_SECRET

    if (!jwtSecret) {
        return res.status(500).json({message: 'JWT secret is not configured'})
    }

    try {
        req.user = jwt.verify(token, jwtSecret) as {
            id?: string
            email?: string
            role?: string
            source?: string
        }

        next()
    } catch {
        return res.status(401).json({message: 'Invalid or expired token'})
    }
}