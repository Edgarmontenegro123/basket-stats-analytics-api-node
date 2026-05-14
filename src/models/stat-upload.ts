export type StatUpload = {
    id: string;
    game_id: string;
    file_name: string;
    file_type: string;
    file_path: string;
    status: string;
    uploaded_at: string;
    processed_at: string | null;
};