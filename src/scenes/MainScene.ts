import Phaser from 'phaser';
import { Player } from '../entities/Player';

import { GameSettings, GAME_SETTINGS } from '../types/Level';
import { getLevel } from '../levels/LevelDefinitions';
import { SpawnManager } from '../managers/SpawnManager';
import { ShopUI } from '../ui/ShopUI';
import { ShopCard } from '../types/Shop';

export class MainScene extends Phaser.Scene {
  private player!: Player;
  



  preload() {
    // Load player images (single sprites, not spritesheets)
    this.load.image('player-idle', 'src/assets/sprites/character_green_idle.png');
    this.load.image('player-walk-a', 'src/assets/sprites/character_green_walk_a.png');
    this.load.image('player-walk-b', 'src/assets/sprites/character_green_walk_b.png');
    this.load.image('player-hit', 'src/assets/sprites/character_green_hit.png');
  }

  private enemies!: Phaser.GameObjects.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private playerInfoHeader!: Phaser.GameObjects.Text;
  private playerInfoDetails!: Phaser.GameObjects.Text;
  private enemyInfoElements: Map<string, { header: Phaser.GameObjects.Text, details: Phaser.GameObjects.Text }> = new Map();
  // Removed hardcoded enemy UI elements - now using dynamic system
  private healthSegments: Phaser.GameObjects.Rectangle[] = [];
  private controlsText!: Phaser.GameObjects.Text;
  private controlsDetails!: Phaser.GameObjects.Text;
  private adminVisible: boolean = true; // Start with admin panel open
  private lastShootTime: number = 0;
  private gameStartTime: number = 0;
  private timerText!: Phaser.GameObjects.Text;
  private currentLevelId: number = 101; // Start in test mode for faster iteration
  private spawnManager!: SpawnManager;
  private gameSettings: GameSettings = GAME_SETTINGS;
  private pauseText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  // Removed hardcoded yellow dot UI elements - now using dynamic system
  private healthBarText!: Phaser.GameObjects.Text;

  private gameState: 'playing' | 'paused' | 'gameOver' | 'completed' | 'shop' = 'playing';
  private pauseStartTime: number = 0;
  private totalPauseTime: number = 0;
  private levelCompleteText!: Phaser.GameObjects.Text | null;
  private pauseReason: 'user' | 'levelComplete' | null = null;
  private shopUI!: ShopUI;
  
  // Performance optimization tracking variables
  private lastPlayerHealth: number = -1;
  private lastPlayerSpeed: number = -1;
  private lastPlayerX: number = -1;
  private lastPlayerY: number = -1;
  private cachedClosestEnemy: any = null;
  private lastDistanceCheck: number = 0;
  private createdTexts: Set<Phaser.GameObjects.Text> = new Set();
  
  // Easy mode switching - just change this one variable
  private readonly USE_TEST_MODE: boolean = true;
  private readonly TEST_LEVELS: number[] = [101, 102, 103];
  private readonly PRODUCTION_LEVELS: number[] = [1, 2, 3];
  private rKeyPressed: boolean = false;

  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    // Set up the main play area
    this.add.rectangle(400, 300, 800, 600, 0x333333, 0.3);
    
    // Add visible walls around the play area
    this.createWalls();
    
    // Initialize game start time
    this.gameStartTime = this.time.now;
    
    // Initialize level complete text
    this.levelCompleteText = null;
    
    // Initialize key tracking
    this.rKeyPressed = false;
    
    // Set starting level based on mode
    this.currentLevelId = this.USE_TEST_MODE ? this.TEST_LEVELS[0] : this.PRODUCTION_LEVELS[0];
    
    // Set up player with starting health of 100 (not full 500)
    this.player = new Player(this, 400, 300, 100);
    
    // Set up enemies
    this.enemies = this.add.group();
    
    // Initialize spawn manager with current level
    const currentLevel = getLevel(this.currentLevelId);
    if (currentLevel) {
      this.spawnManager = new SpawnManager(this, currentLevel, this.enemies);
      this.spawnManager.startLevel();
    }
    
    // Set up UI
    this.setupUI();
    this.setupAdminUI();
    
    // Set up shop UI
    this.shopUI = new ShopUI(this);
    
    // Debug admin visibility
    console.log('Admin visible after setup:', this.adminVisible);
    console.log('Player info header visible:', this.playerInfoHeader.visible);
    
    // Set up collisions
    this.setupCollisions();
    
    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Add test key for overlap system
    this.input.keyboard!.on('keydown-T', () => {
      this.testOverlapSystem();
    });
    
