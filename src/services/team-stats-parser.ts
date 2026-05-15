import { TeamStat } from '../models/team-stat';

export const parseTeamStatsFromPlayerStats = (
    playerStats: {
        game_id: string;
        team_name: string;
        points: number;
        rebounds: number;
        assists: number;
    }[],
): TeamStat[] => {
    const now = new Date().toISOString();
    const statsByTeam = new Map<string, TeamStat>();

    for (const player of playerStats) {
        const existingTeamStat = statsByTeam.get(player.team_name);

        if (!existingTeamStat) {
            statsByTeam.set(player.team_name, {
                id: `${Date.now()}-${player.team_name}`,
                game_id: player.game_id,
                team_name: player.team_name,
                points: player.points,
                rebounds: player.rebounds,
                assists: player.assists,
                turnovers: 0,
                created_at: now,
                updated_at: now,
            });

            continue;
        }

        existingTeamStat.points += player.points;
        existingTeamStat.rebounds += player.rebounds;
        existingTeamStat.assists += player.assists;
        existingTeamStat.updated_at = now;
    }

    return Array.from(statsByTeam.values());
};