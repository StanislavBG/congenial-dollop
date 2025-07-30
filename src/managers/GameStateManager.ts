import Phaser from 'phaser';
import { UIManager } from './UIManager';

export type GameState = 'playing' | 'paused' | 'gameOver' | 'completed' | 'shop';

export class GameStateManager {
  private scene: Phaser.Scene;
  private uiManager: UIManager;
  private useTestMode: boolean;
  
  private currentState: GameState = 'playing';
  private pauseStartTime: number = 0;
  private pauseReason: 'user' | 'levelComplete' | null = null;
  private rKeyPressed: boolean = false;

  constructor(scene: Phaser.Scene, uiManager: UIManager, useTestMode: boolean = false) {
    this.scene = scene;
    this.uiManager = uiManager;
    this.useTestMode = useTestMode;
  }

  public handleRestart(): boolean {
    const rKey = this.scene.input.keyboard!.addKey('R');
    if (rKey.isDown && !this.rKeyPressed) {
      this.rKeyPressed = true;
      if (this.useTestMode) {
        console.log('R key pressed - clean restart');
      }
      
      // Use Phaser's built-in scene restart
      this.scene.scene.restart();
      return true;
    } else if (!rKey.isDown) {
      this.rKeyPressed = false;
    }
    return false;
  }

  public update(): boolean {
    // Only continue if in playing state
    if (this.currentState !== 'playing') {
      return false;
    }

    return true; // Continue with normal game updates
  }

  public getCurrentState(): GameState {
    return this.currentState;
  }

  public isPlaying(): boolean {
    return this.currentState === 'playing';
  }

  public isPaused(): boolean {
    return this.currentState === 'paused';
  }

  public isGameOver(): boolean {
    return this.currentState === 'gameOver';
  }

  public isCompleted(): boolean {
    return this.currentState === 'completed';
  }

  public isInShop(): boolean {
    return this.currentState === 'shop';
  }

  public pauseGame(reason: 'user' | 'levelComplete'): void {
    if (this.currentState === 'playing') {
      this.currentState = 'paused';
      this.pauseStartTime = this.scene.time.now;
      this.pauseReason = reason;
      
      // Stop all movement by setting velocities to zero
      this.stopAllMovement();
      
      // Pause physics
      this.scene.physics.pause();
      
      // Pause all tweens
      this.scene.tweens.pauseAll();
      
      this.uiManager.setPauseVisibility(true);
      
      if (this.useTestMode) {
        console.log(`Game paused: ${reason}`);
      }
    }
  }

  private stopAllMovement(): void {
    // Stop player movement and animations
    const player = this.scene.children.getByName('player') as any;
    if (player && player.body) {
      player.setVelocity(0, 0);
      if (player.anims && player.anims.isPlaying) {
        player.anims.stop();
      }
    }
    
    // Stop all enemies
    const enemies = this.scene.children.getByName('enemies');
    if (enemies && enemies instanceof Phaser.GameObjects.Group) {
      enemies.getChildren().forEach((enemy: any) => {
        if (enemy && enemy.body) {
          enemy.setVelocity(0, 0);
          if (enemy.anims && enemy.anims.isPlaying) {
            enemy.anims.stop();
          }
        }
      });
    }
    
    // Stop all bullets
    const bullets = this.scene.children.getByName('bullets');
    if (bullets && bullets instanceof Phaser.GameObjects.Group) {
      bullets.getChildren().forEach((bullet: any) => {
        if (bullet && bullet.body) {
          bullet.setVelocity(0, 0);
          if (bullet.anims && bullet.anims.isPlaying) {
            bullet.anims.stop();
          }
        }
      });
    }
  }

  public resumeGame(): void {
    if (this.currentState === 'paused') {
      this.currentState = 'playing';
      
      // Resume physics
      this.scene.physics.resume();
      
      // Resume all tweens
      this.scene.tweens.resumeAll();
      
      // Add pause time to UI manager
      const pauseDuration = this.scene.time.now - this.pauseStartTime;
      this.uiManager.addPauseTime(pauseDuration);
      
      this.uiManager.setPauseVisibility(false);
      this.pauseStartTime = 0;
      this.pauseReason = null;
      
      if (this.useTestMode) {
        console.log('Game resumed');
      }
    }
  }

  public togglePause(): void {
    if (this.currentState === 'playing') {
      this.pauseGame('user');
    } else if (this.currentState === 'paused') {
      this.resumeGame();
    }
  }

  public setGameOver(): void {
    this.currentState = 'gameOver';
    this.uiManager.setLevelCompleteText('GAME OVER');
    
    if (this.useTestMode) {
      console.log('Game Over');
    }
  }

  public setLevelComplete(): void {
    this.currentState = 'completed';
    this.uiManager.setLevelCompleteText('Level Complete!');
    
    if (this.useTestMode) {
      console.log('Level completed!');
    }
  }

  public enterShop(): void {
    this.currentState = 'shop';
    
    // Stop all movement by setting velocities to zero
    this.stopAllMovement();
    
    // Pause physics and animations when entering shop
    this.scene.physics.pause();
    this.scene.tweens.pauseAll();
    
    if (this.useTestMode) {
      console.log('Entering shop');
    }
  }

  public exitShop(): void {
    if (this.currentState === 'shop') {
      this.currentState = 'playing';
      
      // Resume physics and animations when exiting shop
      this.scene.physics.resume();
      this.scene.tweens.resumeAll();
      
      if (this.useTestMode) {
        console.log('Exiting shop');
      }
    }
  }

  public resetToPlaying(): void {
    this.currentState = 'playing';
    this.uiManager.setPauseVisibility(false);
    this.uiManager.setLevelCompleteText(null);
    this.pauseStartTime = 0;
    this.pauseReason = null;
  }

  public getPauseReason(): 'user' | 'levelComplete' | null {
    return this.pauseReason;
  }

  public getPauseDuration(): number {
    if (this.currentState === 'paused') {
      return this.scene.time.now - this.pauseStartTime;
    }
    return 0;
  }
} 