import { Request, Response } from 'express';

import { uploads } from '../services/upload-store';
import { playerStats } from '../services/player-stats-store';
import { extractTextFromPdf } from '../services/pdf-service';
import { parsePlayerStatsFromText } from '../services/player-stats-parser';

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

    const parsedStats = parsePlayerStatsFromText(
        extractedText,
        upload.game_id,
    );

    playerStats.push(...parsedStats);

    upload.status = 'processed';
    upload.processed_at = now;

    res.status(201).json({
        upload,
        player_stats: parsedStats,
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