import Phaser from 'phaser';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private health: number;
  private maxHealth: number;
  private moveSpeed: number;
  private baseSpeed: number;
  private damage: number;
  private isSlowed: boolean = false;
  private slowEndTime: number = 0;
  private enemyType: string;
  private enemyColor: number;

  constructor(scene: Phaser.Scene, x: number, y: number, health: number = 30, moveSpeed: number = 120, damage: number = 20, enemyType: string = 'redDot', color: number = 0xff0000, radius: number = 12) {
    // Create a temporary texture name for initialization
    const tempTextureName = `enemy_temp_${Date.now()}`;
    
    // Create a basic circle texture for initialization
    const graphics = scene.add.graphics();
    graphics.fillStyle(color);
    graphics.fillCircle(0, 0, radius);
    graphics.generateTexture(tempTextureName, radius * 2, radius * 2);
    graphics.destroy();
    
    super(scene, x, y, tempTextureName);
    
    this.health = health;
    this.maxHealth = health;
    this.moveSpeed = moveSpeed;
    this.baseSpeed = moveSpeed;
    this.damage = damage;
    this.enemyType = enemyType;
    this.enemyColor = color;
    
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Use Phaser's built-in bounds system instead of manual checking
    this.setCollideWorldBounds(true);
    this.body!.bounce.set(0.2, 0.2); // Bounce off walls
    
    // Create the proper enemy sprite with highlights
    this.createEnemySprite(radius);
    
    // Set scale AFTER creating the sprite (will be overridden by SpawnManager if needed)
    this.setScale(0.4);
  }

  private createEnemySprite(radius: number) {
    // Create a unique texture name for this enemy type
    const textureName = `enemy_${this.enemyType}`;
    
    // Check if texture already exists
    if (this.scene.textures.exists(textureName)) {
      this.setTexture(textureName);
      return;
    }
    
    // Create a circle with the enemy's color and proper radius
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(this.enemyColor);
    graphics.fillCircle(0, 0, radius);
    // Add a small highlight to make it look more 3D
    graphics.fillStyle(this.getHighlightColor());
    graphics.fillCircle(-radius/4, -radius/4, radius/3);
    graphics.generateTexture(textureName, radius * 2, radius * 2);
    graphics.destroy();
    
    // Set the texture and ensure it's visible
    this.setTexture(textureName);
    this.setVisible(true);
  }

  private getHighlightColor(): number {
    // Create a lighter version of the enemy color for highlights
    const r = (this.enemyColor >> 16) & 0xFF;
    const g = (this.enemyColor >> 8) & 0xFF;
    const b = this.enemyColor & 0xFF;
    
    const lighterR = Math.min(255, r + 100);
    const lighterG = Math.min(255, g + 100);
    const lighterB = Math.min(255, b + 100);
    
    return (lighterR << 16) | (lighterG << 8) | lighterB;
  }

  update(player: any) {
    // Safety check: ensure we have a valid scene and body
    if (!this.scene || !this.body) {
      return;
    }
    
    // Check if game is paused - don't update if paused
    if ((this.scene as any).gameStateManager && !(this.scene as any).gameStateManager.isPlaying()) {
      return;
    }
    
    // Check if slow effect has worn off
    if (this.isSlowed && this.scene.time.now > this.slowEndTime) {
      this.isSlowed = false;
      this.moveSpeed = this.baseSpeed;
    }
    
    // Gravitational AI: always move towards player
    if (player && player.active) {
      try {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        this.setVelocity(
          Math.cos(angle) * this.moveSpeed,
          Math.sin(angle) * this.moveSpeed
        );
      } catch (error) {
        console.error('Error updating enemy movement:', error);
      }
    }
    
    // Phaser's setCollideWorldBounds handles all bounds checking automatically
    // No need for manual bounds checking anymore
  }

  takeDamage(amount: number = 10) {
    this.health -= amount;
    // Flash white when damaged
    this.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.active) {
        this.clearTint();
      }
    });
    
    return this.health <= 0;
  }

  // Method to handle collision with player
  onPlayerCollision() {
    // Slow down the enemy for 1 second
    this.isSlowed = true;
    this.slowEndTime = this.scene.time.now + 1000;
    this.moveSpeed = this.baseSpeed * 0.5; // 50% speed reduction
    
    // Flash red when hitting player
    this.setTint(0xff0000);
    this.scene.time.delayedCall(200, () => {
      if (this.active) {
        this.clearTint();
      }
    });
  }

  // Method to handle collision with other enemies
  onEnemyCollision() {
    // Flash orange when colliding with other enemies
    this.setTint(0xff8800);
    this.scene.time.delayedCall(150, () => {
      if (this.active) {
        this.clearTint();
      }
    });
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  getDamage(): number {
    return this.damage;
  }

  getMoveSpeed(): number {
    return this.moveSpeed;
  }

  getBaseSpeed(): number {
    return this.baseSpeed;
  }

  isAlive(): boolean {
    return this.health > 0;
  }

  getEnemyType(): string {
    return this.enemyType;
  }
} 