    // Set up cursor keys
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // Reset game state to ensure proper initialization
    this.resetGameState();
  }

  update() {
    // Always check for restart key first - completely bypass all level logic
    const rKey = this.input.keyboard!.addKey('R');
    if (rKey.isDown && !this.rKeyPressed) {
      this.rKeyPressed = true;
      console.log('R key pressed - clean restart');
      // Force immediate restart - no level logic, no transitions
      this.scene.restart();
      return;
    } else if (!rKey.isDown) {
      this.rKeyPressed = false;
    }
    
    // Only continue with normal game logic if R is not pressed
    if (this.gameState !== 'playing') {
      return; // Paused, game over, completed, or shop - nothing updates
    }
    
    // Safety check: ensure player exists and is active
    if (this.player && this.player.active) {
      this.player.update(this.cursors);
      this.autoShoot();
    }
    
    // Update timer with safety check
    const elapsedTime = Math.floor((this.time.now - this.gameStartTime - this.totalPauseTime) / 1000);
    if (this.timerText && this.timerText.active) {
      this.timerText.setText(this.formatAlignedText('Time', `${elapsedTime}s`));
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
    
    this.updateAdminUI();
  }

  private setupAdminUI() {
    console.log('Setting up admin UI, adminVisible:', this.adminVisible);
    
    // Player info header (bottom left, anchored)
    this.playerInfoHeader = this.add.text(20, 460, 'Player Info', {
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 1
    });
    this.playerInfoHeader.setVisible(this.adminVisible);
    console.log('Player header visible set to:', this.adminVisible);
    
    // Player info details (bottom left, anchored)
    this.playerInfoDetails = this.add.text(20, 480, 'Health: 100\nSpeed: 0\nPos: (0,0)', {
      fontSize: '12px',
      color: '#ffff00',
      stroke: '#000',
      strokeThickness: 2
    }).setInteractive();
    this.playerInfoDetails.setStyle({ wordWrap: { width: 150 } });
    this.playerInfoDetails.setVisible(this.adminVisible);
    
    console.log('Admin UI setup complete, all elements visible:', this.adminVisible);
  }









  private setupUI() {
    // Health bar from top-left to middle of screen (dynamic HP capacity)
    const healthSegments = Math.ceil(100 / 5); // Start with 100 HP = 20 segments
    const totalWidth = 400; // Width from left margin to middle of screen
    const segmentWidth = Math.floor((totalWidth - (healthSegments - 1)) / healthSegments); // Calculate segment width to fit exactly
    const segmentHeight = 25; // Taller for better visibility
    const segmentSpacing = 1; // Tighter spacing
    const startX = 20; // Left margin
    const startY = 20; // Top of screen
    
    for (let i = 0; i < healthSegments; i++) {
      const rect = this.add.rectangle(
        startX + i * (segmentWidth + segmentSpacing),
        startY,
        segmentWidth,
        segmentHeight,
        0x00ff00
      ).setOrigin(0, 0);
      this.healthSegments.push(rect);
    }
    
    // Health bar text (anchored on right side of health bar)
    this.healthBarText = this.add.text(420, 20, '', {
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 2,
      fontFamily: 'monospace'
    }).setOrigin(0, 0);
    
    // Score text (top right, inside main area)
    this.scoreText = this.add.text(650, 20, this.formatAlignedText('Score', '0'), {
      fontSize: '20px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 3,
      fontFamily: 'monospace'
    }).setOrigin(0, 0); // Left-aligned
    
    // Timer text (next to score)
    this.timerText = this.add.text(650, 50, this.formatAlignedText('Time', '0s'), {
      fontSize: '20px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 3,
      fontFamily: 'monospace'
    }).setOrigin(0, 0); // Left-aligned
    
    // Level text (top right, aligned with score and timer)
    this.levelText = this.add.text(650, 80, this.formatAlignedText('Level', this.currentLevelId.toString().padStart(2, '0')), {
      fontSize: '20px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 3,
      fontFamily: 'monospace'
    }).setOrigin(0, 0); // Left-aligned
    
    // Controls text (under health bar)
    this.controlsText = this.add.text(20, 60, 'Controls', {
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 1
    });
    
    // Controls details (below header)
    this.controlsDetails = this.add.text(20, 80, 'WASD Movement\nP Pause/Resume\nTAB Toggle Admin\nR Restart\n1,2,3 Shop Cards', {
      fontSize: '12px',
      color: '#ffff00',
      stroke: '#000',
      strokeThickness: 2
    });
    
    this.updateControls();
    

    
    // Pause text (center top of screen)
    this.pauseText = this.add.text(400, 100, 'PAUSED', {
      fontSize: '48px',
      color: '#ff0000',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5).setVisible(false);
  }

  private setupCollisions() {
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
    
    // Destroy the bullet
    bullet.destroy();
    
    // Damage the enemy
    const bulletDamage = this.player.getBulletDamage();
    const enemyDied = enemy.takeDamage(bulletDamage);
    
    // If enemy died, remove it and add score
    if (enemyDied) {
      // Visual feedback - enemy explosion effect (expanding red ring)
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
      if (this.scoreText && this.scoreText.active) {
        this.scoreText.setText(this.formatAlignedText('Score', this.score.toString()));
      }
    }
  }

  private onPlayerHitEnemy(player: any, enemy: any) {
    // Safety checks
    if (!player || !enemy || !player.active || !enemy.active) {
      return;
    }
    
    // Player takes damage from enemy
    const enemyDamage = enemy.getDamage();
    player.damage(enemyDamage);
    
    // Enemy takes damage from player collision
    const playerCollisionDamage = player.getCollisionDamage();
    const enemyDied = enemy.takeDamage(playerCollisionDamage);
    
    // Enemy slows down after hitting player
    enemy.onPlayerCollision();
    
    // Immediately update health bar to reflect current damage
    this.updateHealthBar();
    
    // Visual feedback - enemy explosion effect if enemy died
    if (enemyDied) {
      // Visual feedback - enemy explosion effect (expanding red ring)
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
      
      // Remove the enemy after it dies
      enemy.destroy();
      
      // Increase score for enemy destruction
      this.score += 10;
      if (this.scoreText && this.scoreText.active) {
        this.scoreText.setText(this.formatAlignedText('Score', this.score.toString()));
      }
    }
    
    if (player.getHealth() <= 0) {
      this.handleGameOver();
    }
  }

  private onEnemyCollision(enemy1: any, enemy2: any) {
    // Safety checks
    if (!enemy1 || !enemy2 || !enemy1.active || !enemy2.active || this.gameState === 'gameOver') {
      return;
    }
    
    // Validate physics bodies
    if (!enemy1.body || !enemy2.body) {
      return;
    }
    
    // Simple bounce effect - enemies push each other apart
    const distance = Phaser.Math.Distance.Between(enemy1.x, enemy1.y, enemy2.x, enemy2.y);
    
    // Push enemies apart if they're too close
    if (distance < 30) {
      const pushForce = 50;
      
      // Apply opposite forces to separate them
      enemy1.setVelocity(enemy1.body.velocity.x - pushForce, enemy1.body.velocity.y - pushForce);
      enemy2.setVelocity(enemy2.body.velocity.x + pushForce, enemy2.body.velocity.y + pushForce);
      
      // Visual feedback
      enemy1.onEnemyCollision();
      enemy2.onEnemyCollision();
    }
  }

  private setupKeyboardShortcuts() {
    // Pause/Resume
    this.input.keyboard!.on('keydown-P', () => {
      this.togglePause();
    });
    
    // Toggle admin panel
    this.input.keyboard!.on('keydown-TAB', (event: any) => {
      event.preventDefault(); // Prevent default TAB behavior (browser focus)
      this.toggleAdmin();
    });
    
    // Continue to next level when paused for level complete or in shop
    this.input.keyboard!.on('keydown-SPACE', () => {
      if (this.gameState === 'paused' && this.pauseReason === 'levelComplete') {
        this.continueToNextLevel();
      } else if (this.gameState === 'shop') {
        // Clear messages immediately when SPACE is pressed in shop
        this.clearAllTextObjects();
      }
    });
    
    // Shop card selection with keyboard
    this.input.keyboard!.on('keydown-ONE', () => {
      if (this.gameState === 'shop' && this.shopUI) {
        this.shopUI.selectCardByIndex(0);
      }
    });
    
    this.input.keyboard!.on('keydown-TWO', () => {
      if (this.gameState === 'shop' && this.shopUI) {
        this.shopUI.selectCardByIndex(1);
      }
    });
    
    this.input.keyboard!.on('keydown-THREE', () => {
      if (this.gameState === 'shop' && this.shopUI) {
        this.shopUI.selectCardByIndex(2);
      }
    });
  }

  private continueToNextLevel() {
    const currentLevels = this.USE_TEST_MODE ? this.TEST_LEVELS : this.PRODUCTION_LEVELS;
    const currentIndex = currentLevels.indexOf(this.currentLevelId);
    const nextLevelId = currentIndex >= 0 && currentIndex < currentLevels.length - 1 ? currentLevels[currentIndex + 1] : null;
    
    if (!nextLevelId) return;
    
    console.log('Continuing to next level');
    
    // Clear all text objects
    this.clearAllTextObjects();
    
    // Hide shop UI
    this.shopUI.hide();
    
    // Continue to next level - preserve score and health
    this.currentLevelId = nextLevelId;
    // Don't reset score - let it accumulate across levels
    
    // Only update UI text if it still exists (wasn't destroyed)
    if (this.scoreText && this.scoreText.active) {
      this.scoreText.setText(this.formatAlignedText('Score', this.score.toString()));
    }
    if (this.levelText && this.levelText.active) {
      this.levelText.setText(this.formatAlignedText('Level', this.currentLevelId.toString().padStart(2, '0')));
    }
    
    // Preserve player health between levels - don't reset it!
    if (this.player) {
      this.updateHealthBar();
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
    this.gameState = 'playing';
    
    // Reset game start time for new level
    this.gameStartTime = this.time.now;
  }
  
  private togglePause() {
    if (this.gameState === 'playing') {
      this.pauseGame('user');
    } else if (this.gameState === 'paused') {
      this.resumeGame();
    }
  }

  private pauseGame(reason: 'user' | 'levelComplete') {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      this.pauseReason = reason;
      this.pauseStartTime = this.time.now;
      
      // Stop player movement when pausing
      if (this.player) {
        this.player.setVelocity(0, 0);
      }
      // Stop all enemy movement when pausing
      this.enemies.children.each((enemy: any) => {
        if (enemy.active) {
          enemy.setVelocity(0, 0);
        }
        return true;
      });
      
      // Show pause text only for user pauses, not level complete
      if (reason === 'user') {
        this.pauseText.setVisible(true);
      }
      
      this.updateControls();
    }
  }

  private resumeGame() {
    if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.pauseReason = null;
      // Add the pause duration to total pause time
      this.totalPauseTime += this.time.now - this.pauseStartTime;
      
      // Remove PAUSED text and restore timer
      const elapsedTime = Math.floor((this.time.now - this.gameStartTime - this.totalPauseTime) / 1000);
      this.timerText.setText(this.formatAlignedText('Time', `${elapsedTime}s`));
      this.pauseText.setVisible(false);
      
      this.updateControls();
    }
  }

  private toggleAdmin() {
    console.log('Toggle admin called, current state:', this.adminVisible);
    this.adminVisible = !this.adminVisible;
    console.log('New admin state:', this.adminVisible);
    
    // Update admin UI visibility
    this.playerInfoHeader.setVisible(this.adminVisible);
    this.playerInfoDetails.setVisible(this.adminVisible);
    
    // Update dynamic enemy UI elements
    this.enemyInfoElements.forEach(({ header, details }) => {
      header.setVisible(this.adminVisible);
      details.setVisible(this.adminVisible);
    });
    
    // Force update the admin UI when showing
    if (this.adminVisible) {
      this.updateAdminUI();
    }
    
    this.updateControls();
  }

  private updateAdminUI() {
    // Update player info - only when values change
    if (this.player) {
      const playerHealth = this.player.getHealth();
      const playerSpeed = Math.sqrt(
        Math.pow(this.player.body!.velocity.x, 2) + 
        Math.pow(this.player.body!.velocity.y, 2)
      );
      const playerX = Math.round(this.player.x);
      const playerY = Math.round(this.player.y);
      
      // Only update if any value changed
      if (playerHealth !== this.lastPlayerHealth || 
          Math.round(playerSpeed) !== this.lastPlayerSpeed ||
          playerX !== this.lastPlayerX ||
          playerY !== this.lastPlayerY) {
        
        const fireRate = Math.round(1000 / this.gameSettings.shootInterval * 10) / 10; // shots per second
        const bulletDamage = this.player.getBulletDamage();
        const collisionDamage = this.player.getCollisionDamage();
        const isInvulnerable = this.player.isInvulnerableToDamage();
        const maxHealth = this.player.getMaxHealth();
        const movementSpeed = this.player.getMovementSpeed();
        
        this.playerInfoDetails.setText(
          `Health: ${playerHealth}/${maxHealth}\nSpeed: ${movementSpeed}\nFire Rate: ${fireRate}/s\nBullet Dmg: ${bulletDamage}\nCollision Damage: ${collisionDamage}\nInvulnerable: ${isInvulnerable ? 'Yes' : 'No'}\nPos: (${playerX}, ${playerY})`
        );
        
        // Update segmented health bar
        this.updateHealthBar();
        
        // Cache the values
        this.lastPlayerHealth = playerHealth;
        this.lastPlayerSpeed = Math.round(playerSpeed);
        this.lastPlayerX = playerX;
        this.lastPlayerY = playerY;
      }
    }
    
    // Update dynamic enemy info - only show enemies with active count > 0
    if (this.spawnManager) {
      this.updateDynamicEnemyUI();
    }
  }

  private updateDynamicEnemyUI(): void {
    // Get all enemy types currently active
    const enemyCounts = new Map<string, number>();
    const enemyTypes = new Set<string>();
    
    this.enemies.getChildren().forEach((enemy: any) => {
      if (enemy.active) {
        const enemyType = enemy.getEnemyType();
        enemyTypes.add(enemyType);
        enemyCounts.set(enemyType, (enemyCounts.get(enemyType) || 0) + 1);
      }
    });
    
    // Remove UI elements for enemies that are no longer active
    this.enemyInfoElements.forEach((elements, enemyType) => {
      if (!enemyTypes.has(enemyType)) {
        elements.header.destroy();
        elements.details.destroy();
        this.enemyInfoElements.delete(enemyType);
      }
    });
    
    // Create or update UI elements for active enemies
    let xOffset = 200; // Start position for enemy info
    enemyTypes.forEach(enemyType => {
      const count = enemyCounts.get(enemyType) || 0;
      
      if (!this.enemyInfoElements.has(enemyType)) {
        // Create new UI elements for this enemy type
        const header = this.add.text(xOffset, 460, `Enemy: ${enemyType}`, {
          fontSize: '16px',
          color: '#ffffff',
          stroke: '#000',
          strokeThickness: 1
        });
        header.setVisible(this.adminVisible);
        
        const details = this.add.text(xOffset, 480, '', {
          fontSize: '12px',
          color: '#ffff00',
          stroke: '#000',
          strokeThickness: 2
        }).setInteractive();
        details.setStyle({ wordWrap: { width: 150 } });
        details.setVisible(this.adminVisible);
        
        this.enemyInfoElements.set(enemyType, { header, details });
        xOffset += 180; // Space between enemy info sections
      }
      
      // Update the details text
      const elements = this.enemyInfoElements.get(enemyType);
      if (elements) {
        // Get enemy stats from the first enemy of this type
        const firstEnemy = this.enemies.getChildren().find((enemy: any) => 
          enemy.active && enemy.getEnemyType() === enemyType
        );
        
        if (firstEnemy && typeof (firstEnemy as any).getHealth === 'function') {
          const health = (firstEnemy as any).getHealth();
          const maxHealth = (firstEnemy as any).getMaxHealth();
          const speed = (firstEnemy as any).getMoveSpeed();
          const damage = (firstEnemy as any).getDamage();
          
          elements.details.setText(
            `Health: ${health}/${maxHealth}\nSpeed: ${speed}\nDamage: ${damage}\nActive: ${count}`
          );
        }
      }
    });
  }

  // Update health bar segments based on current player health
  private updateHealthBar() {
    if (this.player) {
      const playerHealth = this.player.getHealth();
      const maxHealth = this.player.getMaxHealth();
      const segmentsToShow = Math.ceil(playerHealth / 5);
      
      // Show health text when bar is not full or when it's full
      if (this.healthBarText && this.healthBarText.active) {
        if (playerHealth < maxHealth || playerHealth === maxHealth) {
          this.healthBarText.setText(`${playerHealth}`);
          this.healthBarText.setVisible(true);
        } else {
          this.healthBarText.setVisible(false);
        }
      }
      
      for (let i = 0; i < this.healthSegments.length; i++) {
        if (i < segmentsToShow) {
          // Active health segments - green
          this.healthSegments[i].setFillStyle(0x00ff00);
        } else {
          // Empty segments - gray
          this.healthSegments[i].setFillStyle(0x444444);
        }
      }
    }
  }
  
  private formatAlignedText(label: string, value: string): string {
    const maxLabelLength = 6; // Length of longest label ("Level ")
    const paddedLabel = label.padEnd(maxLabelLength);
    return `${paddedLabel}: ${value}`;
  }

  private updateControls() {
    this.controlsDetails.setText('WASD Movement\nP Pause/Resume\nTAB Toggle Admin\nR Restart');
  }

  private handleGameOver() {
    this.gameState = 'gameOver'; // Set game over flag
    
    // Stop all enemy movement
    this.stopAllEnemies();
    
    // Remove player but keep enemies on screen
    if (this.player) {
      this.player.destroy();
      this.player = null as any;
    }
    
    // Game Over - You lost! (red, Message-1 slot)
    this.createGameText(400, 200, 'Game Over - You lost!', {
      fontSize: '48px',
      color: '#ff0000', // Red
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.createGameText(400, 240, 'Press R to restart', {
      fontSize: '20px',
      color: '#fff',
    }).setOrigin(0.5);
  }

  // Helper method to track created text objects
  private createGameText(x: number, y: number, text: string, style: any): Phaser.GameObjects.Text {
    const textObj = this.add.text(x, y, text, style);
    this.createdTexts.add(textObj);
    return textObj;
  }

  private autoShoot() {
    // Safety check: ensure player exists and is active
    if (!this.player || !this.player.active) {
      return;
    }
    
    const currentTime = this.time.now;
    if (currentTime - this.lastShootTime >= this.gameSettings.shootInterval) {
      const closestEnemy = this.findClosestEnemy();
      if (closestEnemy && closestEnemy.active) {
        try {
          this.player.shootAt(closestEnemy.x, closestEnemy.y);
          this.lastShootTime = currentTime;
        } catch (error) {
          console.error('Error in autoShoot:', error);
        }
      }
    }
  }
  
  private findClosestEnemy(): any {
    // Safety check: ensure player and enemies exist
    if (!this.player || !this.player.active || !this.enemies || !this.enemies.children) {
      return null;
    }
    
    const now = this.time.now;
    
    // Cache results for 100ms to avoid expensive calculations every frame
    if (now - this.lastDistanceCheck < 100 && this.cachedClosestEnemy && this.cachedClosestEnemy.active) {
      return this.cachedClosestEnemy;
    }
    
    let closestEnemy = null;
    let closestDistance = Infinity;
    
    this.enemies.getChildren().forEach((enemy: any) => {
      if (enemy && enemy.active) {
        try {
          const distance = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            enemy.x, enemy.y
          );
          if (distance < closestDistance) {
            closestDistance = distance;
            closestEnemy = enemy;
          }
        } catch (error) {
          console.error('Error calculating distance to enemy:', error);
        }
      }
    });
    
    // Cache the result
    this.cachedClosestEnemy = closestEnemy;
    this.lastDistanceCheck = now;
    
    return closestEnemy;
  }

  private resetGameState() {
    this.adminVisible = false;
    this.gameState = 'playing';
    this.gameStartTime = this.time.now;
    this.totalPauseTime = 0;
    this.pauseStartTime = 0;
    
    // Reset performance tracking variables
    this.resetPerformanceTracking();
    
    // Reset player health to starting health (100 HP)
    if (this.player) {
      this.player.resetHealth(100);
    }
    
    // Reset health bar segments
    this.resetHealthBar();
    
    this.updateControls();
  }
  
  private resetHealthBar() {
    // Clear existing health segments
    this.healthSegments.forEach(segment => segment.destroy());
    this.healthSegments = [];
    
    // Recreate health segments from top-left to middle
    const healthSegments = Math.ceil(this.gameSettings.playerHealth / 5); // 500/5 = 100 segments
    const totalWidth = 400; // Width from left margin to middle of screen
    const segmentWidth = Math.floor((totalWidth - (healthSegments - 1)) / healthSegments); // Calculate segment width to fit exactly
    const segmentHeight = 25; // Taller for better visibility
    const segmentSpacing = 1; // Tighter spacing
    const startX = 20; // Left margin
    const startY = 20; // Top of screen
    
    for (let i = 0; i < healthSegments; i++) {
      const rect = this.add.rectangle(
        startX + i * (segmentWidth + segmentSpacing),
        startY,
        segmentWidth,
        segmentHeight,
        0x00ff00
      ).setOrigin(0, 0);
      this.healthSegments.push(rect);
    }
  }

  private stopAllEnemies() {
    this.enemies.children.each((enemy: any) => {
      if (enemy.active) {
        enemy.setVelocity(0, 0);
      }
      return true;
    });
  }

  // Create visible walls around the play area
  private createWalls() {
    const wallThickness = 6;
    const wallColor = 0x888888;
    
    // Top wall
    this.add.rectangle(400, wallThickness/2, 800, wallThickness, wallColor);
    
    // Bottom wall
    this.add.rectangle(400, 600 - wallThickness/2, 800, wallThickness, wallColor);
    
    // Left wall
    this.add.rectangle(wallThickness/2, 300, wallThickness, 600, wallColor);
    
    // Right wall
    this.add.rectangle(800 - wallThickness/2, 300, wallThickness, 600, wallColor);
  }

  // Test function for overlap prevention system
  private testOverlapSystem() {
    console.log('🧪 Testing overlap prevention system...');
    
    // Import the spawn utilities
    import('../utils/SpawnUtils').then(({ spawnUtils }) => {
      // Mock enemies
      const enemies = [
        {x: 100, y: 100},
        {x: 200, y: 200},
        {x: 300, y: 300}
      ];
      
      // Test overlap detection
      const hasOverlap = spawnUtils.hasOverlap(150, 150, enemies, 50);
      console.log('Overlap test (150,150):', hasOverlap ? '✅ Detected' : '❌ Not detected');
      
      // Test valid position finding
      const validPos = spawnUtils.findValidPosition(200, 200, enemies, 50);
      console.log('Valid position found:', validPos);
      
      // Test circle pattern
      const circlePositions = spawnUtils.generateCirclePositions(400, 300, 6, enemies, 40);
      console.log('Circle pattern positions:', circlePositions);
      
      console.log('✨ Overlap prevention system test completed!');
    });
  }

  private checkLevelCompletion() {
    // Only check if we're playing and haven't already completed the level
    if (this.gameState !== 'playing') return;
    
    const currentLevel = getLevel(this.currentLevelId);
    if (!currentLevel) return;
    
    // Don't check completion until spawn manager has started and at least one group has spawned
    if (!this.spawnManager || this.spawnManager.getSpawnProgress().spawnedGroups === 0) return;
    
    const activeEnemies = this.enemies.getChildren().filter((enemy: any) => enemy.active).length;
    const scoreReached = this.score >= currentLevel.scoreToComplete;
    
    // Level is complete if all enemies are defeated and score is reached
    if (activeEnemies === 0 && scoreReached) {
      this.handleLevelComplete();
    }
  }

  private handleLevelComplete() {
    // Only handle completion once - prevent multiple calls
    if (this.gameState !== 'playing' || this.levelCompleteText) {
      console.log('Level complete already handled or game not in playing state, skipping');
      return;
    }
    
    console.log(`Level ${this.currentLevelId} completed!`);
    
    // Stop player movement immediately
    if (this.player) {
      this.player.setVelocity(0, 0);
    }
    
    // Show level complete message using tracked creation
    this.levelCompleteText = this.createGameText(400, 200, 'LEVEL COMPLETE!', {
      fontSize: '48px',
      color: '#00ff00',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    console.log('Level complete text created');
    
    // Stop all enemies and spawning
    this.stopAllEnemies();
    if (this.spawnManager) {
      this.spawnManager.stopLevel();
    }
    
    // Check if there's a next level
    const currentLevels = this.USE_TEST_MODE ? this.TEST_LEVELS : this.PRODUCTION_LEVELS;
    const currentIndex = currentLevels.indexOf(this.currentLevelId);
    const nextLevelId = currentIndex >= 0 && currentIndex < currentLevels.length - 1 ? currentLevels[currentIndex + 1] : null;
    
    if (nextLevelId) {
      // Show shop for intermediate levels
      this.showShop();
    } else {
      // Game completed - show victory message
      console.log('Game completed - showing victory message');
      
      // Set game state to completed to pause all gameplay
      this.gameState = 'completed';
      
      // Remove level complete text immediately
      if (this.levelCompleteText) {
        this.levelCompleteText.setVisible(false);
        this.children.remove(this.levelCompleteText);
        this.levelCompleteText.destroy();
        this.levelCompleteText = null;
      }
      
      // Victory message already uses green in the same slot
      this.createGameText(400, 200, 'Game Over - You won!', {
        fontSize: '48px',
        color: '#00ff00', // Green, same as LEVEL COMPLETE!
        stroke: '#000',
        strokeThickness: 4
      }).setOrigin(0.5);
      
      this.createGameText(400, 240, 'Press R to restart', {
        fontSize: '20px',
        color: '#fff', // White, same as Press SPACE to continue
      }).setOrigin(0.5);
    }
  }

  // NEW METHOD: Clean all text objects from scene
  private clearAllTextObjects() {
    // Get all text objects in the scene
    const allTexts = this.children.list.filter(child => child.type === 'Text');
    
    // Destroy all text objects except UI elements we want to keep
    allTexts.forEach((textObj: any) => {
      const text = textObj as Phaser.GameObjects.Text;
      const textContent = text.text;
      
      // Skip UI elements we want to preserve - check by reference and content
      if (text === this.scoreText || 
          text === this.timerText ||
          text === this.levelText ||
          text === this.pauseText ||
          text === this.healthBarText ||
          text === this.playerInfoHeader ||
          text === this.playerInfoDetails ||
          text === this.controlsText ||
          text === this.controlsDetails ||
          textContent.includes('Player Info') ||
          textContent.includes('Enemy: Red Dot') ||
          textContent.includes('Enemy: Yellow Dot') ||
          textContent.includes('WASD Movement') ||
          textContent.includes('P Pause/Resume') ||
          textContent.includes('TAB Toggle Admin') ||
          textContent.includes('R Restart') ||
          textContent === 'PAUSED' ||
          textContent.startsWith('Score:') ||
          textContent.startsWith('Time:') ||
          textContent.startsWith('Level:')) {
        return;
      }
      
      // Destroy all other text objects
      text.destroy();
    });
    
    // Clean up tracked text objects
    this.createdTexts.clear();
    
    // Reset our text references
    this.levelCompleteText = null;
  }

  // Reset performance tracking variables
  private resetPerformanceTracking() {
    this.lastPlayerHealth = -1;
    this.lastPlayerSpeed = -1;
    this.lastPlayerX = -1;
    this.lastPlayerY = -1;
    this.cachedClosestEnemy = null;
    this.lastDistanceCheck = 0;
  }

  // Shop methods
  private showShop(): void {
    this.gameState = 'shop';
    
    // Show "Press SPACE to continue" message (level complete message already shown by handleLevelComplete)
    this.createGameText(400, 240, 'Press SPACE to continue', {
      fontSize: '20px',
      color: '#fff'
    }).setOrigin(0.5);
    
    // Show shop UI with current level for scaling
    this.shopUI.show((card: ShopCard) => {
      this.handleCardSelection(card);
    }, this.currentLevelId);
  }

  private handleCardSelection(card: ShopCard): void {
    if (!this.player) return;
    
    // Clear level complete messages immediately to prevent overlap with upgrade notification
    this.clearAllTextObjects();
    
    // Show upgrade effect
    this.showUpgradeEffect(card);
    
    // Apply the upgrade based on card type
    switch (card.type) {
      case 'health':
        // Health card restores current health (doesn't increase max health)
        this.player.addHealth(card.value);
        break;
      case 'damage':
        this.player.upgradeDamage(card.value);
        break;
      case 'speed':
        this.player.upgradeSpeed(card.value);
        break;
    }
    
    // Update health bar to reflect new max health
    this.updateHealthBar();
    
    // Continue to next level after a short delay
    this.time.delayedCall(1000, () => {
      this.continueToNextLevel();
    });
  }

  private showUpgradeEffect(card: ShopCard): void {
    // Create upgrade text
    const upgradeText = this.add.text(400, 300, `+${card.value} ${card.type.toUpperCase()}!`, {
      fontSize: '32px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // Animate the text
    this.tweens.add({
      targets: upgradeText,
      y: 200,
      alpha: 0,
      scale: 1.5,
      duration: 1000,
      onComplete: () => {
        upgradeText.destroy();
      }
    });
  }

  // Note: recreateHealthBar method removed since health cards now only restore current health
  // For future maxHealth cards, this method can be restored

  // Clean up resources when scene is shutdown
  shutdown() {
    // Clean up event listeners
    if (this.input.keyboard) {
      this.input.keyboard.off('keydown-P');
      this.input.keyboard.off('keydown-TAB');
      this.input.keyboard.off('keydown-SPACE');
      this.input.keyboard.off('keydown-T');
    }
    
    // Clean up created text objects
    this.createdTexts.forEach(text => {
      if (text && text.active) {
        text.destroy();
      }
    });
    this.createdTexts.clear();
    
    // Clean up spawn manager
    if (this.spawnManager) {
      this.spawnManager.stopLevel();
    }
    
    // Clean up enemies
    if (this.enemies) {
      this.enemies.clear(true, true);
    }
    
    // Clean up player
    if (this.player) {
      this.player.destroy();
    }
  }
} 