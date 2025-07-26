import { EnemyGroup, Level, GLOBAL_EPICENTERS, EpicenterStrategy } from '../types/SpawnTypes';
import { getSpawnPattern } from '../types/SpawnPatterns';
import { getEnemyType } from '../types/EnemyTypes';

import { Enemy } from '../entities/Enemy';

/**
 * Manages enemy spawning based on level definitions
 */
export class SpawnManager {
  private currentLevel: Level;
  private levelStartTime: number = 0;
  private spawnedGroups: Set<number> = new Set();
  private previewShownGroups: Set<number> = new Set(); // Track which groups have shown previews
  private enemies: Phaser.GameObjects.Group;
  private scene: Phaser.Scene;
  private epicenterPreview: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, level: Level, enemies: Phaser.GameObjects.Group) {
    this.scene = scene;
    this.currentLevel = level;
    this.enemies = enemies;
  }

  /**
   * Get epicenter coordinates based on strategy
   */
  private getEpicenterCoordinates(strategy: EpicenterStrategy): {x: number, y: number} {
    switch (strategy) {
      case 'TOP_LEFT':
        return GLOBAL_EPICENTERS.TOP_LEFT;
      case 'TOP_MIDDLE':
        return GLOBAL_EPICENTERS.TOP_MIDDLE;
      case 'TOP_RIGHT':
        return GLOBAL_EPICENTERS.TOP_RIGHT;
      case 'BOTTOM_LEFT':
        return GLOBAL_EPICENTERS.BOTTOM_LEFT;
      case 'BOTTOM_MIDDLE':
        return GLOBAL_EPICENTERS.BOTTOM_MIDDLE;
      case 'BOTTOM_RIGHT':
        return GLOBAL_EPICENTERS.BOTTOM_RIGHT;
      case 'RANDOM':
        const allEpicenters = Object.values(GLOBAL_EPICENTERS);
        return allEpicenters[Math.floor(Math.random() * allEpicenters.length)];
      case 'RANDOM_TOP':
        const topEpicenters = [GLOBAL_EPICENTERS.TOP_LEFT, GLOBAL_EPICENTERS.TOP_MIDDLE, GLOBAL_EPICENTERS.TOP_RIGHT];
        return topEpicenters[Math.floor(Math.random() * topEpicenters.length)];
      case 'RANDOM_BOTTOM':
        const bottomEpicenters = [GLOBAL_EPICENTERS.BOTTOM_LEFT, GLOBAL_EPICENTERS.BOTTOM_MIDDLE, GLOBAL_EPICENTERS.BOTTOM_RIGHT];
        return bottomEpicenters[Math.floor(Math.random() * bottomEpicenters.length)];
      default:
        return GLOBAL_EPICENTERS.TOP_MIDDLE;
    }
  }

  /**
   * Show epicenter preview
   */
  private showEpicenterPreview(epicenter: {x: number, y: number}) {
    console.log('🎯 Showing epicenter preview at:', epicenter);
    
    // Remove existing preview
    if (this.epicenterPreview) {
      this.epicenterPreview.destroy();
    }
    
    // Create new preview - make it more visible
    this.epicenterPreview = this.scene.add.graphics();
    this.epicenterPreview.fillStyle(0xff0000, 1.0); // Full opacity red
    this.epicenterPreview.fillCircle(epicenter.x, epicenter.y, 6); // Reduced size from 12 to 6
    
    // Add a white border to make it more visible
    this.epicenterPreview.lineStyle(3, 0xffffff, 1.0);
    this.epicenterPreview.strokeCircle(epicenter.x, epicenter.y, 6); // Reduced size from 12 to 6
    
    console.log('✅ Epicenter preview created at:', epicenter.x, epicenter.y);
    
    // Remove preview after 0.5 seconds
    this.scene.time.delayedCall(500, () => {
      if (this.epicenterPreview) {
        console.log('🗑️ Removing epicenter preview');
        this.epicenterPreview.destroy();
        this.epicenterPreview = null;
      }
    });
  }

  /**
   * Start the level spawning system
   */
  startLevel() {
    this.levelStartTime = this.scene.time.now;
    this.spawnedGroups.clear();
    this.previewShownGroups.clear(); // Reset preview tracking
  }

  /**
   * Update spawning logic - called every frame
   */
  update() {
    const currentTime = (this.scene.time.now - this.levelStartTime) / 1000; // Convert to seconds
    
    // Check each group for spawning
    this.currentLevel.groups.forEach((group, groupIndex) => {
      if (!this.spawnedGroups.has(groupIndex)) {
        // Show epicenter preview 0.5 seconds before spawning (only once per group)
        if (currentTime >= group.startTime - 0.5 && currentTime < group.startTime && !this.previewShownGroups.has(groupIndex)) {
          console.log(`⏰ Preview time for group ${groupIndex + 1}: ${currentTime}s >= ${group.startTime - 0.5}s`);
          const epicenter = this.getEpicenterCoordinates(group.epicenterStrategy);
          this.showEpicenterPreview(epicenter);
          this.previewShownGroups.add(groupIndex); // Mark this group as having shown preview
        }
        
        // Spawn the group
        if (currentTime >= group.startTime) {
          console.log(`🚀 Spawning group ${groupIndex + 1} at time: ${currentTime}s`);
          this.spawnGroup(group, groupIndex);
          this.spawnedGroups.add(groupIndex);
        }
      }
    });
  }

  /**
   * Spawn a specific enemy group
   */
  private spawnGroup(group: EnemyGroup, groupIndex: number) {
    try {
      // Get epicenter coordinates
      const epicenter = this.getEpicenterCoordinates(group.epicenterStrategy);
      
      console.log(`🎯 Spawning group ${groupIndex + 1}: ${group.enemyCount} ${group.enemyType} enemies at epicenter (${epicenter.x}, ${epicenter.y})`);
      
      // Get enemy type configuration
      const enemyType = getEnemyType(group.enemyType);
      if (!enemyType) {
        console.error(`❌ Unknown enemy type: ${group.enemyType}`);
        return;
      }

      // Get spawn pattern
      const pattern = getSpawnPattern(group.spawnPattern);
      if (!pattern) {
        console.error(`❌ Unknown spawn pattern: ${group.spawnPattern}`);
        return;
      }

      // Get existing enemies for overlap prevention
      const existingEnemies = this.enemies.getChildren() as Enemy[];

      // Generate spawn positions using the pattern around the epicenter
      const spawnPositions = pattern.positions(
        epicenter.x,
        epicenter.y,
        group.enemyCount,
        existingEnemies,
        group.minDistance
      );

      // Spawn enemies at the calculated positions
      spawnPositions.forEach((position, index) => {
        if (index < group.enemyCount) {
          try {
            const enemy = new Enemy(
              this.scene,
              position.x,
              position.y,
              enemyType.health,
              enemyType.speed,
              enemyType.damage,
              group.enemyType,
              enemyType.color,
              enemyType.radius
            );
            
            // Apply enemy type specific properties
            enemy.setScale(enemyType.scale);
            
            // Add to enemy group
            this.enemies.add(enemy);
            
            console.log(`✅ Spawned ${enemyType.name} at (${Math.round(position.x)}, ${Math.round(position.y)})`);
          } catch (error) {
            console.error(`❌ Error spawning enemy ${index}:`, error);
          }
        }
      });
    } catch (error) {
      console.error(`❌ Error spawning group ${groupIndex + 1}:`, error);
    }
  }

  /**
   * Check if all groups have been spawned
   */
  isLevelComplete(): boolean {
    return this.spawnedGroups.size >= this.currentLevel.groups.length;
  }

  /**
   * Get spawn progress information
   */
  getSpawnProgress() {
    return {
      spawnedGroups: this.spawnedGroups.size,
      totalGroups: this.currentLevel.groups.length,
      isComplete: this.isLevelComplete()
    };
  }

  /**
   * Get current level information
   */
  getCurrentLevel(): Level {
    return this.currentLevel;
  }

  /**
   * Reset the spawn manager for a new level
   */
  reset(level: Level) {
    this.currentLevel = level;
    this.levelStartTime = this.scene.time.now;
    this.spawnedGroups.clear();
    this.previewShownGroups.clear(); // Reset preview tracking
    
    // Clear any existing preview
    if (this.epicenterPreview) {
      this.epicenterPreview.destroy();
      this.epicenterPreview = null;
    }
  }

  /**
   * Stop the level spawning system
   */
  stopLevel() {
    // Clear any existing preview
    if (this.epicenterPreview) {
      this.epicenterPreview.destroy();
      this.epicenterPreview = null;
    }
    this.spawnedGroups.clear();
    this.previewShownGroups.clear(); // Reset preview tracking
  }
} 