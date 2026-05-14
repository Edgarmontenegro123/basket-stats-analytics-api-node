import {Express} from 'express';

import { uploadStats } from '../handlers/upload-handler';
import {upload} from "../services/multer-config";


export const registerRoutes = (app: Express) => {
    app.get('/health', (_req, res) => {
        res.status(200).json({
            status: 'ok',
            service: 'basket-stats-analytics-api-node',
        });
    });

    app.post('/uploads',
        upload.single('file'),
        uploadStats);
}

