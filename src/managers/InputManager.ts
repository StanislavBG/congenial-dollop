import Phaser from 'phaser';
import { GameStateManager } from './GameStateManager';
import { UIManager } from './UIManager';

export class InputManager {
  private scene: Phaser.Scene;
  private gameStateManager: GameStateManager;
  private uiManager: UIManager;
  private useTestMode: boolean;
  
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private pKeyPressed: boolean = false;
  private tKeyPressed: boolean = false;

  constructor(scene: Phaser.Scene, gameStateManager: GameStateManager, uiManager: UIManager, useTestMode: boolean = false) {
    this.scene = scene;
    this.gameStateManager = gameStateManager;
    this.uiManager = uiManager;
    this.useTestMode = useTestMode;
  }

  public initialize(): void {
    this.setupCursorKeys();
    this.setupKeyboardShortcuts();
  }

  private setupCursorKeys(): void {
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
  }

  private setupKeyboardShortcuts(): void {
    // P key for pause
    this.scene.input.keyboard!.on('keydown-P', () => {
      if (!this.pKeyPressed) {
        this.pKeyPressed = true;
        this.gameStateManager.togglePause();
      }
    });

    this.scene.input.keyboard!.on('keyup-P', () => {
      this.pKeyPressed = false;
    });

    // T key for test overlap system (test mode only)
    if (this.useTestMode) {
      this.scene.input.keyboard!.on('keydown-T', () => {
        if (!this.tKeyPressed) {
          this.tKeyPressed = true;
          this.testOverlapSystem();
        }
      });

      this.scene.input.keyboard!.on('keyup-T', () => {
        this.tKeyPressed = false;
      });
    }

    // Admin toggle (test mode only)
    if (this.useTestMode) {
      this.scene.input.keyboard!.on('keydown-A', () => {
        this.toggleAdmin();
      });
    }

    // Shop card selection keys
    this.scene.input.keyboard!.on('keydown-ONE', () => {
      this.handleShopCardSelection(0);
    });

    this.scene.input.keyboard!.on('keydown-TWO', () => {
      this.handleShopCardSelection(1);
    });

    this.scene.input.keyboard!.on('keydown-THREE', () => {
      this.handleShopCardSelection(2);
    });

    // Space key for shop continuation
    this.scene.input.keyboard!.on('keydown-SPACE', () => {
      this.handleSpaceKey();
    });
  }

  public getCursors(): Phaser.Types.Input.Keyboard.CursorKeys {
    return this.cursors;
  }

  private toggleAdmin(): void {
    // Toggle admin visibility by tracking it locally
    const currentVisibility = this.uiManager.isAdminVisible();
    this.uiManager.setAdminVisibility(!currentVisibility);
    
    if (this.useTestMode) {
      console.log('Admin visibility toggled:', !currentVisibility);
    }
  }

  private testOverlapSystem(): void {
    if (!this.useTestMode) return;

    // Get all active enemies
    const enemies = this.scene.children.getByName('enemies');
    if (!enemies || !(enemies instanceof Phaser.GameObjects.Group)) return;

    const activeEnemies = enemies.getChildren().filter((enemy: any) => enemy.active);
    
    if (this.useTestMode) {
      console.log(`Testing overlap system with ${activeEnemies.length} active enemies`);
    }

    // Check for overlaps between enemies
    let overlapCount = 0;
    for (let i = 0; i < activeEnemies.length; i++) {
      for (let j = i + 1; j < activeEnemies.length; j++) {
        const enemy1 = activeEnemies[i] as Phaser.Physics.Arcade.Sprite;
        const enemy2 = activeEnemies[j] as Phaser.Physics.Arcade.Sprite;
        
        if (Phaser.Geom.Rectangle.Overlaps(enemy1.getBounds(), enemy2.getBounds())) {
          overlapCount++;
          if (this.useTestMode) {
            console.log(`Overlap detected between enemies ${i} and ${j}`);
          }
        }
      }
    }

    if (this.useTestMode) {
      console.log(`Total overlaps found: ${overlapCount}`);
    }
  }

  private handleShopCardSelection(index: number): void {
    if (this.gameStateManager.isInShop()) {
      // Get the shop UI from the scene
      const shopUI = (this.scene as any).shopUI;
      if (shopUI && typeof shopUI.selectCardByIndex === 'function') {
        shopUI.selectCardByIndex(index);
      }
    }
  }

  private handleSpaceKey(): void {
    if (this.gameStateManager.isPaused() && this.gameStateManager.getPauseReason() === 'levelComplete') {
      // Continue to next level
      const mainScene = this.scene as any;
      if (mainScene.continueToNextLevel) {
        mainScene.continueToNextLevel();
      }
    } else if (this.gameStateManager.isInShop()) {
      // Clear messages in shop
      const mainScene = this.scene as any;
      if (mainScene.clearAllTextObjects) {
        mainScene.clearAllTextObjects();
      }
    }
  }

  public destroy(): void {
    // Clean up event listeners
    this.scene.input.keyboard!.off('keydown-P');
    this.scene.input.keyboard!.off('keyup-P');
    this.scene.input.keyboard!.off('keydown-T');
    this.scene.input.keyboard!.off('keyup-T');
    this.scene.input.keyboard!.off('keydown-A');
    this.scene.input.keyboard!.off('keydown-ONE');
    this.scene.input.keyboard!.off('keydown-TWO');
    this.scene.input.keyboard!.off('keydown-THREE');
    this.scene.input.keyboard!.off('keydown-SPACE');
  }
} 