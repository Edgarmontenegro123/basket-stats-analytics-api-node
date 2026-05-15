import { pool } from '../db/pool';
import { PlayerStat } from '../models/player-stat';

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