import { extractTextFromPdf } from './pdf-service'
import { parsePlayerStatsFromText } from './player-stats-parser'
import { parseTeamStatsFromPlayerStats } from './team-stats-parser'
import { teamNamesMatch } from '../helpers/team-name-match'
import { getGameDetailsById, updateGameResult } from './management-api-service'
import {
    getUploadById,
    markUploadAsProcessed,
} from './upload-service'
import {
    createPlayerStats,
    getPlayerStatsByGameId,
} from './player-stats-service'

import {
    createTeamStats,
    getTeamStatsByGameId,
} from './team-stats-service'

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

    const existingPlayerStats = await getPlayerStatsByGameId(upload.game_id);
    const existingTeamStats = await getTeamStatsByGameId(upload.game_id);

    if (existingPlayerStats.length > 0 || existingTeamStats.length > 0) {
        throw new Error('stats already processed for this game');
    }

    const gameDetails = await getGameDetailsById(upload.game_id);
    const extractedText = await extractTextFromPdf(upload.file_path);

    const pdfMatchesGameTeams =
        teamNamesMatch(extractedText, gameDetails.home_team_name) &&
        teamNamesMatch(extractedText, gameDetails.away_team_name);

    if (!pdfMatchesGameTeams) {
        throw new Error(
            'uploaded PDF does not match the selected game teams',
        );
    }

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

    const homeTeamStats = createdTeamStats.find(
        (teamStat) => teamNamesMatch(teamStat.team_name, gameDetails.home_team_name),
    );

    const awayTeamStats = createdTeamStats.find(
        (teamStat) => teamNamesMatch(teamStat.team_name, gameDetails.away_team_name),
    );

    if (!homeTeamStats || !awayTeamStats) {
        throw new Error('could not calculate game result from team stats');
    }

    const updatedGame = await updateGameResult(
        upload.game_id,
        homeTeamStats.points,
        awayTeamStats.points,
    );

    const processedUpload = await markUploadAsProcessed(
        upload.id,
        new Date(),
    );

    return {
        upload: processedUpload,
        game: updatedGame,
        player_stats: createdPlayerStats,
        team_stats: createdTeamStats,
    };
};