import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Level, LEVEL_1, GameSettings, GAME_SETTINGS } from '../types/Level';

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.GameObjects.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private playerInfoHeader!: Phaser.GameObjects.Text;
  private playerInfoDetails!: Phaser.GameObjects.Text;
  private enemyInfoHeader!: Phaser.GameObjects.Text;
  private enemyInfoDetails!: Phaser.GameObjects.Text;
  private levelInfoHeader!: Phaser.GameObjects.Text;
  private levelInfoDetails!: Phaser.GameObjects.Text;
  private healthSegments: Phaser.GameObjects.Rectangle[] = [];
  private healthText!: Phaser.GameObjects.Text;
  private controlsText!: Phaser.GameObjects.Text;
  private controlsDetails!: Phaser.GameObjects.Text;
  private adminVisible: boolean = false;
  private lastShootTime: number = 0;
  private gameStartTime: number = 0;
  private timerText!: Phaser.GameObjects.Text;
  private currentLevel: Level = LEVEL_1;
  private gameSettings: GameSettings = GAME_SETTINGS;
  private pauseText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private lastEnemySpawnTime: number = 0;
  private enemiesSpawned: number = 0;
  private gameState: 'playing' | 'paused' | 'gameOver' = 'playing';
  private pauseStartTime: number = 0;
  private totalPauseTime: number = 0;

  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    // Set up the main play area
    this.add.rectangle(400, 300, 800, 600, 0x333333, 0.3);
    
    // Initialize game start time
    this.gameStartTime = this.time.now;
    
    // Initialize enemy spawn timer
    this.lastEnemySpawnTime = this.time.now;
    this.enemiesSpawned = 0;
    
    // Set up player
    this.player = new Player(this, 400, 300, this.gameSettings.playerHealth);
    
    // Set up enemies
    this.enemies = this.add.group();
    this.spawnEnemies();
    
    // Set up UI
    this.setupUI();
    this.setupAdminUI();
    
    // Set up collisions
    this.setupCollisions();
    
    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Set up cursor keys
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // Reset game state to ensure proper initialization
    this.resetGameState();
  }

  update() {
    if (this.gameState !== 'playing') {
      return; // Paused or game over - nothing updates
    }
    
    if (this.player) {
      this.player.update(this.cursors);
      this.autoShoot();
    }
    
    // Update timer
    const elapsedTime = Math.floor((this.time.now - this.gameStartTime - this.totalPauseTime) / 1000);
    this.timerText.setText(this.formatAlignedText('Time', `${elapsedTime}s`));
    
    // Timer-based enemy spawning
    this.spawnEnemiesOnTimer();
    
    // Update enemies
    this.enemies.children.each((enemy: any) => {
      enemy.update(this.player);
    });
    
    this.updateAdminUI();
  }
  
  private spawnEnemiesOnTimer() {
    const currentTime = this.time.now;
    if (currentTime - this.lastEnemySpawnTime >= this.currentLevel.enemySpawnInterval) {
      // Spawn the full enemy count at once, respecting the spawn pattern
      for (let i = 0; i < this.currentLevel.enemyCount; i++) {
        const spawnPos = this.currentLevel.spawnPositions[i];
        const enemy = new Enemy(this, spawnPos.x, spawnPos.y, this.currentLevel.enemyHealth, this.currentLevel.enemySpeed);
        this.enemies.add(enemy);
      }
      
      this.lastEnemySpawnTime = currentTime;
      this.enemiesSpawned += this.currentLevel.enemyCount;
    }
  }

  private spawnEnemies() {
    // Spawn enemies based on level configuration
    for (let i = 0; i < this.currentLevel.enemyCount; i++) {
      const pos = this.currentLevel.spawnPositions[i];
      const enemy = new Enemy(this, pos.x, pos.y, this.currentLevel.enemyHealth, this.currentLevel.enemySpeed);
      this.enemies.add(enemy);
    }
  }

  private setupAdminUI() {
    // Player info header (bottom left, anchored)
    this.playerInfoHeader = this.add.text(20, 460, 'Player Info', {
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 1
    });
    this.playerInfoHeader.setVisible(false);
    
    // Player info details (bottom left, anchored)
    this.playerInfoDetails = this.add.text(20, 480, 'Health: 100\nSpeed: 0\nPos: (0,0)', {
      fontSize: '12px',
      color: '#ffff00',
      stroke: '#000',
      strokeThickness: 2
    }).setInteractive();
    this.playerInfoDetails.setStyle({ wordWrap: { width: 150 } });
    this.playerInfoDetails.setVisible(false);
    
    // Enemy info header (bottom center, anchored)
    this.enemyInfoHeader = this.add.text(200, 460, 'Enemy Info', {
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 1
    });
    this.enemyInfoHeader.setVisible(false);
    
    // Enemy info details (bottom center, anchored)
    this.enemyInfoDetails = this.add.text(200, 480, 'Speed: 120\nCount: 4', {
      fontSize: '12px',
      color: '#ffff00',
      stroke: '#000',
      strokeThickness: 2
    }).setInteractive();
    this.enemyInfoDetails.setStyle({ wordWrap: { width: 150 } });
    this.enemyInfoDetails.setVisible(false);
    
    // Level info header (bottom center-right, anchored)
    this.levelInfoHeader = this.add.text(380, 460, 'Level 1', {
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 1
    });
    this.levelInfoHeader.setVisible(false);
    
    // Level info details (bottom center-right, anchored)
    this.levelInfoDetails = this.add.text(380, 480, 'Spawn Freq: 3s\nEnemies: 4\nPattern: 1', {
      fontSize: '12px',
      color: '#ffff00',
      stroke: '#000',
      strokeThickness: 2
    }).setInteractive();
    this.levelInfoDetails.setStyle({ wordWrap: { width: 150 } });
    this.levelInfoDetails.setVisible(false);
    
  }

  private setupUI() {
    // Segmented health bar (top left, inside main area)
    const segmentWidth = 12;
    const segmentHeight = 20;
    const segmentSpacing = 2;
    const startX = 20;
    const startY = 20;
    const healthSegments = Math.ceil(this.gameSettings.playerHealth / 5);
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
    this.levelText = this.add.text(650, 80, this.formatAlignedText('Level', '01'), {
      fontSize: '20px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 3,
      fontFamily: 'monospace'
    }).setOrigin(0, 0); // Left-aligned
    
    // Controls text (bottom center)
    this.controlsText = this.add.text(20, 300, 'Controls', {
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 1
    });
    
    // Controls details (below header)
    this.controlsDetails = this.add.text(20, 320, 'WASD Movement\nP Pause/Admin', {
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
    bullet.destroy();
    enemy.damage(this.gameSettings.bulletDamage);
    
    if (enemy.getHealth() <= 0) {
      enemy.destroy();
      this.score += 10;
      this.scoreText.setText(this.formatAlignedText('Score', this.score.toString()));
    }
  }

  private onPlayerHitEnemy(player: any, enemy: any) {
    // Player takes damage
    player.damage(this.currentLevel.enemyDamage);
    
    if (player.getHealth() <= 0) {
      this.handleGameOver();
    }
  }

  private onEnemyCollision(enemy1: any, enemy2: any) {
    // Don't process collisions if game is over
    if (this.gameState === 'gameOver') {
      return;
    }
    
    // Simple bounce effect - enemies push each other apart
    const angle = Phaser.Math.Angle.Between(enemy1.x, enemy1.y, enemy2.x, enemy2.y);
    const distance = Phaser.Math.Distance.Between(enemy1.x, enemy1.y, enemy2.x, enemy2.y);
    
    // Push enemies apart if they're too close
    if (distance < 30) {
      const pushForce = 50;
      const pushX = Math.cos(angle) * pushForce;
      const pushY = Math.sin(angle) * pushForce;
      
      // Apply opposite forces to separate them
      enemy1.setVelocity(enemy1.body.velocity.x - pushForce, enemy1.body.velocity.y - pushForce);
      enemy2.setVelocity(enemy2.body.velocity.x + pushForce, enemy2.body.velocity.y + pushForce);
      
      // Visual feedback
      enemy1.onEnemyCollision();
      enemy2.onEnemyCollision();
    }
  }

  private setupKeyboardShortcuts() {
    this.input.keyboard!.on('keydown-SPACE', () => {
      if (this.adminVisible || this.gameState === 'gameOver') {
        this.scene.restart();
      }
    });
    this.input.keyboard!.on('keydown-P', () => {
      this.togglePauseAndAdmin();
    });
  }
  
  private togglePauseAndAdmin() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      this.adminVisible = true; // Admin mode when paused
      this.pauseStartTime = this.time.now; // Record when pause started
    } else if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.adminVisible = false;
      // Add the pause duration to total pause time
      this.totalPauseTime += this.time.now - this.pauseStartTime;
    }
    
    if (this.gameState === 'paused') {
      // Stop player movement when pausing
      if (this.player) {
        this.player.setVelocity(0, 0);
      }
      // Stop all enemy movement when pausing
      this.enemies.children.each((enemy: any) => {
        if (enemy.active) {
          enemy.setVelocity(0, 0);
        }
      });
      this.pauseText.setVisible(true);
    } else if (this.gameState === 'playing') {
      // Remove PAUSED text and restore timer
      const elapsedTime = Math.floor((this.time.now - this.gameStartTime - this.totalPauseTime) / 1000);
      this.timerText.setText(this.formatAlignedText('Time', `${elapsedTime}s`));
      this.pauseText.setVisible(false);
    }
    
    // Update admin UI visibility
    this.playerInfoHeader.setVisible(this.adminVisible);
    this.playerInfoDetails.setVisible(this.adminVisible);
    this.enemyInfoHeader.setVisible(this.adminVisible);
    this.enemyInfoDetails.setVisible(this.adminVisible);
    this.levelInfoHeader.setVisible(this.adminVisible);
    this.levelInfoDetails.setVisible(this.adminVisible);
    
    this.updateControls();
  }

  private updateAdminUI() {
    // Update player info
    if (this.player) {
      const playerSpeed = Math.sqrt(
        Math.pow(this.player.body!.velocity.x, 2) + 
        Math.pow(this.player.body!.velocity.y, 2)
      );
      const playerHealth = this.player.getHealth();
      const fireRate = Math.round(1000 / this.gameSettings.shootInterval * 10) / 10; // shots per second
      const bulletDamage = this.gameSettings.bulletDamage;
      const enemiesSpawned = this.enemiesSpawned;
      const totalEnemies = this.currentLevel.enemyCount;
      this.playerInfoDetails.setText(
        `Health: ${playerHealth}\nSpeed: ${Math.round(playerSpeed)}\nFire Rate: ${fireRate}/s\nBullet Dmg: ${bulletDamage}\nPos: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`
      );
      // Update segmented health bar
      const segmentsToShow = Math.ceil(playerHealth / 5);
      for (let i = 0; i < this.healthSegments.length; i++) {
        this.healthSegments[i].setFillStyle(i < segmentsToShow ? 0x00ff00 : 0x444444);
      }
    }
    // Update enemy info
    const enemyCount = this.enemies.countActive();
    const enemySpeed = this.currentLevel.enemySpeed;
    const enemyHealth = this.currentLevel.enemyHealth;
    const enemyDamage = this.currentLevel.enemyDamage;
    this.enemyInfoDetails.setText(
      `Speed: ${enemySpeed}\nHealth: ${enemyHealth}\nDamage: ${enemyDamage}\nCount: ${enemyCount}`
    );
    
    // Update level info
    const spawnFreqSeconds = this.currentLevel.enemySpawnInterval / 1000;
    const enemiesSpawned = this.enemiesSpawned;
    const totalEnemies = this.currentLevel.enemyCount;
    this.levelInfoDetails.setText(
      `Spawn Freq: ${spawnFreqSeconds}s\nSpawned: ${enemiesSpawned}/${totalEnemies}\nPattern: ${this.currentLevel.spawnPattern}`
    );
  }
  
  private formatAlignedText(label: string, value: string): string {
    const maxLabelLength = 6; // Length of longest label ("Level ")
    const paddedLabel = label.padEnd(maxLabelLength);
    return `${paddedLabel}: ${value}`;
  }

  private updateControls() {
    if (this.adminVisible) {
      this.controlsDetails.setText('P Resume\nSPACE Restart');
    } else {
      this.controlsDetails.setText('WASD Movement\nP Pause/Admin');
    }
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
    
    this.add.text(400, 250, 'GAME OVER', {
      fontSize: '64px',
      color: '#ff0000',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(400, 350, 'Press SPACE to restart', {
      fontSize: '24px',
      color: '#fff'
    }).setOrigin(0.5);
  }

  private autoShoot() {
    const currentTime = this.time.now;
    if (currentTime - this.lastShootTime >= this.gameSettings.shootInterval) {
      const closestEnemy = this.findClosestEnemy();
      if (closestEnemy) {
        this.player.shootAt(closestEnemy.x, closestEnemy.y);
        this.lastShootTime = currentTime;
      }
    }
  }
  
  private findClosestEnemy(): any {
    let closestEnemy = null;
    let closestDistance = Infinity;
    
    this.enemies.getChildren().forEach((enemy: any) => {
      if (enemy.active) {
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
    
    return closestEnemy;
  }

  private resetGameState() {
    this.adminVisible = false;
    this.gameState = 'playing';
    this.gameStartTime = this.time.now;
    this.totalPauseTime = 0;
    this.pauseStartTime = 0;
    
    // Reset enemy spawn timer
    this.lastEnemySpawnTime = this.time.now;
    this.enemiesSpawned = 0;
    
    // Reset player health to game settings
    if (this.player) {
      this.player.resetHealth(this.gameSettings.playerHealth);
    }
    
    // Reset health bar segments
    this.resetHealthBar();
    
    this.updateControls();
  }
  
  private resetHealthBar() {
    // Clear existing health segments
    this.healthSegments.forEach(segment => segment.destroy());
    this.healthSegments = [];
    
    // Recreate health segments with full health
    const segmentWidth = 12;
    const segmentHeight = 20;
    const segmentSpacing = 2;
    const startX = 20;
    const startY = 20;
    const healthSegments = Math.ceil(this.gameSettings.playerHealth / 5);
    
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
    });
  }
} 