import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { HealthBar } from '../ui/HealthBar';
import { GameSettings } from '../types/Level';

interface UIPanel {
  header: Phaser.GameObjects.Text;
  details: Phaser.GameObjects.Text;
}

interface UITextElements {
  scoreText: Phaser.GameObjects.Text;
  timerText: Phaser.GameObjects.Text;
  levelText: Phaser.GameObjects.Text;
  pauseText: Phaser.GameObjects.Text;
  controlsText: Phaser.GameObjects.Text;
  controlsDetails: Phaser.GameObjects.Text;
  levelCompleteText: Phaser.GameObjects.Text | null;
}

export class UIManager {
  private scene: Phaser.Scene;
  private gameSettings: GameSettings;
  private useTestMode: boolean;
  
  // Core UI elements
  private healthBar!: HealthBar;
  private textElements!: UITextElements;
  
  // Admin UI elements
  private adminVisible: boolean = true;
  private playerInfoHeader!: Phaser.GameObjects.Text;
  private playerInfoDetails!: Phaser.GameObjects.Text;
  private enemyInfoElements: Map<string, UIPanel> = new Map();
  
  // Performance tracking - scalable solution
  private lastPlayerState: string = '';
  
  // Game state tracking
  private gameStartTime: number = 0;
  private totalPauseTime: number = 0;
  private score: number = 0;

  constructor(scene: Phaser.Scene, gameSettings: GameSettings, useTestMode: boolean = false) {
    this.scene = scene;
    this.gameSettings = gameSettings;
    this.useTestMode = useTestMode;
  }

  public initialize(): void {
    this.setupCoreUI();
    if (this.useTestMode) {
      this.setupAdminUI();
    }
    this.gameStartTime = this.scene.time.now;
  }

  private setupCoreUI(): void {
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;
    
    // Calculate responsive spacing and sizing
    const margin = Math.max(20, Math.floor(screenWidth * 0.015)); // 1.5% of screen width, min 20px
    const statsFontSize = Math.max(18, Math.floor(screenWidth * 0.014)); // 1.4% of screen width, min 18px
    const controlsFontSize = Math.max(16, Math.floor(screenWidth * 0.012)); // 1.2% of screen width, min 16px
    const controlsDetailsFontSize = Math.max(14, Math.floor(screenWidth * 0.01)); // 1% of screen width, min 14px
    
    // Health bar will be created when player data is available
    // Don't create it here with hardcoded values

    // Create stats panel (top-right) with proper spacing - RIGHT ALIGNED
    const statsX = screenWidth - margin; // Right edge minus margin
    const statsY = margin;
    const statsSpacing = Math.floor(statsFontSize * 1.5); // 1.5x font size for line spacing
    
    this.textElements = {
      scoreText: this.createGameText(statsX, statsY, 'Score: 0', { 
        fontSize: `${statsFontSize}px`, 
        color: '#ffffff',
        stroke: '#000',
        strokeThickness: 1
      }),
      timerText: this.createGameText(statsX, statsY + statsSpacing, 'Time: 0s', { 
        fontSize: `${statsFontSize}px`, 
        color: '#ffffff',
        stroke: '#000',
        strokeThickness: 1
      }),
      levelText: this.createGameText(statsX, statsY + statsSpacing * 2, 'Level: 1', { 
        fontSize: `${statsFontSize}px`, 
        color: '#ffffff',
        stroke: '#000',
        strokeThickness: 1
      }),
      pauseText: this.createGameText(screenWidth / 2, screenHeight / 2, 'PAUSED', { 
        fontSize: '48px', 
        color: '#ff0000', 
        stroke: '#000', 
        strokeThickness: 4 
      }),
      controlsText: this.createGameText(margin, margin + 60, 'Controls', { 
        fontSize: `${controlsFontSize}px`, 
        color: '#ffffff',
        stroke: '#000',
        strokeThickness: 1
      }),
      controlsDetails: this.createGameText(margin, margin + 60 + Math.floor(controlsFontSize * 1.5), 'WASD/Arrows: Move\nP: Pause\nR: Restart', { 
        fontSize: `${controlsDetailsFontSize}px`, 
        color: '#cccccc',
        stroke: '#000',
        strokeThickness: 1
      }),
      levelCompleteText: null
    };

    // Set text origins for proper alignment
    this.textElements.scoreText.setOrigin(1, 0); // Right-aligned, top-aligned
    this.textElements.timerText.setOrigin(1, 0); // Right-aligned, top-aligned
    this.textElements.levelText.setOrigin(1, 0); // Right-aligned, top-aligned
    
    // Initially hide pause text and center it
    this.textElements.pauseText.setVisible(false);
    this.textElements.pauseText.setOrigin(0.5);
  }

