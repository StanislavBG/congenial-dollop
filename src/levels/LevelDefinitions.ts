import { Level } from '../types/SpawnTypes';

/**
 * Level definitions using the new group-based system
 * Each level contains groups of enemies that spawn at specific times
 */

export const LEVELS: Record<number, Level> = {
  
  1: {
    id: 1,
    name: "Level 1",
    groups: [
      {
        startTime: 1.5,
        enemyCount: 3,
        enemyType: 'redDot',
        epicenterStrategy: 'TOP_LEFT',
        spawnPattern: 'circle',
        minDistance: 40
      },
      {
        startTime: 3.5,
        enemyCount: 3,
        enemyType: 'redDot',
        epicenterStrategy: 'TOP_MIDDLE',
        spawnPattern: 'circle',
        minDistance: 40
      },
      {
        startTime: 5.5,
        enemyCount: 3,
        enemyType: 'redDot',
        epicenterStrategy: 'TOP_RIGHT',
        spawnPattern: 'circle',
        minDistance: 40
      },
      {
        startTime: 7.5,
        enemyCount: 3,
        enemyType: 'redDot',
        epicenterStrategy: 'BOTTOM_LEFT',
        spawnPattern: 'circle',
        minDistance: 40
      },
      {
        startTime: 9.5,
        enemyCount: 3,
        enemyType: 'redDot',
        epicenterStrategy: 'BOTTOM_MIDDLE',
        spawnPattern: 'circle',
        minDistance: 40
      },
      {
        startTime: 11.5,
        enemyCount: 3,
        enemyType: 'redDot',
        epicenterStrategy: 'BOTTOM_RIGHT',
        spawnPattern: 'circle',
        minDistance: 40
      }
    ],
    scoreToComplete: 180 // 18 enemies × 10 points each
  },

  2: {
    id: 2,
    name: "Level 2",
    groups: [
      // Early red dots
      { startTime: 1.5, enemyCount: 4, enemyType: 'redDot', epicenterStrategy: 'TOP_LEFT', spawnPattern: 'circle', minDistance: 35 },
      { startTime: 4.5, enemyCount: 4, enemyType: 'redDot', epicenterStrategy: 'TOP_RIGHT', spawnPattern: 'circle', minDistance: 35 },
      // Yellow dots start appearing
      { startTime: 7.0, enemyCount: 3, enemyType: 'yellowDot', epicenterStrategy: 'BOTTOM_LEFT', spawnPattern: 'circle', minDistance: 35 },
      { startTime: 8.5, enemyCount: 4, enemyType: 'yellowDot', epicenterStrategy: 'BOTTOM_RIGHT', spawnPattern: 'circle', minDistance: 35 },
      // Randomized mixed group
      { startTime: 10.0, enemyCount: 2 + Phaser.Math.Between(0, 1), enemyType: 'redDot', epicenterStrategy: 'TOP_MIDDLE', spawnPattern: 'circle', minDistance: 35 },
      { startTime: 11.0, enemyCount: 2 + Phaser.Math.Between(0, 2), enemyType: 'yellowDot', epicenterStrategy: 'BOTTOM_MIDDLE', spawnPattern: 'circle', minDistance: 35 }
    ],
    scoreToComplete: 160 // 16+ enemies × 10 points each
  },

  // Test levels for fast iteration
  101: {
    id: 101,
    name: "Level-1-Test",
    groups: [
      {
        startTime: 1.5,
        enemyCount: 3,
        enemyType: 'redDot',
        epicenterStrategy: 'TOP_MIDDLE',
        spawnPattern: 'circle',
        minDistance: 40
      }
    ],
    goldenApples: [
      { x: 400, y: 200, healthBonus: 50 },  // Top
      { x: 500, y: 250, healthBonus: 50 },  // Top-right
      { x: 550, y: 350, healthBonus: 50 },  // Right
      { x: 500, y: 450, healthBonus: 50 },  // Bottom-right
      { x: 400, y: 500, healthBonus: 50 },  // Bottom
      { x: 300, y: 450, healthBonus: 50 },  // Bottom-left
      { x: 250, y: 350, healthBonus: 50 },  // Left
      { x: 300, y: 250, healthBonus: 50 },  // Top-left
      { x: 350, y: 200, healthBonus: 50 },  // Top-left-center
      { x: 450, y: 200, healthBonus: 50 }   // Top-right-center
    ],
    scoreToComplete: 30 // 3 enemies × 10 points each
  },

  102: {
    id: 102,
    name: "Level-2-Test",
    groups: [
      {
        startTime: 1.5,
        enemyCount: 3,
        enemyType: 'yellowDot',
        epicenterStrategy: 'BOTTOM_MIDDLE',
        spawnPattern: 'circle',
        minDistance: 40
      }
    ],
    goldenApples: [
      { x: 300, y: 150, healthBonus: 75 },
      { x: 500, y: 450, healthBonus: 75 },
      { x: 400, y: 300, healthBonus: 100 }
    ],
    scoreToComplete: 30 // 3 enemies × 10 points each
  },

  103: {
    id: 103,
    name: "Level-3-Test-Boss",
    groups: [
      {
        startTime: 1.5,
        enemyCount: 1,
        enemyType: 'blueDot',
        epicenterStrategy: 'TOP_MIDDLE',
        spawnPattern: 'circle',
        minDistance: 50
      }
    ],
    goldenApples: [
      { x: 400, y: 200, healthBonus: 100 },
      { x: 400, y: 400, healthBonus: 100 }
    ],
    scoreToComplete: 10 // 1 boss enemy × 10 points
  },

  3: {
    id: 3,
    name: "Level-3-Two-Blue-Dots",
    groups: [
      {
        startTime: 1.5,
        enemyCount: 2,
        enemyType: 'blueDot',
        epicenterStrategy: 'TOP_MIDDLE',
        spawnPattern: 'circle',
        minDistance: 80
      }
    ],
    goldenApples: [
      { x: 400, y: 200, healthBonus: 100 },
      { x: 400, y: 400, healthBonus: 100 }
    ],
    scoreToComplete: 20 // 2 boss enemies × 10 points
  }
};

