import Phaser from 'phaser';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private health: number = 30;
  private moveSpeed: number = 100;
  private lastDirectionChange: number = 0;
  private directionChangeInterval: number = 2000; // 2 seconds

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy');
    
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set up enemy properties
    this.setScale(0.4);
    
    // Create enemy sprite
    this.createEnemySprite();
    
    // Set initial random velocity
    this.setRandomVelocity();
  }

  private createEnemySprite() {
    // Create a simple colored circle for the enemy
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xff0000);
    graphics.fillCircle(0, 0, 15);
    graphics.generateTexture('enemy', 30, 30);
    graphics.destroy();
    
    this.setTexture('enemy');
  }

  update(player: any) {
    const currentTime = Date.now();
    
    // Change direction periodically
    if (currentTime - this.lastDirectionChange > this.directionChangeInterval) {
      this.setRandomVelocity();
      this.lastDirectionChange = currentTime;
    }
    
    // Simple AI: move towards player if close
    if (player) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (distance < 150) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        this.setVelocity(
          Math.cos(angle) * this.moveSpeed,
          Math.sin(angle) * this.moveSpeed
        );
      }
    }
    
    // Keep enemy within bounds
    if (this.x < 50 || this.x > 750) {
      this.setVelocityX(-this.body!.velocity.x);
    }
    if (this.y < 50 || this.y > 550) {
      this.setVelocityY(-this.body!.velocity.y);
    }
  }

  private setRandomVelocity() {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.setVelocity(
      Math.cos(angle) * this.moveSpeed,
      Math.sin(angle) * this.moveSpeed
    );
  }

  damage() {
    this.health -= 10;
    // Flash white when damaged
    this.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });
  }

  getHealth(): number {
    return this.health;
  }
} 