import { pool } from '../db/pool';
import { TeamStat } from '../models/team-stat';

export const createTeamStats = async (
    stats: TeamStat[],
): Promise<TeamStat[]> => {
    if (stats.length === 0) {
        return [];
    }

    const createdStats: TeamStat[] = [];

    for (const stat of stats) {
        const result = await pool.query(
            `
            INSERT INTO team_stats (
                id,
                game_id,
                team_name,
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
                $6, $7, $8, $9, $10, $11
            )
            RETURNING *
            `,
            [
                stat.id,
                stat.game_id,
                stat.team_name,
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

export const getTeamStatsByGameId = async (
    gameId: string,
): Promise<TeamStat[]> => {
    const result = await pool.query(
        `
        SELECT *
        FROM team_stats
        WHERE game_id = $1
        ORDER BY points DESC
        `,
        [gameId],
    );

    return result.rows;
};