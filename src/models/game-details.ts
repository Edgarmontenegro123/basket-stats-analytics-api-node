export interface GameDetails {
    id: string
    season_id: string
    home_team_id: string
    away_team_id: string
    home_team_name: string
    away_team_name: string
    game_date: string
    location?: string
    is_friendly: boolean
    home_score?: number
    away_score?: number
    status: string
    created_at: string
    updated_at: string
}