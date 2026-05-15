CREATE TABLE IF NOT EXISTS uploads (
                                       id TEXT PRIMARY KEY,
                                       game_id TEXT NOT NULL,
                                       file_name TEXT NOT NULL,
                                       file_type TEXT NOT NULL,
                                       file_path TEXT NOT NULL,
                                       status TEXT NOT NULL,
                                       uploaded_at TIMESTAMP NOT NULL,
                                       processed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS player_stats (
                                            id TEXT PRIMARY KEY,
                                            game_id TEXT NOT NULL,
                                            team_name TEXT NOT NULL,
                                            player_number TEXT,
                                            player_name TEXT NOT NULL,
                                            minutes TEXT,
                                            is_starter BOOLEAN NOT NULL,
                                            points INTEGER NOT NULL,
                                            rebounds INTEGER NOT NULL,
                                            assists INTEGER NOT NULL,
                                            turnovers INTEGER NOT NULL,
                                            steals INTEGER NOT NULL,
                                            blocks INTEGER NOT NULL,
                                            created_at TIMESTAMP NOT NULL,
                                            updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS team_stats (
                                          id TEXT PRIMARY KEY,
                                          game_id TEXT NOT NULL,
                                          team_name TEXT NOT NULL,
                                          points INTEGER NOT NULL,
                                          rebounds INTEGER NOT NULL,
                                          assists INTEGER NOT NULL,
                                          turnovers INTEGER NOT NULL,
                                          steals INTEGER NOT NULL,
                                          blocks INTEGER NOT NULL,
                                          created_at TIMESTAMP NOT NULL,
                                          updated_at TIMESTAMP NOT NULL
);