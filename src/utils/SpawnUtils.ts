import { SpawnUtilities } from '../types/SpawnTypes';

/**
 * Core spawn utilities for overlap prevention
 */
export class SpawnUtils implements SpawnUtilities {
  
  /**
   * Calculate distance between two positions
   */
  distance(pos1: {x: number, y: number}, pos2: {x: number, y: number}): number {
    return Phaser.Math.Distance.Between(pos1.x, pos1.y, pos2.x, pos2.y);
  }

  /**
   * Check if a position overlaps with existing enemies
   */
  hasOverlap(x: number, y: number, enemies: any[], minDistance: number): boolean {
    for (const enemy of enemies) {
      const distance = this.distance({x, y}, {x: enemy.x, y: enemy.y});
      if (distance < minDistance) {
        return true;
      }
    }
    return false;
  }

  /**
   * Find a valid position that doesn't overlap with existing enemies
   * Uses spiral search pattern from center outward
   */
  findValidPosition(
    centerX: number, 
    centerY: number, 
    enemies: any[], 
    minDistance: number,
    maxAttempts: number = 50
  ): {x: number, y: number} | null {
    
    // Start from center
    if (!this.hasOverlap(centerX, centerY, enemies, minDistance)) {
      return {x: centerX, y: centerY};
    }

    // Spiral search pattern
    let radius = minDistance;
    let angle = 0;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      // Calculate position on spiral
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // Check bounds (800x600 play area)
      if (x >= 0 && x <= 800 && y >= 0 && y <= 600) {
        if (!this.hasOverlap(x, y, enemies, minDistance)) {
          return {x, y};
        }
      }
      
      // Move along spiral
      angle += 0.5; // radians
      radius += minDistance * 0.1; // gradually increase radius
      attempts++;
    }
    
    // If no valid position found, return null
    return null;
  }

  /**
   * Generate positions for a circle pattern with overlap prevention
   * Creates multiple concentric circles if needed
   */
  generateCirclePositions(
    epicenterX: number,
    epicenterY: number,
    count: number,
    enemies: any[],
    minDistance: number,
    baseRadius: number = 50
  ): Array<{x: number, y: number}> {
    const positions: Array<{x: number, y: number}> = [];
    const maxEnemiesPerCircle = Math.floor(2 * Math.PI * baseRadius / minDistance);
    const circlesNeeded = Math.ceil(count / maxEnemiesPerCircle);
    
    let enemyIndex = 0;
    
    for (let circleIndex = 0; circleIndex < circlesNeeded && enemyIndex < count; circleIndex++) {
      const radius = baseRadius + (circleIndex * minDistance * 1.5);
      const enemiesInThisCircle = Math.min(
        maxEnemiesPerCircle + (circleIndex * 2), // More enemies in outer circles
        count - enemyIndex
      );
      
      for (let i = 0; i < enemiesInThisCircle && enemyIndex < count; i++) {
        const angle = (i / enemiesInThisCircle) * 2 * Math.PI;
        let currentRadius = radius;
        let x = epicenterX + Math.cos(angle) * currentRadius;
        let y = epicenterY + Math.sin(angle) * currentRadius;
        
        // Check overlap and expand circle if needed
        let attempts = 0;
        while (this.hasOverlap(x, y, enemies, minDistance) && attempts < 10) {
          currentRadius += minDistance * 0.3;
          x = epicenterX + Math.cos(angle) * currentRadius;
          y = epicenterY + Math.sin(angle) * currentRadius;
          attempts++;
        }
        
        // If still overlapping, try to find valid position
        if (this.hasOverlap(x, y, enemies, minDistance)) {
          const validPos = this.findValidPosition(epicenterX, epicenterY, enemies, minDistance);
          if (validPos) {
            positions.push(validPos);
          } else {
            // Fallback: place at edge of screen
            positions.push({
              x: Math.max(0, Math.min(800, x)),
              y: Math.max(0, Math.min(600, y))
            });
          }
        } else {
          positions.push({x, y});
        }
        
        enemyIndex++;
      }
    }
    
    return positions;
  }

  /**
   * Generate positions for a square pattern with overlap prevention
   */
  generateSquarePositions(
    centerX: number,
    centerY: number,
    count: number,
    enemies: any[],
    minDistance: number,
    baseSize: number = 100
  ): Array<{x: number, y: number}> {
    const positions: Array<{x: number, y: number}> = [];
    const sideLength = Math.ceil(Math.sqrt(count));
    const spacing = baseSize / sideLength;
    
    let index = 0;
    for (let row = 0; row < sideLength && index < count; row++) {
      for (let col = 0; col < sideLength && index < count; col++) {
        const x = centerX - baseSize/2 + col * spacing;
        const y = centerY - baseSize/2 + row * spacing;
        
        if (!this.hasOverlap(x, y, enemies, minDistance)) {
          positions.push({x, y});
        } else {
          const validPos = this.findValidPosition(centerX, centerY, enemies, minDistance);
          if (validPos) {
            positions.push(validPos);
          }
        }
        index++;
      }
    }
    
    return positions;
  }

  /**
   * Generate random positions with overlap prevention
   */
  generateRandomPositions(
    centerX: number,
    centerY: number,
    count: number,
    enemies: any[],
    minDistance: number,
    spreadRadius: number = 150
  ): Array<{x: number, y: number}> {
    const positions: Array<{x: number, y: number}> = [];
    
    for (let i = 0; i < count; i++) {
      let attempts = 0;
      let x: number, y: number;
      
      do {
        const angle = Phaser.Math.Between(0, 2 * Math.PI);
        const distance = Phaser.Math.Between(0, spreadRadius);
        x = centerX + Math.cos(angle) * distance;
        y = centerY + Math.sin(angle) * distance;
        
        // Keep within bounds
        x = Math.max(0, Math.min(800, x));
        y = Math.max(0, Math.min(600, y));
        
        attempts++;
      } while (this.hasOverlap(x, y, enemies, minDistance) && attempts < 30);
      
      // If still overlapping after attempts, find valid position
      if (this.hasOverlap(x, y, enemies, minDistance)) {
        const validPos = this.findValidPosition(centerX, centerY, enemies, minDistance);
        if (validPos) {
          positions.push(validPos);
        } else {
          positions.push({x, y}); // fallback
        }
      } else {
        positions.push({x, y});
      }
    }
    
    return positions;
  }
}

// Export singleton instance
export const spawnUtils = new SpawnUtils(); 