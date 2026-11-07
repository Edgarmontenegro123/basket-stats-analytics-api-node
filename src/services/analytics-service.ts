import {extractTextFromPdf} from './pdf-service'
import {parsePlayerStatsFromText} from './player-stats-parser'
import {parseTeamStatsFromPlayerStats} from './team-stats-parser'
import {teamNamesMatch} from '../helpers/team-name-match'
import {getGameDetailsById, updateGameResult, updateGameDate, syncPlayersWithManagementApi} from './management-api-service'
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

// Helper robusto para extraer la fecha real del reporte PDF (soporta texto en inglés/español y formatos numéricos)
const extractDateFromPdfText = (text: string): string | null => {
    // 1. Buscar formato tipo "(may 4, 2025)" o "(oct 5, 2025)" o similares
    const textDateRegex = /(?:may|jun|jul|aug|sep|oct|nov|dec|ene|feb|mar|abr|ago|dic)[a-z]* \d{1,2},? \d{4}/i
    const textMatch = text.match(textDateRegex)
    if (textMatch) {
        const parsedDate = new Date(textMatch[0])
        if (!isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString()
        }
    }

    // 2. Buscar formato numérico común DD/MM/YYYY o DD-MM-YYYY en el texto
    const numericDateRegex = /\b(\d{2})[-/](\d{2})[-/](\d{4})\b/
    const numericMatch = text.match(numericDateRegex)
    if (numericMatch) {
        const [_, day, month, year] = numericMatch
        const parsedDate = new Date(`${year}-${month}-${day}T12:00:00.000Z`)
        if (!isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString()
        }
    }

    return null
}

export const processUploadAnalytics = async (
    uploadId: string,
) => {
    const upload = await getUploadById(uploadId)

    if (!upload) {
        throw new Error('upload not found')
    }

    if (upload.status === 'processed') {
        throw new Error('upload already processed')
    }

    const existingPlayerStats = await getPlayerStatsByGameId(upload.game_id)
    const existingTeamStats = await getTeamStatsByGameId(upload.game_id)

    if (existingPlayerStats.length > 0 || existingTeamStats.length > 0) {
        throw new Error('stats already processed for this game')
    }

    const gameDetails = await getGameDetailsById(upload.game_id)
    const extractedText = await extractTextFromPdf(upload.file_path)

    const pdfMatchesGameTeams =
        teamNamesMatch(extractedText, gameDetails.home_team_name) &&
        teamNamesMatch(extractedText, gameDetails.away_team_name)

    if (!pdfMatchesGameTeams) {
        throw new Error(
            'uploaded PDF does not match the selected game teams',
        )
    }

    // Extraer y actualizar automáticamente la fecha real del partido desde el texto del PDF
    const extractedDate = extractDateFromPdfText(extractedText)
    if (extractedDate) {
        try {
            await updateGameDate(upload.game_id, extractedDate)
        } catch (err) {
            console.error('Failed to auto-update game date from PDF', err)
        }
    }

    const parsedPlayerStats = parsePlayerStatsFromText(
        extractedText,
        upload.game_id,
    )

    const playersToSync = parsedPlayerStats.map((stat) => {
        const isHome = teamNamesMatch(stat.team_name, gameDetails.home_team_name)
        const teamId = isHome ? gameDetails.home_team_id : gameDetails.away_team_id

        return {
            team_id: teamId,
            number: Number(stat.player_number) || 0,
            full_name: stat.player_name,
        }
    })

    if (playersToSync.length > 0) {
        console.log('Syncing players with Management API...', playersToSync.length)
        await syncPlayersWithManagementApi(playersToSync)
    }

    const parsedTeamStats =
        parseTeamStatsFromPlayerStats(parsedPlayerStats)

    const createdPlayerStats =
        await createPlayerStats(parsedPlayerStats)

    const createdTeamStats =
        await createTeamStats(parsedTeamStats)

    const homeTeamStats = createdTeamStats.find(
        (teamStat) => teamNamesMatch(teamStat.team_name, gameDetails.home_team_name),
    )

    const awayTeamStats = createdTeamStats.find(
        (teamStat) => teamNamesMatch(teamStat.team_name, gameDetails.away_team_name),
    )

    if (!homeTeamStats || !awayTeamStats) {
        throw new Error('could not calculate game result from team stats')
    }

    const updatedGame = await updateGameResult(
        upload.game_id,
        homeTeamStats.points,
        awayTeamStats.points,
    )

    const processedUpload = await markUploadAsProcessed(
        upload.id,
        new Date(),
    )

    return {
        upload: processedUpload,
        game: updatedGame,
        player_stats: createdPlayerStats,
        team_stats: createdTeamStats,
    }
}