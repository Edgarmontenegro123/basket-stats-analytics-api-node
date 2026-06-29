import { pool } from '../db/pool'

export const deleteStatsByGameId = async (gameId: string) => {
    await pool.query(
        'DELETE FROM player_stats WHERE game_id = $1',
        [gameId],
    )

    await pool.query(
        'DELETE FROM team_stats WHERE game_id = $1',
        [gameId],
    )

    await pool.query(
        'DELETE FROM uploads WHERE game_id = $1',
        [gameId],
    )
}