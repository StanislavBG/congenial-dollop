import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { GameSettings, GAME_SETTINGS } from '../types/Level';
import { getLevel } from '../levels/LevelDefinitions';
import { SpawnManager } from '../managers/SpawnManager';
import { UIManager } from '../managers/UIManager';
import { GameStateManager } from '../managers/GameStateManager';
import { InputManager } from '../managers/InputManager';
import { ShopUI } from '../ui/ShopUI';
import { ShopCard } from '../types/Shop';

export class MainScene extends Phaser.Scene {
  private player!: Player;
  
  // Managers
  private uiManager!: UIManager;
  private gameStateManager!: GameStateManager;
  private inputManager!: InputManager;
  
  // Game objects
  private enemies!: Phaser.GameObjects.Group;
  private spawnManager!: SpawnManager;
  private shopUI!: ShopUI;
  
  // Game state
  private score: number = 0;
  private lastShootTime: number = 0;
  private currentLevelId: number = 101;
  private gameSettings: GameSettings = GAME_SETTINGS;
  
  // Performance optimization
  private cachedClosestEnemy: any = null;
  private lastDistanceCheck: number = 0;
  private createdTexts: Set<Phaser.GameObjects.Text> = new Set();
  
  // Configuration
  private readonly USE_TEST_MODE: boolean = false;
  private readonly TEST_LEVELS: number[] = [101, 102, 103];
  private readonly PRODUCTION_LEVELS: number[] = [1, 2, 3];

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // Load dog spritesheets
    this.load.spritesheet('dog-run', 'src/assets/sprites/dog_run.png', {
      frameWidth: 683,  // 2048 / 3 = 682.67, try 683 to get exactly 9 frames
      frameHeight: 683,
      spacing: 0,
      margin: 0
    });
  }

  create() {
    // Set up the main play area - use full screen
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const playAreaWidth = this.cameras.main.width;
    const playAreaHeight = this.cameras.main.height;
    
    this.add.rectangle(centerX, centerY, playAreaWidth, playAreaHeight, 0x333333, 0.3);
    
    // Create dog animations
    this.createDogAnimations();
    
    // Add visible walls around the play area
    this.createWalls();
    
    // Initialize managers
    this.initializeManagers();
    
    // Set starting level based on mode
    this.currentLevelId = this.USE_TEST_MODE ? this.TEST_LEVELS[0] : this.PRODUCTION_LEVELS[0];
    
    // Set up player with starting health of 100 - center on screen
    const playerX = this.cameras.main.width / 2;
    const playerY = this.cameras.main.height / 2;
    this.player = new Player(this, playerX, playerY, 100);
    
    // Set up enemies
    this.enemies = this.add.group();
    
    // Initialize spawn manager with current level
    const currentLevel = getLevel(this.currentLevelId);
    if (currentLevel) {
      this.spawnManager = new SpawnManager(this, currentLevel, this.enemies);
      this.spawnManager.startLevel();
    }
    
    // Set up shop UI
    this.shopUI = new ShopUI(this);
    
    // Set up collisions
    this.setupCollisions();
    
    // Reset game state
    this.resetGameState();
  }

  private initializeManagers(): void {
    // Initialize UI Manager
    this.uiManager = new UIManager(this, this.gameSettings, this.USE_TEST_MODE);
    this.uiManager.initialize();
    
    // Initialize Game State Manager
    this.gameStateManager = new GameStateManager(this, this.uiManager, this.USE_TEST_MODE);
    
    // Initialize Input Manager
    this.inputManager = new InputManager(this, this.gameStateManager, this.uiManager, this.USE_TEST_MODE);
    this.inputManager.initialize();
  }

  private createDogAnimations() {
    // Create running animation for the dog using all 9 frames
    this.anims.create({
      key: 'dog-run',
      frames: this.anims.generateFrameNumbers('dog-run', { start: 0, end: 8 }),
      frameRate: 10,
      repeat: -1
    });
    
    if (this.USE_TEST_MODE) {
      console.log('Dog animation created - checking if it exists:');
      console.log('dog-run exists:', this.anims.exists('dog-run'));
      
      // Debug: Check texture details
      const runTexture = this.textures.get('dog-run');
      console.log('Run texture frameTotal:', runTexture?.frameTotal);
      console.log('Run texture source image width:', runTexture?.source[0]?.width);
      console.log('Run texture source image height:', runTexture?.source[0]?.height);
    }
  }

  update() {
    // Handle restart key first
    if (this.gameStateManager.handleRestart()) {
      return; // Game is restarting
    }

    // Only continue with game updates if playing
    if (!this.gameStateManager.isPlaying()) {
      // Still update UI for pause text, but nothing else
      this.uiManager.update(this.player, this.enemies, this.spawnManager);
      return;
    }
    
    // Game is playing - update everything
    this.updateGameLogic();
  }

  private updateGameLogic(): void {
    // Safety check: ensure player exists and is active
    if (this.player && this.player.active) {
      this.player.update(this.inputManager.getCursors());
      this.autoShoot();
    }
    
    // Update spawn manager with safety check
    if (this.spawnManager) {
      this.spawnManager.update();
    }
    
    // Update enemies with safety checks
    if (this.enemies && this.enemies.children) {
      this.enemies.children.each((enemy: any) => {
        if (enemy && enemy.active && typeof enemy.update === 'function') {
          enemy.update(this.player);
        }
        return true;
      });
    }
    
    // Check for level completion
    this.checkLevelCompletion();
    
    // Update UI
    this.uiManager.update(this.player, this.enemies, this.spawnManager);
  }

  private setupCollisions() {
    // Set up collisions only when player and enemies are available
    if (!this.player || !this.enemies) {
      return;
    }

    // Player bullets vs enemies
    this.physics.add.overlap(
      this.player.getBullets(),
      this.enemies,
      this.onBulletHitEnemy,
      undefined,
      this
    );

    // Player vs enemies
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.onPlayerHitEnemy,
      undefined,
      this
    );

    // Enemy vs Enemy collisions
    this.physics.add.collider(
      this.enemies,
      this.enemies,
      this.onEnemyCollision,
      undefined,
      this
    );
  }

  private onBulletHitEnemy(bullet: any, enemy: any) {
    // Safety checks
    if (!bullet || !enemy || !bullet.active || !enemy.active) {
      return;
    }
    
    if (!this.player || !this.player.active) {
      return;
    }
    
    // Destroy the bullet
    bullet.destroy();
    
    // Damage the enemy
    const bulletDamage = this.player.getBulletDamage();
    const enemyDied = enemy.takeDamage(bulletDamage);
    
    // If enemy died, remove it and add score
    if (enemyDied) {
      // Visual feedback - enemy explosion effect
      const explosion = this.add.circle(enemy.x, enemy.y, 7, 0xff0000, 0.8);
      this.tweens.add({
        targets: explosion,
        scaleX: 1.2,
        scaleY: 1.2,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          if (explosion && explosion.active) {
            explosion.destroy();
          }
        }
      });
      
      enemy.destroy();
      
      // Increase score
      this.score += 10;
      this.uiManager.updateScore(this.score);
      
      // IMMEDIATE LEVEL COMPLETION CHECK - Check if this was the last enemy
      this.checkLevelCompletion();
    }
  }

  private onPlayerHitEnemy(player: any, enemy: any) {
    // Safety checks
    if (!player || !enemy || !player.active || !enemy.active) {
      return;
    }
    
    if (!this.player || !this.player.active) {
      return;
    }
    
    // Player takes damage from enemy
    const enemyDamage = enemy.getDamage();
    this.player.damage(enemyDamage);
    
    // Enemy takes damage from player collision
    const playerCollisionDamage = this.player.getCollisionDamage();
    const enemyDied = enemy.takeDamage(playerCollisionDamage);
    
    if (enemyDied) {
      // Visual feedback
      const explosion = this.add.circle(enemy.x, enemy.y, 7, 0xff0000, 0.8);
      this.tweens.add({
        targets: explosion,
        scaleX: 1.2,
        scaleY: 1.2,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          if (explosion && explosion.active) {
            explosion.destroy();
          }
        }
      });
      
      enemy.destroy();
      
      // Increase score
      this.score += 10;
      this.uiManager.updateScore(this.score);
      
      // IMMEDIATE LEVEL COMPLETION CHECK - Check if this was the last enemy
      this.checkLevelCompletion();
    }
    
    if (player.getHealth() <= 0) {
      this.handleGameOver();
    }
  }

  private onEnemyCollision(enemy1: any, enemy2: any) {
    // Safety checks
    if (!enemy1 || !enemy2 || !enemy1.active || !enemy2.active || this.gameStateManager.isGameOver()) {
      return;
    }
    
    // Validate physics bodies
    if (!enemy1.body || !enemy2.body) {
      return;
    }
    
    // Visual feedback only
    enemy1.onEnemyCollision();
    enemy2.onEnemyCollision();
  }

  private continueToNextLevel() {
    const currentLevels = this.USE_TEST_MODE ? this.TEST_LEVELS : this.PRODUCTION_LEVELS;
    const currentIndex = currentLevels.indexOf(this.currentLevelId);
    const nextLevelId = currentIndex >= 0 && currentIndex < currentLevels.length - 1 ? currentLevels[currentIndex + 1] : null;
    
    if (!nextLevelId) return;
    
    if (this.USE_TEST_MODE) {
      console.log('Continuing to next level');
    }
    
    // Clear all text objects
    this.clearAllTextObjects();
    
    // Hide shop UI
    this.shopUI.hide();
    
    // Continue to next level - preserve score and health
    this.currentLevelId = nextLevelId;
    
    // Update UI through manager
    this.uiManager.updateScore(this.score);
    this.uiManager.updateLevel(this.currentLevelId);
    
    // Preserve player health between levels
    if (this.player) {
      this.uiManager.updateHealthBarForPlayer(this.player);
    }
    
    // Clear all enemies
    this.enemies.clear(true, true);
    
    // Initialize new level
    const newLevel = getLevel(this.currentLevelId);
    if (newLevel && this.spawnManager) {
      this.spawnManager.reset(newLevel);
      this.spawnManager.startLevel();
    }
    
    // Resume the game
    this.gameStateManager.resetToPlaying();
  }

  private handleGameOver() {
    this.gameStateManager.setGameOver();
    
    // Stop all enemies
    this.stopAllEnemies();
    
    // IMMEDIATE STOP - Force stop player movement
    if (this.player && this.player.body) {
      this.player.setVelocity(0, 0);
      if (this.player.anims && this.player.anims.isPlaying) {
        this.player.anims.stop();
      }
    }
    
    if (this.USE_TEST_MODE) {
      console.log('Game Over - Player health reached 0');
    }
  }

  private autoShoot() {
    if (!this.player || !this.player.active) {
      return;
    }
    
    const currentTime = this.time.now;
    if (currentTime - this.lastShootTime < this.gameSettings.shootInterval) {
      return;
    }
    
    // Find closest enemy
    const closestEnemy = this.findClosestEnemy();
    if (closestEnemy) {
      this.player.shootAt(closestEnemy.x, closestEnemy.y);
      this.lastShootTime = currentTime;
    }
  }

  private findClosestEnemy(): any {
    // Performance optimization: only check every 100ms
    const currentTime = this.time.now;
    if (currentTime - this.lastDistanceCheck < 100) {
      return this.cachedClosestEnemy;
    }
    
    this.lastDistanceCheck = currentTime;
    
    if (!this.player || !this.enemies) {
      return null;
    }
    
    let closestEnemy = null;
    let closestDistance = Infinity;
    
    this.enemies.getChildren().forEach((enemy: any) => {
      if (enemy && enemy.active) {
        const distance = Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          enemy.x, enemy.y
        );
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestEnemy = enemy;
        }
      }
    });
    
    this.cachedClosestEnemy = closestEnemy;
    return closestEnemy;
  }

  private resetGameState() {
    this.score = 0;
    this.lastShootTime = 0;
    this.cachedClosestEnemy = null;
    this.lastDistanceCheck = 0;
    
    // Reset performance tracking
    this.createdTexts.clear();
    
    if (this.USE_TEST_MODE) {
      console.log('Game state reset');
    }
  }

  private stopAllEnemies() {
    if (this.enemies) {
      this.enemies.getChildren().forEach((enemy: any) => {
        if (enemy && enemy.active) {
          enemy.setVelocity(0, 0);
        }
      });
    }
  }

  private createWalls() {
    // Create invisible walls around the play area - use full screen
    const wallThickness = 20;
    const wallColor = 0x666666;
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    
    // Top wall
    this.add.rectangle(screenWidth / 2, wallThickness / 2, screenWidth, wallThickness, wallColor);
    
    // Bottom wall
    this.add.rectangle(screenWidth / 2, screenHeight - wallThickness / 2, screenWidth, wallThickness, wallColor);
    
    // Left wall
    this.add.rectangle(wallThickness / 2, screenHeight / 2, wallThickness, screenHeight, wallColor);
    
    // Right wall
    this.add.rectangle(screenWidth - wallThickness / 2, screenHeight / 2, wallThickness, screenHeight, wallColor);
  }

  private checkLevelCompletion() {
    if (!this.spawnManager || !this.enemies) {
      return;
    }
    
    // Check if spawn manager is done and no enemies remain
    if (this.spawnManager.isLevelComplete() && this.enemies.getChildren().length === 0) {
      this.handleLevelComplete();
    }
  }

  private handleLevelComplete() {
    if (this.USE_TEST_MODE) {
      console.log('Level completed!');
    }
    
    // IMMEDIATE PAUSE - Stop all movement and physics immediately
    this.gameStateManager.setLevelComplete();
    
    // Stop all enemies
    this.stopAllEnemies();
    
    // IMMEDIATE STOP - Force stop player movement
    if (this.player && this.player.body) {
      this.player.setVelocity(0, 0);
      if (this.player.anims && this.player.anims.isPlaying) {
        this.player.anims.stop();
      }
    }
    
    // Check if this is the last level
    const currentLevels = this.USE_TEST_MODE ? this.TEST_LEVELS : this.PRODUCTION_LEVELS;
    const currentIndex = currentLevels.indexOf(this.currentLevelId);
    const nextLevelId = currentIndex >= 0 && currentIndex < currentLevels.length - 1 ? currentLevels[currentIndex + 1] : null;
    
    if (nextLevelId) {
      // Not the last level - show shop
      this.time.delayedCall(500, () => {
        this.showShop();
      });
    } else {
      // Last level - show game completion message
      this.time.delayedCall(500, () => {
        this.handleGameCompletion();
      });
    }
  }

  private clearAllTextObjects() {
    this.createdTexts.forEach(text => {
      if (text && text.active) {
        text.destroy();
      }
    });
    this.createdTexts.clear();
  }

  private showShop(): void {
    this.gameStateManager.enterShop();
    this.shopUI.show(this.handleCardSelection.bind(this), this.currentLevelId);
  }

  private handleGameCompletion(): void {
    // Show game completion message
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;
    
    const completionText = this.add.text(centerX, centerY, 'GAME COMPLETED!\nCongratulations!', {
      fontSize: '32px',
      color: '#00ff00',
      stroke: '#000',
      strokeThickness: 3,
      align: 'center'
    });
    completionText.setOrigin(0.5);
    
    const scoreText = this.add.text(centerX, centerY + 80, `Final Score: ${this.score}`, {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 2,
      align: 'center'
    });
    scoreText.setOrigin(0.5);
    
    const restartText = this.add.text(centerX, centerY + 140, 'Press R to restart', {
      fontSize: '18px',
      color: '#cccccc',
      stroke: '#000',
      strokeThickness: 1,
      align: 'center'
    });
    restartText.setOrigin(0.5);
    
    // Add to created texts for cleanup
    this.createdTexts.add(completionText);
    this.createdTexts.add(scoreText);
    this.createdTexts.add(restartText);
    
    if (this.USE_TEST_MODE) {
      console.log('Game completed!');
    }
  }

  public handleCardSelection(card: ShopCard): void {
    if (!this.player) return;
    
    // Apply the upgrade
    switch (card.type) {
      case 'health':
        this.player.upgradeHealth(card.value);
        break;
      case 'damage':
        this.player.upgradeDamage(card.value);
        break;
      case 'speed':
        this.player.upgradeSpeed(card.value);
        break;
    }
    
    // Show upgrade effect
    this.showUpgradeEffect(card);
    
    // Exit shop and continue to next level
    this.gameStateManager.exitShop();
    this.shopUI.hide();
    this.continueToNextLevel();
  }

  private showUpgradeEffect(card: ShopCard): void {
    // Create a temporary text effect - CENTERED ON SCREEN
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;
    
    const effectText = this.add.text(centerX, centerY, `+${card.value} ${card.type}!`, {
      fontSize: '24px',
      color: '#00ff00',
      stroke: '#000',
      strokeThickness: 2
    });
    effectText.setOrigin(0.5);
    
    // Animate the effect - move up and fade out
    this.tweens.add({
      targets: effectText,
      y: centerY - 50, // Move up 50 pixels from center
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        effectText.destroy();
      }
    });
    
    this.createdTexts.add(effectText);
  }

  shutdown() {
    // Clean up managers
    this.uiManager?.destroy();
    this.inputManager?.destroy();
    
    // Clear all text objects
    this.clearAllTextObjects();
  }
} 