  private setupAdminUI(): void {
    if (!this.useTestMode) return;

    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;
    const margin = Math.max(20, Math.floor(screenWidth * 0.015)); // 1.5% of screen width, min 20px
    
    // Position admin panels under the stats panel (top-right) - RIGHT ALIGNED
    const adminX = screenWidth - margin; // Same X as stats panel (right edge minus margin)
    const adminY = margin + Math.floor(screenHeight * 0.18); // More separation from stats panel

    // Calculate responsive font sizes based on screen size
    const headerFontSize = Math.max(14, Math.floor(screenWidth * 0.01)); // 1% of screen width, min 14px
    const detailsFontSize = Math.max(10, Math.floor(screenWidth * 0.008)); // 0.8% of screen width, min 10px
    const wordWrapWidth = Math.floor(screenWidth * 0.12); // 12% of screen width for admin panels
    const panelPadding = Math.floor(detailsFontSize * 0.5); // 0.5x font size for internal padding

    // Player info header with proper spacing - RIGHT ALIGNED
    this.playerInfoHeader = this.createGameText(adminX, adminY, 'Player Info', {
      fontSize: `${headerFontSize}px`,
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 1
    });
    this.playerInfoHeader.setOrigin(1, 0); // Right-aligned, top-aligned

    // Player info details - more compact with shorter text - RIGHT ALIGNED
    this.playerInfoDetails = this.createGameText(adminX - panelPadding, adminY + Math.floor(headerFontSize * 1.2), 'Health: 100\nSpeed: 0\nPos: (0,0)', {
      fontSize: `${detailsFontSize}px`,
      color: '#ffff00',
      stroke: '#000',
      strokeThickness: 1
    });
    this.playerInfoDetails.setOrigin(1, 0); // Right-aligned, top-aligned
    this.playerInfoDetails.setStyle({ wordWrap: { width: wordWrapWidth - panelPadding * 2 } }); // Account for padding
    this.playerInfoDetails.setInteractive();

    this.setAdminVisibility(this.adminVisible);
  }

