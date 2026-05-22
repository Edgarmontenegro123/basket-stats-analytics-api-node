import {Express} from 'express';
import {upload} from "../services/multer-config";

import {
    getUploads,
    getUploadById,
    uploadStats
} from '../handlers/upload-handler';

import {
    getPlayerStatsByGameId,
    getTeamStatsByGameId,
    getTopPlayersRanking,
    getAggregatedPlayersRankingHandler,
    processAnalytics
} from '../handlers/analytics-handler';



export const registerRoutes = (app: Express) => {
    app.get('/health', (_req, res) => {
        res.status(200).json({
            status: 'ok',
            service: 'basket-stats-analytics-api-node',
        });
    });

    app.get('/uploads', getUploads);
    app.get('/uploads/:id', getUploadById);
    app.post('/uploads',
        upload.single('file'),
        uploadStats);

    app.get('/analytics/games/:id/players', getPlayerStatsByGameId);
    app.get('/analytics/players/rankings', getTopPlayersRanking);
    app.get('/analytics/games/:id/teams', getTeamStatsByGameId);
    app.get('/analytics/players/aggregated-rankings', getAggregatedPlayersRankingHandler);
    app.post('/analytics/process', processAnalytics);

}

