import { Request, Response } from 'express'
import {PlayerRankingStat} from '../models/player-stat'
import { processUploadAnalytics } from '../services/analytics-service'
import { deleteStatsByGameId } from '../services/game-stats-cleanup-service'
import {
    getTeamStatsByGameId as findTeamStatsByGameId
} from '../services/team-stats-service'
import {
    getPlayerStatsByGameId as findPlayerStatsByGameId,
    getTopPlayersByStat,
    getAggregatedPlayersRanking,
    getPlayerSummaryByName,
} from '../services/player-stats-service'


export const processAnalytics = async (
    req: Request,
    res: Response,
) => {
    const { upload_id } = req.body;

    if (!upload_id) {
        res.status(400).json({
            error: 'upload_id is required',
        })

        return
    }

    try {
        const result = await processUploadAnalytics(upload_id)

        res.status(201).json(result)
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({
                error: error.message,
            })

            return
        }

        res.status(500).json({
            error: 'internal server error',
        })
    }
}

export const getPlayerStatsByGameId = async (
    req: Request,
    res: Response,
) => {
    try {
        const gameId = req.params.id as string

        const stats = await findPlayerStatsByGameId(gameId)

        res.status(200).json(stats)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            error: 'error getting players stats',
        })
    }
}

export const getTeamStatsByGameId = async (
    req: Request,
    res: Response,
) => {
    try {
        const gameId = req.params.id as string
        const stats = await findTeamStatsByGameId(gameId)

        res.status(200).json(stats)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            error: 'error getting teams stats',
        })
    }
}

export const getTopPlayersRanking  = async (
    req: Request,
    res: Response,
) => {
    try {
        const stat = req.query.stat as PlayerRankingStat
        const limit = Number(req.query.limit || 5)
        const rankings = await getTopPlayersByStat(
            stat,
            limit,
        )

        res.status(200).json(rankings)
    } catch (error) {
        console.error(error)

        if (error instanceof Error) {
            res.status(400).json({
                error: error.message,
            })
            return
        }

        res.status(500).json({
            error: 'error getting player rankings',
        })
    }
}

export const getAggregatedPlayersRankingHandler = async (
    req: Request,
    res: Response,
) => {
    try {
        const stat = req.query.stat as PlayerRankingStat
        const limit = Number(req.query.limit) || 10
        const rankings = await getAggregatedPlayersRanking(
            stat,
            limit,
        )

        res.status(200).json(rankings)
    } catch (error) {
        console.error(error)

        if (error instanceof Error) {
            res.status(400).json({
                error: error.message,
            })

            return
        }

        res.status(500).json({
            error: 'error getting aggregated player rankings',
        })
    }
}

export const getPlayerSummaryHandler = async (
    req: Request,
    res: Response,
) => {
    try {
        const playerName = decodeURIComponent(req.params.playerName as string)

        if (!playerName) {
            res.status(400).json({
                error: 'playerName is required',
            })

            return
        }

        const summary = await getPlayerSummaryByName(playerName)

        res.status(200).json(summary)
    } catch (error) {
        console.error(error)

        if (error instanceof Error) {
            res.status(400).json({
                error: error.message,
            })

            return
        }

        res.status(500).json({
            error: 'error getting player summary',
        })
    }
}

export const deleteGameStatsHandler = async (
    req: Request,
    res: Response,
) => {
    try {
        const gameId = req.params.id as string

        if (!gameId) {
            res.status(400).json({
                error: 'gameId is required',
            })

            return
        }

        await deleteStatsByGameId(gameId)

        res.status(200).json({
            message: 'Game stats deleted successfully',
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            error: 'error deleting game stats',
        })
    }
}