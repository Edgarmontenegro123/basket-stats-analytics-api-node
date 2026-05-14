import { Request, Response } from 'express';

import { uploads } from '../services/upload-store';
import { playerStats } from '../services/player-stats-store';
import { extractTextFromPdf } from '../services/pdf-service';

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

    const upload = uploads.find((item) => item.id === upload_id);

    if (!upload) {
        res.status(404).json({
            error: 'upload not found',
        });

        return;
    }

    if (upload.status === 'processed') {
        res.status(400).json({
            error: 'upload already processed',
        });

        return;
    }

    const now = new Date().toISOString();
    const extractedText = await extractTextFromPdf(upload.file_path);

    console.log('Extracted PDF text:');
    console.log(extractedText);

    const mockStats = [
        {
            id: `${Date.now()}-1`,
            game_id: upload.game_id,
            team_name: 'Mock Team',
            player_name: 'Player One',
            points: 18,
            rebounds: 7,
            assists: 4,
            created_at: now,
            updated_at: now,
        },
        {
            id: `${Date.now()}-2`,
            game_id: upload.game_id,
            team_name: 'Mock Team',
            player_name: 'Player Two',
            points: 12,
            rebounds: 5,
            assists: 8,
            created_at: now,
            updated_at: now,
        },
    ];

    playerStats.push(...mockStats);

    upload.status = 'processed';
    upload.processed_at = now;

    res.status(201).json({
        upload,
        player_stats: mockStats,
    });
};

export const getPlayerStatsByGameId = (
    req: Request,
    res: Response,
) => {
    const { id } = req.params;

    const stats = playerStats.filter((item) => item.game_id === id);

    res.status(200).json(stats);
};