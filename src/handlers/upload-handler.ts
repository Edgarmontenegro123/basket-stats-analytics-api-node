import { Request, Response } from 'express';

import { uploads } from '../services/upload-store';

export const uploadStats = (
    req: Request,
    res: Response,
) => {
    const file = req.file;
    const gameId = req.body.game_id;

    if (!file) {
        res.status(400).json({
            error: 'file is required',
        });

        return;
    }

    if (!gameId) {
        res.status(400).json({
            error: 'game_id is required',
        });

        return;
    }

    const newUpload = {
        id: Date.now().toString(),
        game_id: gameId,
        file_name: file.originalname,
        file_type: file.mimetype,
        file_path: file.path,
        status: 'uploaded',
        uploaded_at: new Date().toISOString(),
        processed_at: null,
    };

    uploads.push(newUpload);

    res.status(201).json(newUpload);
};

export const getUploadById = (
    req: Request,
    res: Response,
) => {
    const { id } = req.params;

    const upload = uploads.find((item) => item.id === id);

    if (!upload) {
        res.status(404).json({
            error: 'upload not found',
        });

        return;
    }

    res.status(200).json(upload);
};