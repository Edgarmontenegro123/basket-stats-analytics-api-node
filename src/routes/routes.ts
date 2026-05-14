import {Express} from 'express';
import {upload} from "../services/multer-config";

import {
    getUploadById,
    uploadStats
} from '../handlers/upload-handler';

import { processAnalytics } from '../handlers/analytics-handler';



export const registerRoutes = (app: Express) => {
    app.get('/health', (_req, res) => {
        res.status(200).json({
            status: 'ok',
            service: 'basket-stats-analytics-api-node',
        });
    });

    app.get('/uploads/:id', getUploadById);
    app.post('/uploads',
        upload.single('file'),
        uploadStats);

    app.post('/analytics/process', processAnalytics);
}

