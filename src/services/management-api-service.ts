import { GameDetails } from '../models/game-details';

export const getGameDetailsById = async (
    gameId: string,
): Promise<GameDetails> => {
    const managementApiUrl = process.env.MANAGEMENT_API_URL;

    if (!managementApiUrl) {
        throw new Error('MANAGEMENT_API_URL is not configured');
    }

    const response = await fetch(`${managementApiUrl}/games/${gameId}`);

    if (!response.ok) {
        throw new Error('Error getting game details from Management API');
    }

    return response.json();
};

export const updateGameResult = async (
    gameId: string,
    homeScore: number,
    awayScore: number,
) => {
    const managementApiUrl = process.env.MANAGEMENT_API_URL;

    if (!managementApiUrl) {
        throw new Error('MANAGEMENT_API_URL is not configured');
    }

    const response = await fetch(
        `${managementApiUrl}/games/${gameId}/result`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                home_score: homeScore,
                away_score: awayScore,
                status: 'completed',
            }),
        },
    );

    if (!response.ok) {
        throw new Error('Error updating game result');
    }

    return response.json();
};