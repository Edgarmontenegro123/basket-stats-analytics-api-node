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