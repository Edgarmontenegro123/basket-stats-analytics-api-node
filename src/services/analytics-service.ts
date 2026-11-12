import path from 'path'
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

    const normalizedText = text.replace(/\s+/g, ' ')
    const yearMatchIndex = normalizedText.search(/20\d{2}/)

    if (yearMatchIndex !== -1) {
        const snippet = normalizedText.substring(Math.max(0, yearMatchIndex - 40), Math.min(normalizedText.length, yearMatchIndex + 40))
        console.log('DEBUG - Contexto alrededor del año en el PDF:', snippet)
    } else {
        console.log('DEBUG - No se encontró ningún año 20xx en el texto extraído del PDF.')
    }

    let match

    // 1. Formato Mes Día Año
    const mdyRegex = /\b([a-záéíóú]+)[\s.,-]+(\d{1,2})[\s.,-]+(\d{4})\b/gi
    while ((match = mdyRegex.exec(normalizedText)) !== null) {
        const [, monthStr, dayStr, yearStr] = match
        const result = parseAndValidateDate(dayStr, monthStr, yearStr)
        if (result) return result
    }

    // 2. Formato Día Mes Año
    const dmyRegex = /\b(\d{1,2})[\s.,-]+(?:de\s+)?([a-záéíóú]+)[\s.,-]+(?:de\s+)?(\d{4})\b/gi
    while ((match = dmyRegex.exec(normalizedText)) !== null) {
        const [, dayStr, monthStr, yearStr] = match
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

// Helper principal que combina la extracción del texto y el fallback del nombre del archivo
const extractDateFromPdfOrPath = (filePath: string, text: string): string | null => {
    // 1. Intentar desde el texto del PDF
    const dateFromText = extractDateFromPdfText(text)
    if (dateFromText) {
        return dateFromText
    }

    // 2. Fallback robusto desde el nombre del archivo (ej. "..._04-05-2025_...")
    if (!filePath) return null
    const fileName = path.basename(filePath)
    console.log('DEBUG - Fallback: Intentando extraer fecha del nombre de archivo:', fileName)

    const filenameDateRegex = /(\d{2})[-_](\d{2})[-_](\d{4})/
    const match = fileName.match(filenameDateRegex)
    if (match) {
        const [, dayStr, monthStr, yearStr] = match
        const day = parseInt(dayStr, 10)
        const month = parseInt(monthStr, 10) - 1
        const year = parseInt(yearStr, 10)
        const date = new Date(Date.UTC(year, month, day, 12, 0, 0))

        if (!isNaN(date.getTime())) {
            console.log('DEBUG - Fecha extraída exitosamente del nombre de archivo:', date.toISOString())
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

    // Usamos nuestro extractor con fallback al nombre de archivo
    const extractedDateResult = extractDateFromPdfOrPath(upload.file_path, extractedText)
    console.log('DEBUG - Fecha final detectada:', extractedDateResult)

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