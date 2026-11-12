import {extractTextFromPdf} from './pdf-service'
import {parsePlayerStatsFromText} from './player-stats-parser'
import {parseTeamStatsFromPlayerStats} from './team-stats-parser'
import {teamNamesMatch} from '../helpers/team-name-match'
import {normaliseText} from '../helpers/normalise-text'
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

const monthMap: Record<string, number> = {
    ene: 0, enero: 0, jan: 0, january: 0,
    feb: 1, febrero: 1, february: 1,
    mar: 2, marzo: 2, march: 2,
    abr: 3, abril: 3, apr: 3, april: 3,
    may: 4, mayo: 4,
    jun: 5, junio: 5, june: 5,
    jul: 6, julio: 6, july: 6,
    ago: 7, agosto: 7, aug: 7, august: 7,
    sep: 8, septiembre: 8, sept: 8, september: 8,
    oct: 9, octubre: 9, october: 9,
    nov: 10, noviembre: 10, november: 10,
    dic: 11, diciembre: 11, dec: 11, december: 11
}

const parseAndValidateDate = (dayStr: string, monthStr: string, yearStr: string): string | null => {
    // Usamos el helper normaliseText del proyecto adaptado a British English
    const cleanMonth = normaliseText(monthStr)

    if (monthMap[cleanMonth] !== undefined) {
        const day = parseInt(dayStr, 10)
        const month = monthMap[cleanMonth]
        const year = parseInt(yearStr, 10)
        const date = new Date(Date.UTC(year, month, day, 12, 0, 0))

        if (!isNaN(date.getTime())) {
            return date.toISOString()
        }
    }
    return null
}

const extractDateFromPdfText = (text: string): string | null => {
    if (!text) return null

    // Normalizamos espacios múltiples y saltos de línea preservando comas y formatos de fecha
    const normalizedText = text.replace(/\s+/g, ' ')
    console.log('DEBUG - Texto normalizado (primeros 300 caracteres):', normalizedText.substring(0, 300))

    let match

    // 1. Formato "may 4, 2025" (Mes primero)
    const mdyRegex = /\b([a-záéíóú]+)\s+(\d{1,2}),?\s*(\d{4})\b/gi
    while ((match = mdyRegex.exec(normalizedText)) !== null) {
        const [, monthStr, dayStr, yearStr] = match
        console.log('DEBUG - Coincidencia MDY encontrada:', { monthStr, dayStr, yearStr })
        const result = parseAndValidateDate(dayStr, monthStr, yearStr)
        if (result) return result
    }

    // 2. Formato "4 de mayo de 2025" (Día primero)
    const dmyRegex = /\b(\d{1,2})\s*(?:de)?\s+([a-záéíóú]+)\s*(?:de)?\s*,?\s*(\d{4})\b/gi
    while ((match = dmyRegex.exec(normalizedText)) !== null) {
        const [, dayStr, monthStr, yearStr] = match
        console.log('DEBUG - Coincidencia DMY encontrada:', { dayStr, monthStr, yearStr })
        const result = parseAndValidateDate(dayStr, monthStr, yearStr)
        if (result) return result
    }

    // 3. Formato numérico DD/MM/YYYY o DD-MM-YYYY
    const numericDateRegex = /\b(\d{2})[-/](\d{2})[-/](\d{4})\b/
    const numericMatch = normalizedText.match(numericDateRegex)
    if (numericMatch) {
        const [, day, month, year] = numericMatch
        const date = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), 12, 0, 0))
        if (!isNaN(date.getTime())) {
            return date.toISOString()
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

    const extractedDateResult = extractDateFromPdfText(extractedText)
    console.log('DEBUG - Fecha detectada por la regex:', extractedDateResult)

    if (extractedDateResult) {
        try {
            const result = await updateGameDate(upload.game_id, extractedDateResult)
            console.log('DEBUG - Fecha de juego actualizada con éxito en Management API:', result)
        } catch (err) {
            console.error('ERROR CRÍTICO - Falló la actualización automática de la fecha del juego:', err)
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

    const createdPlayerStats =
        await createPlayerStats(parsedPlayerStats)

    const parsedTeamStats =
        parseTeamStatsFromPlayerStats(parsedPlayerStats)

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