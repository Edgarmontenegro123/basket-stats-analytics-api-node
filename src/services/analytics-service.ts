import { extractTextFromPdf } from './pdf-service';
import { parsePlayerStatsFromText } from './player-stats-parser';
import { parseTeamStatsFromPlayerStats } from './team-stats-parser';
import {
    getUploadById,
    markUploadAsProcessed,
} from './upload-service';
import { createPlayerStats } from './player-stats-service';
import { createTeamStats } from './team-stats-service';

export const processUploadAnalytics = async (
    uploadId: string,
) => {
    const upload = await getUploadById(uploadId);

    if (!upload) {
        throw new Error('upload not found');
    }

    if (upload.status === 'processed') {
        throw new Error('upload already processed');
    }

    const extractedText = await extractTextFromPdf(upload.file_path);

    const parsedPlayerStats = parsePlayerStatsFromText(
        extractedText,
        upload.game_id,
    );

    const parsedTeamStats =
        parseTeamStatsFromPlayerStats(parsedPlayerStats);

    const createdPlayerStats =
        await createPlayerStats(parsedPlayerStats);

    const createdTeamStats =
        await createTeamStats(parsedTeamStats);

    const processedUpload = await markUploadAsProcessed(
        upload.id,
        new Date(),
    );

    return {
        upload: processedUpload,
        player_stats: createdPlayerStats,
        team_stats: createdTeamStats,
    };
};