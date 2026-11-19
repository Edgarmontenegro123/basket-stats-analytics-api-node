import {Router} from 'express'
import {authMiddleware} from '../middleware/auth-middleware'
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
import {handleOpenRouterProxy} from '../handlers/openrouter-proxy-handler'

export const registerRoutes = (router: Router) => {
    router.get('/health', (_req, res) => {
        res.status(200).json({
            status: 'ok',
            service: 'basket-stats-analytics-api-node',
        });
    })

    router.get('/uploads', getUploads)
    router.get('/uploads/:id', getUploadById)

    router.post('/uploads',
        authMiddleware,
        authoriseRoles('admin', 'coach', 'dt'),
        upload.single('file'),
        uploadStats)

    router.get('/games/:id/players', getPlayerStatsByGameId)
    router.get('/games/:id/teams', getTeamStatsByGameId)

    router.delete(
        '/games/:id/stats',
        authMiddleware,
        authoriseRoles('admin', 'service'),
        deleteGameStatsHandler,
    )

    router.get('/players/rankings', getTopPlayersRanking)
    router.get('/players/aggregated-rankings', getAggregatedPlayersRankingHandler)
    router.get('/players/:playerName/summary', getPlayerSummaryHandler)

    router.post(
        '/process',
        authMiddleware,
        authoriseRoles('admin', 'coach', 'dt'),
        processAnalytics,
    )

    router.post(
        '/chat',
        authMiddleware,
        authoriseRoles('admin', 'coach', 'dt'),
        upload.single('file'),
        handleAnalyticsChat
    )

    router.post(
        '/ai/chat',
        authMiddleware,
        authoriseRoles('admin', 'coach', 'dt'),
        handleOpenRouterProxy
    )
}