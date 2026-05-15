export type PlayerStat = {
    id: string;
    game_id: string;
    team_name: string;
    player_number: string;
    player_name: string;
    minutes: string;
    is_starter: boolean;
    points: number;
    rebounds: number;
    assists: number;
    turnovers: number;
    steals: number;
    blocks: number;
    created_at: string;
    updated_at: string;
};