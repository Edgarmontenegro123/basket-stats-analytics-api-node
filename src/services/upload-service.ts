import { pool } from '../db/pool';

export type UploadStatus = 'uploaded' | 'processed';

export type StatUpload = {
    id: string;
    game_id: string;
    file_name: string;
    file_type: string;
    file_path: string;
    status: UploadStatus;
    uploaded_at: Date;
    processed_at: Date | null;
};

export const createUpload = async (upload: StatUpload): Promise<StatUpload> => {
    const result = await pool.query(
        `
        INSERT INTO uploads (
            id,
            game_id,
            file_name,
            file_type,
            file_path,
            status,
            uploaded_at,
            processed_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        `,
        [
            upload.id,
            upload.game_id,
            upload.file_name,
            upload.file_type,
            upload.file_path,
            upload.status,
            upload.uploaded_at,
            upload.processed_at,
        ]
    );

    return result.rows[0];
};

export const getUploadById = async (id: string): Promise<StatUpload | null> => {
    const result = await pool.query(
        `
        SELECT *
        FROM uploads
        WHERE id = $1
        `,
        [id]
    );

    return result.rows[0] ?? null;
};

export const markUploadAsProcessed = async (
    id: string,
    processedAt: Date,
): Promise<StatUpload | null> => {
    const result = await pool.query(
        `
        UPDATE uploads
        SET status = $1,
            processed_at = $2
        WHERE id = $3
        RETURNING *
        `,
        ['processed', processedAt, id],
    );

    return result.rows[0] ?? null;
};

export const getUploads = async (): Promise<StatUpload[]> => {
    const result = await pool.query(
        `
        SELECT *
        FROM uploads
        ORDER BY uploaded_at DESC
        `
    );

    return result.rows;
};