export interface Level {
  id: number;
  name: string;
  enemyCount: number;
  enemyHealth: number;
  enemySpeed: number;
  enemyDamage: number;
  spawnPositions: Array<{ x: number; y: number }>;
  scoreToComplete: number;
  enemySpawnInterval: number; // milliseconds between enemy spawns
  spawnPattern: number; // pattern identifier (1 = 4 corners, etc.)
}

export interface GameSettings {
  playerHealth: number;
  shootInterval: number;
  bulletDamage: number;
}

export const GAME_SETTINGS: GameSettings = {
  playerHealth: 500,
  shootInterval: 300,
  bulletDamage: 10
};

export const LEVEL_1: Level = {
  id: 1,
  name: "Level 1",
  enemyCount: 8,
  enemyHealth: 30,
  enemySpeed: 120,
  enemyDamage: 20,
  spawnPositions: [
    { x: 200, y: 150 },  // Top-left area
    { x: 600, y: 150 },  // Top-right area
    { x: 200, y: 450 },  // Bottom-left area
    { x: 600, y: 450 },  // Bottom-right area
    { x: 400, y: 100 },  // Top-center
    { x: 400, y: 500 },  // Bottom-center
    { x: 100, y: 300 },  // Left-center
    { x: 700, y: 300 }   // Right-center
  ],
  scoreToComplete: 80, // 8 enemies × 10 points each
  enemySpawnInterval: 3000, // 3 seconds between spawns (increased frequency)
  spawnPattern: 2 // 8-corner pattern
}; 