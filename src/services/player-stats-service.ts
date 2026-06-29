import { pool } from '../db/pool'
import { PlayerStat, PlayerRankingStat } from '../models/player-stat'
import { normaliseText } from '../helpers/normalise-text'

const getPlayerNameVariants = (playerName: string) => {
    const normalisedName = normaliseText(playerName)
    const parts = normalisedName.split(' ').filter(Boolean)

    if (parts.length < 2) {
        return [normalisedName]
    }

    const reversedName = [...parts].reverse().join(' ')

    return [normalisedName, reversedName]
}

export const createPlayerStats = async (
    stats: PlayerStat[],
): Promise<PlayerStat[]> => {
    if (stats.length === 0) {
        return [];
    }

    const createdStats: PlayerStat[] = [];

    for (const stat of stats) {
        const result = await pool.query(
            `
            INSERT INTO player_stats (
                id,
                game_id,
                team_name,
                player_number,
                player_name,
                minutes,
                is_starter,
                points,
                rebounds,
                assists,
                turnovers,
                steals,
                blocks,
                created_at,
                updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15
            )
            RETURNING *
            `,
            [
                stat.id,
                stat.game_id,
                stat.team_name,
                stat.player_number,
                stat.player_name,
                stat.minutes,
                stat.is_starter,
                stat.points,
                stat.rebounds,
                stat.assists,
                stat.turnovers,
                stat.steals,
                stat.blocks,
                stat.created_at,
                stat.updated_at,
            ],
        );

        createdStats.push(result.rows[0]);
    }

    return createdStats;
};

export const getPlayerStatsByGameId = async (
    gameId: string,
): Promise<PlayerStat[]> => {
    const result = await pool.query(
        `
        SELECT *
        FROM player_stats
        WHERE game_id = $1
        ORDER BY points DESC
        `,
        [gameId],
    );

    return result.rows;
};

export const getTopPlayersByStat = async (
    stat: PlayerRankingStat,
    limit: number = 5,
): Promise<PlayerStat[]> => {
    const allowedStats: PlayerRankingStat[] = [
        'points',
        'rebounds',
        'assists',
        'steals',
        'blocks',
    ];

    if (!allowedStats.includes(stat)) {
        throw new Error('invalid stat');
    }

    const query = `
        SELECT *
        FROM player_stats
        ORDER BY ${stat} DESC
        LIMIT $1
    `;

    const result = await pool.query(query, [limit]);

    return result.rows;
};

export const getAggregatedPlayersRanking = async (
    stat: PlayerRankingStat,
    limit: number = 10,
) => {
    const allowedStats: PlayerRankingStat[] = [
        'points',
        'rebounds',
        'assists',
        'steals',
        'blocks',
    ];

    if (!allowedStats.includes(stat)) {
        throw new Error('invalid stat');
    }

    const query = `
        SELECT
            player_name,
            team_name,
            COUNT(DISTINCT game_id) AS games_played,
            SUM(${stat}) AS total,
            ROUND(AVG(${stat})::numeric, 2) AS average
        FROM player_stats
        GROUP BY player_name, team_name
        ORDER BY total DESC
        LIMIT $1
    `;

    const result = await pool.query(query, [limit]);

    return result.rows;
};

export const getPlayerSummaryByName = async (
    playerName: string,
) => {
    const playerNameVariants = getPlayerNameVariants(playerName)

    const result = await pool.query(
        `
        SELECT
            player_name,
            team_name,
            game_id,
            points,
            rebounds,
            assists,
            turnovers,
            steals,
            blocks
        FROM player_stats
        `,
    )

    const matchingStats = result.rows.filter((stat) => {
        const normalisedPlayerName = normaliseText(stat.player_name)

        return playerNameVariants.includes(normalisedPlayerName)
    })

    if (matchingStats.length === 0) {
        return null
    }

    const gamesPlayed = new Set(
        matchingStats.map((stat) => stat.game_id),
    ).size

    const totalPoints = matchingStats.reduce(
        (total, stat) => total + Number(stat.points || 0),
        0,
    )

    const totalRebounds = matchingStats.reduce(
        (total, stat) => total + Number(stat.rebounds || 0),
        0,
    )

    const totalAssists = matchingStats.reduce(
        (total, stat) => total + Number(stat.assists || 0),
        0,
    )

    const totalTurnovers = matchingStats.reduce(
        (total, stat) => total + Number(stat.turnovers || 0),
        0,
    )

    const totalSteals = matchingStats.reduce(
        (total, stat) => total + Number(stat.steals || 0),
        0,
    )

    const totalBlocks = matchingStats.reduce(
        (total, stat) => total + Number(stat.blocks || 0),
        0,
    )

    const roundAverage = (value: number) => {
        return Number(value.toFixed(2))
    }

    return {
        player_name: matchingStats[0].player_name,
        team_name: matchingStats[0].team_name,
        games_played: gamesPlayed,
        total_points: totalPoints,
        total_rebounds: totalRebounds,
        total_assists: totalAssists,
        total_turnovers: totalTurnovers,
        total_steals: totalSteals,
        total_blocks: totalBlocks,
        average_points: roundAverage(totalPoints / gamesPlayed),
        average_rebounds: roundAverage(totalRebounds / gamesPlayed),
        average_assists: roundAverage(totalAssists / gamesPlayed),
        average_turnovers: roundAverage(totalTurnovers / gamesPlayed),
        average_steals: roundAverage(totalSteals / gamesPlayed),
        average_blocks: roundAverage(totalBlocks / gamesPlayed),
    }
}