/**
 * Get a level by ID
 */
export function getLevel(levelId: number): Level | null {
  return LEVELS[levelId] || null;
}

/**
 * Get available level IDs in order
 */
export function getAvailableLevels(): number[] {
  return Object.keys(LEVELS).map(Number).sort((a, b) => a - b);
}

/**
 * Get available production level IDs (1, 2)
 */
export function getProductionLevels(): number[] {
  return [1, 2, 3];
}

/**
 * Get available test level IDs (101, 102, 103)
 */
export function getTestLevels(): number[] {
  return [101, 102, 103];
}

/**
 * Get the next level ID
 */
export function getNextLevel(currentLevelId: number): number | null {
  // Handle production levels (1 -> 2 -> 3)
  if (currentLevelId === 1) return 2;
  if (currentLevelId === 2) return 3;
  if (currentLevelId === 3) return null; // End of production levels
  
  // Handle test levels (101 -> 102 -> 103)
  if (currentLevelId === 101) return 102;
  if (currentLevelId === 102) return 103;
  if (currentLevelId === 103) return null; // End of test levels
  
  return null;
}

/**
 * Get the previous level ID
 */
export function getPreviousLevel(currentLevelId: number): number | null {
  // Handle production levels (2 -> 1)
  if (currentLevelId === 2) return 1;
  
  // Handle test levels (103 -> 102 -> 101)
  if (currentLevelId === 103) return 102;
  if (currentLevelId === 102) return 101;
  
  return null;
}

/**
 * Get total number of levels
 */
export function getTotalLevels(): number {
  return Object.keys(LEVELS).length;
} 