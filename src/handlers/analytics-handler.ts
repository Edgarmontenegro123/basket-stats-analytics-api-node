import { Request, Response } from 'express';
import { processUploadAnalytics } from '../services/analytics-service';
import { getPlayerStatsByGameId as findPlayerStatsByGameId } from '../services/player-stats-service';
import { getTeamStatsByGameId as findTeamStatsByGameId } from '../services/team-stats-service';
import { playerStats } from '../services/player-stats-store';
import { teamStats } from '../services/team-stats-store';

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

export const getPlayerStatsByGameId = async (
    req: Request,
    res: Response,
) => {
    try {
        const gameId = req.params.id as string;

        const stats = await findPlayerStatsByGameId(gameId);

        res.status(200).json(stats);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'error getting players stats',
        })
    }
};

export const getTeamStatsByGameId = async (
    req: Request,
    res: Response,
) => {
    try {
        const gameId = req.params.id as string;

        const stats = await findTeamStatsByGameId(gameId);

        res.status(200).json(stats);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'error getting teams stats',
        })
    }
};