  private createGameText(x: number, y: number, text: string, style: any): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, text, style);
  }

  public update(player: Player | null, enemies: Phaser.GameObjects.Group | null, _spawnManager: any): void {
    // Check if game is paused - don't update timer when paused
    const gameStateManager = (this.scene as any).gameStateManager;
    const isPlaying = !gameStateManager || gameStateManager.isPlaying();
    
    // Only update timer when playing
    if (isPlaying) {
      this.updateTimer();
    }
    
    this.updateHealthBar(player);
    
    if (this.useTestMode) {
      this.updateAdminUI(player, enemies);
    }
  }

  private updateTimer(): void {
    const elapsedTime = Math.floor((this.scene.time.now - this.gameStartTime - this.totalPauseTime) / 1000);
    if (this.textElements.timerText && this.textElements.timerText.active) {
      this.textElements.timerText.setText(this.formatAlignedText('Time', `${elapsedTime}s`));
    }
  }

  private updateHealthBar(player: Player | null): void {
    if (player && player.active) {
      // Create health bar if it doesn't exist
      if (!this.healthBar) {
        this.createHealthBar(player);
      }
      
      const playerHealth = player.getHealth();
      this.healthBar.update(playerHealth);
    }
  }

  private createHealthBar(player: Player): void {
    const screenWidth = this.scene.cameras.main.width;
    const margin = Math.max(20, Math.floor(screenWidth * 0.015));
    
    this.healthBar = new HealthBar({
      scene: this.scene,
      x: margin,
      y: margin,
      maxHealth: player.getMaxHealth(),
      currentHealth: player.getHealth(),
      width: Math.min(400, screenWidth * 0.3),
      height: 25,
      segmentSpacing: 1
    });
  }

  private updateAdminUI(player: Player | null, enemies: Phaser.GameObjects.Group | null): void {
    if (!this.useTestMode) return;

    this.updatePlayerInfo(player);
    this.updateEnemyInfo(enemies);
  }

  private updatePlayerInfo(player: Player | null): void {
    if (!player || !player.active || !player.body) return;

    // Create a state hash from all relevant player properties
    const currentState = this.createPlayerStateHash(player);
    
    // Only update if state changed
    if (currentState !== this.lastPlayerState) {
      const playerHealth = player.getHealth();
      const maxHealth = player.getMaxHealth();
      const movementSpeed = player.getMovementSpeed();
      const bulletDamage = player.getBulletDamage();
      const playerX = Math.round(player.x);
      const playerY = Math.round(player.y);
      
      this.playerInfoDetails.setText(
        `HP: ${playerHealth}/${maxHealth}\nSpeed: ${movementSpeed}\nDmg: ${bulletDamage}\nPos: (${playerX}, ${playerY})`
      );
      
      // Cache the state hash
      this.lastPlayerState = currentState;
    }
  }

  private createPlayerStateHash(player: Player): string {
    // Create a hash of all relevant player properties
    // This automatically detects changes in ANY property
    const state = {
      health: player.getHealth(),
      maxHealth: player.getMaxHealth(),
      movementSpeed: player.getMovementSpeed(),
      bulletDamage: player.getBulletDamage(),
      collisionDamage: player.getCollisionDamage(),
      x: Math.round(player.x),
      y: Math.round(player.y),
      velocityX: Math.round(player.body?.velocity.x || 0),
      velocityY: Math.round(player.body?.velocity.y || 0),
      isInvulnerable: player.isInvulnerableToDamage()
    };
    
    // Simple hash - JSON string of the state object
    return JSON.stringify(state);
  }

  private updateEnemyInfo(enemies: Phaser.GameObjects.Group | null): void {
    if (!enemies) return;

    // Get all enemy types currently active
    const enemyCounts = new Map<string, number>();
    const enemyTypes = new Set<string>();
    
    enemies.getChildren().forEach((enemy: any) => {
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
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;
    const margin = Math.max(20, Math.floor(screenWidth * 0.015)); // 1.5% of screen width, min 20px
    
    // Position enemy panels under player info panel (top-right, vertical stack) - RIGHT ALIGNED
    const adminX = screenWidth - margin; // Same X as stats panel (right edge minus margin)
    const baseAdminY = margin + Math.floor(screenHeight * 0.18); // More separation from stats panel
    
    // Calculate responsive font sizes based on screen size
    const headerFontSize = Math.max(14, Math.floor(screenWidth * 0.01)); // 1% of screen width, min 14px
    const detailsFontSize = Math.max(10, Math.floor(screenWidth * 0.008)); // 0.8% of screen width, min 10px
    const wordWrapWidth = Math.floor(screenWidth * 0.12); // 12% of screen width for admin panels
    const panelPadding = Math.floor(detailsFontSize * 0.5); // 0.5x font size for internal padding
    const panelSpacing = Math.floor(headerFontSize * 1.5); // 1.5x header font size between panels
    
    // Calculate vertical positioning for enemy panels
    const playerPanelHeight = Math.floor(headerFontSize * 1.2) + Math.floor(detailsFontSize * 4) + panelSpacing; // Approximate player panel height
    let currentY = baseAdminY + playerPanelHeight; // Start after player panel
    enemyTypes.forEach(enemyType => {
      const count = enemyCounts.get(enemyType) || 0;
      
      if (!this.enemyInfoElements.has(enemyType)) {
        // Create new UI elements for this enemy type - vertical stack with padding - RIGHT ALIGNED
        const header = this.createGameText(adminX, currentY, `Enemy: ${enemyType}`, {
          fontSize: `${headerFontSize}px`,
          color: '#ffffff',
          stroke: '#000',
          strokeThickness: 1
        });
        header.setOrigin(1, 0); // Right-aligned, top-aligned
        header.setVisible(this.adminVisible);
        
        const details = this.createGameText(adminX - panelPadding, currentY + Math.floor(headerFontSize * 1.2), '', {
          fontSize: `${detailsFontSize}px`,
          color: '#ffff00',
          stroke: '#000',
          strokeThickness: 1
        });
        details.setOrigin(1, 0); // Right-aligned, top-aligned
        details.setStyle({ wordWrap: { width: wordWrapWidth - panelPadding * 2 } }); // Account for padding
        details.setInteractive();
        details.setVisible(this.adminVisible);
        
        this.enemyInfoElements.set(enemyType, { header, details });
        currentY += Math.floor(headerFontSize * 1.2) + Math.floor(detailsFontSize * 3) + panelSpacing; // Move to next panel
      }
      
      // Update the details text
      const elements = this.enemyInfoElements.get(enemyType);
      if (elements) {
        const firstEnemy = enemies.getChildren().find((enemy: any) => 
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

  private formatAlignedText(label: string, value: string): string {
    return `${label}: ${value}`;
  }

  public setAdminVisibility(visible: boolean): void {
    this.adminVisible = visible;
    
    if (this.useTestMode) {
      this.playerInfoHeader?.setVisible(visible);
      this.playerInfoDetails?.setVisible(visible);
      
      this.enemyInfoElements.forEach(elements => {
        elements.header.setVisible(visible);
        elements.details.setVisible(visible);
      });
    }
  }

  public isAdminVisible(): boolean {
    return this.adminVisible;
  }

  public setPauseVisibility(visible: boolean): void {
    this.textElements.pauseText?.setVisible(visible);
  }

  public setLevelCompleteText(text: string | null): void {
    if (this.textElements.levelCompleteText) {
      this.textElements.levelCompleteText.destroy();
      this.textElements.levelCompleteText = null;
    }
    
    if (text) {
      // Position level complete text higher on screen
      const screenWidth = this.scene.cameras.main.width;
      const screenHeight = this.scene.cameras.main.height;
      const centerX = screenWidth / 2;
      const levelCompleteY = screenHeight * 0.3; // 30% from top (higher than center)
      
      this.textElements.levelCompleteText = this.createGameText(centerX, levelCompleteY, text, {
        fontSize: '24px',
        color: '#00ff00',
        stroke: '#000',
        strokeThickness: 2
      });
      this.textElements.levelCompleteText.setOrigin(0.5);
    }
  }

  public updateScore(newScore: number): void {
    this.score = newScore;
    if (this.textElements.scoreText && this.textElements.scoreText.active) {
      this.textElements.scoreText.setText(`Score: ${this.score}`);
    }
  }

  public updateLevel(levelId: number): void {
    if (this.textElements.levelText && this.textElements.levelText.active) {
      this.textElements.levelText.setText(`Level: ${levelId}`);
    }
  }

  public updateHealthBarForPlayer(player: any): void {
    this.updateHealthBar(player);
  }

  public addPauseTime(time: number): void {
    this.totalPauseTime += time;
  }

  public resetHealthBar(): void {
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    
    // Use responsive positioning and sizing
    const screenWidth = this.scene.cameras.main.width;
    const margin = Math.max(20, Math.floor(screenWidth * 0.015)); // 1.5% of screen width, min 20px
    
    this.healthBar = new HealthBar({
      scene: this.scene,
      x: margin,
      y: margin,
      maxHealth: this.gameSettings.playerHealth,
      currentHealth: this.gameSettings.playerHealth,
      width: Math.min(400, screenWidth * 0.3),
      height: 25,
      segmentSpacing: 1
    });
  }

  public destroy(): void {
    this.healthBar?.destroy();
    
    // Destroy all text elements
    Object.values(this.textElements).forEach(element => {
      if (element) element.destroy();
    });
    
    // Destroy admin UI elements
    this.playerInfoHeader?.destroy();
    this.playerInfoDetails?.destroy();
    
    this.enemyInfoElements.forEach(elements => {
      elements.header.destroy();
      elements.details.destroy();
    });
    this.enemyInfoElements.clear();
  }
} 