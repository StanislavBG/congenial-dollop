import { SpawnPattern } from './SpawnTypes';
import { spawnUtils } from '../utils/SpawnUtils';

/**
 * Predefined spawn patterns with overlap prevention
 */
export const SPAWN_PATTERNS: Record<string, SpawnPattern> = {
  
  circle: {
    id: 'circle',
    name: 'Circle Formation',
    positions: (centerX: number, centerY: number, count: number, existingEnemies: any[], minDistance: number) => {
      return spawnUtils.generateCirclePositions(centerX, centerY, count, existingEnemies, minDistance);
    }
  },

  square: {
    id: 'square',
    name: 'Square Formation',
    positions: (centerX: number, centerY: number, count: number, existingEnemies: any[], minDistance: number) => {
      return spawnUtils.generateSquarePositions(centerX, centerY, count, existingEnemies, minDistance);
    }
  },

  random: {
    id: 'random',
    name: 'Random Spread',
    positions: (centerX: number, centerY: number, count: number, existingEnemies: any[], minDistance: number) => {
      return spawnUtils.generateRandomPositions(centerX, centerY, count, existingEnemies, minDistance);
    }
  },

  line: {
    id: 'line',
    name: 'Line Formation',
    positions: (centerX: number, centerY: number, count: number, existingEnemies: any[], minDistance: number) => {
      const positions: Array<{x: number, y: number}> = [];
      const spacing = Math.max(minDistance, 40);
      const totalWidth = (count - 1) * spacing;
      const startX = centerX - totalWidth / 2;
      
      for (let i = 0; i < count; i++) {
        const x = startX + i * spacing;
        const y = centerY;
        
        if (!spawnUtils.hasOverlap(x, y, existingEnemies, minDistance)) {
          positions.push({x, y});
        } else {
          const validPos = spawnUtils.findValidPosition(centerX, centerY, existingEnemies, minDistance);
          if (validPos) {
            positions.push(validPos);
          }
        }
      }
      
      return positions;
    }
  },

  cross: {
    id: 'cross',
    name: 'Cross Formation',
    positions: (centerX: number, centerY: number, count: number, existingEnemies: any[], minDistance: number) => {
      const positions: Array<{x: number, y: number}> = [];
      const spacing = Math.max(minDistance, 50);
      
      // Center point
      if (count > 0 && !spawnUtils.hasOverlap(centerX, centerY, existingEnemies, minDistance)) {
        positions.push({x: centerX, y: centerY});
      }
      
      // Cross arms
      const directions = [
        {dx: 1, dy: 0},   // right
        {dx: -1, dy: 0},  // left
        {dx: 0, dy: 1},   // down
        {dx: 0, dy: -1}   // up
      ];
      
      let placed = positions.length;
      let distance = spacing;
      
      while (placed < count && distance < 300) {
        for (const dir of directions) {
          if (placed >= count) break;
          
          const x = centerX + dir.dx * distance;
          const y = centerY + dir.dy * distance;
          
          if (!spawnUtils.hasOverlap(x, y, existingEnemies, minDistance)) {
            positions.push({x, y});
            placed++;
          }
        }
        distance += spacing;
      }
      
      return positions;
    }
  },

  corners: {
    id: 'corners',
    name: 'Corner Formation',
    positions: (_centerX: number, _centerY: number, count: number, existingEnemies: any[], minDistance: number) => {
      const positions: Array<{x: number, y: number}> = [];
      const cornerPositions = [
        {x: 100, y: 100},   // top-left
        {x: 700, y: 100},   // top-right
        {x: 100, y: 500},   // bottom-left
        {x: 700, y: 500},   // bottom-right
        {x: 400, y: 50},    // top-center
        {x: 400, y: 550},   // bottom-center
        {x: 50, y: 300},    // left-center
        {x: 750, y: 300}    // right-center
      ];
      
      for (let i = 0; i < Math.min(count, cornerPositions.length); i++) {
        const pos = cornerPositions[i];
        if (!spawnUtils.hasOverlap(pos.x, pos.y, existingEnemies, minDistance)) {
          positions.push(pos);
        } else {
          const validPos = spawnUtils.findValidPosition(pos.x, pos.y, existingEnemies, minDistance);
          if (validPos) {
            positions.push(validPos);
          }
        }
      }
      
      return positions;
    }
  }
};

/**
 * Get a spawn pattern by ID
 */
export function getSpawnPattern(patternId: string): SpawnPattern | null {
  return SPAWN_PATTERNS[patternId] || null;
}

/**
 * Get all available spawn pattern IDs
 */
export function getAvailablePatterns(): string[] {
  return Object.keys(SPAWN_PATTERNS);
} 