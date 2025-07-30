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
    positions: (_centerX: number, _centerY: number, count: number, existingEnemies: any[], minDistance: number, screenWidth: number = 800, screenHeight: number = 600) => {
      const positions: Array<{x: number, y: number}> = [];
      
      const margin = Math.max(50, Math.floor(screenWidth * 0.05)); // 5% margin, min 50px
      const centerX = screenWidth / 2;
      const centerY = screenHeight / 2;
      
      const cornerPositions = [
        {x: margin, y: margin},   // top-left
        {x: screenWidth - margin, y: margin},   // top-right
        {x: margin, y: screenHeight - margin},   // bottom-left
        {x: screenWidth - margin, y: screenHeight - margin},   // bottom-right
        {x: centerX, y: margin},    // top-center
        {x: centerX, y: screenHeight - margin},   // bottom-center
        {x: margin, y: centerY},    // left-center
        {x: screenWidth - margin, y: centerY}    // right-center
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