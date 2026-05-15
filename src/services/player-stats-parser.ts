import { PlayerStat } from '../models/player-stat';


const isTableHeader = (line: string): boolean => {
    return line.includes('Nº') && line.includes('Jugador');
};

const isIgnoredLine = (line: string): boolean => {
    return (
        line.startsWith('--') ||
        line.includes('basketstatsapp.com') ||
        line.startsWith('Total') ||
        isTableHeader(line)
    );
};

const startsWithPlayerNumber = (line: string): boolean => {
    return /^\d{1,2}\s/.test(line);
};

const hasMinutes = (line: string): boolean => {
    return /\d{2}:\d{2}/.test(line);
};

export const parsePlayerStatsFromText = (
    text: string,
    gameId: string,
): PlayerStat[] => {
    const now = new Date().toISOString();
    const stats: PlayerStat[] = [];

    const lines = text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    let currentTeam = '';
    let currentPlayerLine = '';

    for (const line of lines) {
        const nextLineIndex = lines.indexOf(line) + 1;
        const nextLine = lines[nextLineIndex];

        if (nextLine && isTableHeader(nextLine)) {
            currentTeam = line;
            currentPlayerLine = '';
            continue;
        }

        if (!currentTeam) {
            continue;
        }

        if (isIgnoredLine(line)) {
            currentPlayerLine = '';
            continue;
        }

        if (startsWithPlayerNumber(line)) {
            currentPlayerLine = line;
        } else if (currentPlayerLine) {
            currentPlayerLine = `${currentPlayerLine} ${line}`;
        }

        if (!currentPlayerLine || !hasMinutes(currentPlayerLine)) {
            continue;
        }

        const parts = currentPlayerLine.split(/\s+/);
        const minutesIndex = parts.findIndex((part) => /^\d{2}:\d{2}$/.test(part));

        if (minutesIndex === -1) {
            continue;
        }

        const playerNumber = parts[0];

        const isStarter = parts.includes('*');
        const minutes = parts[minutesIndex];

        const rawPlayerName = parts
            .slice(1, minutesIndex)
            .join(' ')
            .replace('*', '')
            .replace(/\./g, '')
            .trim();

        const playerName = rawPlayerName.replace(
            /([a-z])\s([a-z])/g,
            '$1$2',
        );

        const points = Number(parts[minutesIndex + 1]);
        const rebounds = Number(parts[minutesIndex + 16]);
        const assists = Number(parts[minutesIndex + 17]);

        if (
            Number.isNaN(points) ||
            Number.isNaN(rebounds) ||
            Number.isNaN(assists)
        ) {
            currentPlayerLine = '';
            continue;
        }

        stats.push({
            id: `${Date.now()}-${playerNumber}-${stats.length}`,
            game_id: gameId,
            team_name: currentTeam,
            player_number: playerNumber,
            player_name: playerName,
            minutes,
            is_starter: isStarter,
            points,
            rebounds,
            assists,
            created_at: now,
            updated_at: now,
        });

        currentPlayerLine = '';
    }

    return stats;
};