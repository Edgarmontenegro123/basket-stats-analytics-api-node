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

    app.get('/analytics/games/:id/players', getPlayerStatsByGameId)
    app.get('/analytics/games/:id/teams', getTeamStatsByGameId)

    app.delete(
        '/analytics/games/:id/stats',
        authMiddleware,
        authoriseRoles('admin', 'service'),
        deleteGameStatsHandler,
    )

    app.get('/analytics/players/rankings', getTopPlayersRanking)
    app.get('/analytics/players/aggregated-rankings', getAggregatedPlayersRankingHandler)
    app.get('/analytics/players/:playerName/summary', getPlayerSummaryHandler)

    app.post(
        '/analytics/process',
        authMiddleware,
        authoriseRoles('admin', 'coach', 'dt'),
        processAnalytics,
    )

}

