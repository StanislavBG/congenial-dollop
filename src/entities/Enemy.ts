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

  constructor(scene: Phaser.Scene, x: number, y: number, health: number = 30, moveSpeed: number = 120, damage: number = 20, enemyType: string = 'redDot', color: number = 0xff0000) {
    super(scene, x, y, 'enemy');
    
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
    
    // Set up enemy properties
    this.setScale(0.4);
    
    // Create enemy sprite
    this.createEnemySprite();
  }

  private createEnemySprite() {
    // Create a unique texture name for this enemy type
    const textureName = `enemy_${this.enemyType}`;
    
    // Check if texture already exists
    if (this.scene.textures.exists(textureName)) {
      this.setTexture(textureName);
      return;
    }
    
    // Create a circle with the enemy's color
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(this.enemyColor);
    graphics.fillCircle(0, 0, 12);
    // Add a small highlight to make it look more 3D
    graphics.fillStyle(this.getHighlightColor());
    graphics.fillCircle(-3, -3, 4);
    graphics.generateTexture(textureName, 24, 24);
    graphics.destroy();
    
    this.setTexture(textureName);
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
    // Check if slow effect has worn off
    if (this.isSlowed && this.scene.time.now > this.slowEndTime) {
      this.isSlowed = false;
      this.moveSpeed = this.baseSpeed;
    }
    
    // Gravitational AI: always move towards player
    if (player) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      this.setVelocity(
        Math.cos(angle) * this.moveSpeed,
        Math.sin(angle) * this.moveSpeed
      );
    }
    
    // Keep enemy within bounds (main area: 800x600)
    if (this.x < 12) {
      this.x = 12;
      this.setVelocityX(0);
    } else if (this.x > 788) {
      this.x = 788;
      this.setVelocityX(0);
    }
    
    if (this.y < 12) {
      this.y = 12;
      this.setVelocityY(0);
    } else if (this.y > 588) {
      this.y = 588;
      this.setVelocityY(0);
    }
    
    // Additional safety check - if somehow outside bounds, force back in
    if (this.x < 0 || this.x > 800 || this.y < 0 || this.y > 600) {
      this.x = Math.max(12, Math.min(788, this.x));
      this.y = Math.max(12, Math.min(588, this.y));
      this.setVelocity(0, 0);
    }
  }

  takeDamage(amount: number = 10) {
    this.health -= amount;
    // Flash white when damaged
    this.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
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
      this.clearTint();
    });
  }

  // Method to handle collision with other enemies
  onEnemyCollision() {
    // Flash orange when colliding with other enemies
    this.setTint(0xff8800);
    this.scene.time.delayedCall(150, () => {
      this.clearTint();
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