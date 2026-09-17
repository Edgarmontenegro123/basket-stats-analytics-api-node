import {Express} from 'express'
import { authMiddleware } from '../middleware/auth-middleware'
import {authoriseRoles} from '../middleware/authorise-roles'
import {upload} from '../services/multer-config'
import {
    getUploads,
    getUploadById,
    uploadStats
} from '../handlers/upload-handler'
import {
    getPlayerStatsByGameId,
    getPlayerSummaryHandler,
    getTopPlayersRanking,
    getAggregatedPlayersRankingHandler,
    getTeamStatsByGameId,
    deleteGameStatsHandler,
    processAnalytics
} from '../handlers/analytics-handler'
import {handleAnalyticsChat} from '../handlers/analytics-chat-handler'


export const registerRoutes = (app: Express) => {
    app.get('/health', (_req, res) => {
        res.status(200).json({
            status: 'ok',
            service: 'basket-stats-analytics-api-node',
        });
    })

    app.get('/uploads', getUploads)
    app.get('/uploads/:id', getUploadById)

    app.post('/uploads',
        authMiddleware,
        authoriseRoles('admin', 'coach', 'dt'),
        upload.single('file'),
        uploadStats)

    app.get('/games/:id/players', getPlayerStatsByGameId)
    app.get('/games/:id/teams', getTeamStatsByGameId)

    app.delete(
        '/games/:id/stats',
        authMiddleware,
        authoriseRoles('admin', 'service'),
        deleteGameStatsHandler,
    )

    app.get('/players/rankings', getTopPlayersRanking)
    app.get('/players/aggregated-rankings', getAggregatedPlayersRankingHandler)
    app.get('/players/:playerName/summary', getPlayerSummaryHandler)

    app.post(
        '/process',
        authMiddleware,
        authoriseRoles('admin', 'coach', 'dt'),
        processAnalytics,
    )

    app.post(
        '/chat',
        authMiddleware,
        authoriseRoles('admin', 'coach', 'dt'),
        upload.single('file'),
        handleAnalyticsChat
    )

}

