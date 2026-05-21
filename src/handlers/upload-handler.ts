import { Request, Response } from 'express';
import { createUpload, getUploads as findUploads,getUploadById as findUploadById } from '../services/upload-service';

export const uploadStats = async (
    req: Request,
    res: Response,
) => {
    try {
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

        const newUpload = await createUpload({
            id: Date.now().toString(),
            game_id: gameId,
            file_name: file.originalname,
            file_type: file.mimetype,
            file_path: file.path,
            status: 'uploaded',
            uploaded_at: new Date(),
            processed_at: null,
        });

        res.status(201).json(newUpload);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'error creating upload',
        });
    }
};

export const getUploads = async (
    _req: Request,
    res: Response,
) => {
    try {
        const uploads = await findUploads();

        res.status(200).json(uploads);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'error getting uploads',
        });
    }
};

export const getUploadById = async (
    req: Request,
    res: Response,
) => {
    try {
        const id = req.params.id as string;

        const upload = await findUploadById(id);

        if (!upload) {
            res.status(404).json({
                error: 'upload not found',
            });

            return;
        }

        res.status(200).json(upload);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'error getting upload',
        });
    }
};