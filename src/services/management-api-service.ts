import { GameDetails } from '../models/game-details'
import jwt from 'jsonwebtoken'

export const getGameDetailsById = async (
    gameId: string,
): Promise<GameDetails> => {
    const managementApiUrl = process.env.MANAGEMENT_API_URL
    const jwtSecret = process.env.JWT_SECRET

    if (!managementApiUrl) {
        throw new Error('MANAGEMENT_API_URL is not configured')
    }
    if (!jwtSecret) {
        throw new Error('JWT_SECRET is not configured')
    }

    const serviceToken = jwt.sign(
        {
            role: 'service',
            source: 'analytics-api',
        },
        jwtSecret,
        {expiresIn: '5m'},
    )

    const response = await fetch(`${managementApiUrl}/games/${gameId}`, {
        headers: {
            Authorization: `Bearer ${serviceToken}`,
        },
    })

    if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Error getting game details from Management API: ${errorBody}`)
    }

    return response.json()
}

export const updateGameResult = async (
    gameId: string,
    homeScore: number,
    awayScore: number,
) => {
    const managementApiUrl = process.env.MANAGEMENT_API_URL
    const jwtSecret = process.env.JWT_SECRET

    if (!managementApiUrl) {
        throw new Error('MANAGEMENT_API_URL is not configured')
    }
    if (!jwtSecret) {
        throw new Error('JWT_SECRET is not configured')
    }

    const serviceToken = jwt.sign(
        {
            role: 'service',
            source: 'analytics-api',
        },
        jwtSecret,
        { expiresIn: '5m' },
    )

    const response = await fetch(
        `${managementApiUrl}/games/${gameId}/result`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${serviceToken}`,
            },
            body: JSON.stringify({
                home_score: homeScore,
                away_score: awayScore,
                status: 'completed',
            }),
        },
    )

    if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Error updating game result: ${errorBody}`)
    }

    return response.json()
}