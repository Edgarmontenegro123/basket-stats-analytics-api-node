import { Request, Response } from 'express';
import { processUploadAnalytics } from '../services/analytics-service';
import { playerStats } from '../services/player-stats-store';

export const processAnalytics = async (
    req: Request,
    res: Response,
) => {
    const { upload_id } = req.body;

    if (!upload_id) {
        res.status(400).json({
            error: 'upload_id is required',
        });

        return;
    }

    try {
        const result = await processUploadAnalytics(upload_id);

        res.status(201).json(result);
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({
                error: error.message,
            });

            return;
        }

        res.status(500).json({
            error: 'internal server error',
        });
    }
};

export const getPlayerStatsByGameId = (
    req: Request,
    res: Response,
) => {
    const { id } = req.params;

    const stats = playerStats.filter((item) => item.game_id === id);

    res.status(200).json(stats);
};