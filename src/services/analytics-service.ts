import { uploads } from './upload-store';
import { playerStats } from './player-stats-store';
import { extractTextFromPdf } from './pdf-service';
import { parsePlayerStatsFromText } from './player-stats-parser';
import { teamStats } from './team-stats-store';
import { parseTeamStatsFromPlayerStats } from './team-stats-parser';

export const processUploadAnalytics = async (
    uploadId: string,
) => {
    const upload = uploads.find((item) => item.id === uploadId);

    if (!upload) {
        throw new Error('upload not found');
    }

    if (upload.status === 'processed') {
        throw new Error('upload already processed');
    }

    const extractedText = await extractTextFromPdf(upload.file_path);

    const parsedStats = parsePlayerStatsFromText(
        extractedText,
        upload.game_id,
    );

    const now = new Date().toISOString();

    playerStats.push(...parsedStats);

    const parsedTeamStats =
        parseTeamStatsFromPlayerStats(parsedStats);

    teamStats.push(...parsedTeamStats);

    upload.status = 'processed';
    upload.processed_at = now;

    return {
        upload,
        player_stats: parsedStats,
        team_stats: parsedTeamStats,
    };
};