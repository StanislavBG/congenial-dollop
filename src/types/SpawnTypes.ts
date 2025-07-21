/**
 * Global epicenter positions for spawn points
 */
export const GLOBAL_EPICENTERS = {
  TOP_LEFT: { x: 150, y: 150 },
  TOP_MIDDLE: { x: 400, y: 150 },
  TOP_RIGHT: { x: 650, y: 150 },
  BOTTOM_LEFT: { x: 150, y: 450 },
  BOTTOM_MIDDLE: { x: 400, y: 450 },
  BOTTOM_RIGHT: { x: 650, y: 450 }
};

/**
 * Epicenter selection strategy
 */
export type EpicenterStrategy = 
  | 'TOP_LEFT'
  | 'TOP_MIDDLE' 
  | 'TOP_RIGHT'
  | 'BOTTOM_LEFT'
  | 'BOTTOM_MIDDLE'
  | 'BOTTOM_RIGHT'
  | 'RANDOM'
  | 'RANDOM_TOP'
  | 'RANDOM_BOTTOM';

/**
 * Enemy group definition
 */
export interface EnemyGroup {
  startTime: number;
  enemyCount: number;
  enemyType: string;
  epicenterStrategy: EpicenterStrategy; // Changed from spawnEpicenter
  spawnPattern: string;
  minDistance: number;
}

/**
 * Level definition
 */
export interface Level {
  id: number;
  name: string;
  groups: EnemyGroup[];
  scoreToComplete: number;
}

/**
 * Spawn pattern interface
 */
export interface SpawnPattern {
  id: string;
  name: string;
  positions: (
    epicenterX: number, 
    epicenterY: number, 
    count: number, 
    existingEnemies: any[], 
    minDistance: number
  ) => Array<{x: number, y: number}>;
}

/**
 * Spawn utilities interface
 */
export interface SpawnUtilities {
  distance(pos1: {x: number, y: number}, pos2: {x: number, y: number}): number;
  hasOverlap(x: number, y: number, enemies: any[], minDistance: number): boolean;
  findValidPosition(centerX: number, centerY: number, enemies: any[], minDistance: number, maxAttempts?: number): {x: number, y: number} | null;
  generateCirclePositions(centerX: number, centerY: number, count: number, enemies: any[], minDistance: number, baseRadius?: number): Array<{x: number, y: number}>;
  generateSquarePositions(centerX: number, centerY: number, count: number, enemies: any[], minDistance: number, baseSize?: number): Array<{x: number, y: number}>;
  generateRandomPositions(centerX: number, centerY: number, count: number, enemies: any[], minDistance: number, spreadRadius?: number): Array<{x: number, y: number}>;
} 