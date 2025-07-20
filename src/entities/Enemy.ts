import Phaser from 'phaser';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private health: number;
  private moveSpeed: number;

  constructor(scene: Phaser.Scene, x: number, y: number, health: number = 30, moveSpeed: number = 120) {
    super(scene, x, y, 'enemy');
    
    this.health = health;
    this.moveSpeed = moveSpeed;
    
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set up enemy properties
    this.setScale(0.4);
    
    // Create enemy sprite
    this.createEnemySprite();
  }

  private createEnemySprite() {
    // Create a red circle that looks like a falling ball
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xff0000);
    graphics.fillCircle(0, 0, 12);
    // Add a small highlight to make it look more 3D
    graphics.fillStyle(0xff6666);
    graphics.fillCircle(-3, -3, 4);
    graphics.generateTexture('enemy', 24, 24);
    graphics.destroy();
    
    this.setTexture('enemy');
  }

  update(player: any) {
    // Gravitational AI: always move towards player
    if (player) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      this.setVelocity(
        Math.cos(angle) * this.moveSpeed,
        Math.sin(angle) * this.moveSpeed
      );
    }
    
    // Keep enemy within bounds (main area: 800x600)
    if (this.x < 0 || this.x > 800) {
      this.setVelocityX(-this.body!.velocity.x);
    }
    if (this.y < 0 || this.y > 600) {
      this.setVelocityY(-this.body!.velocity.y);
    }
  }



  damage() {
    this.health -= 10;
    // Flash white when damaged
    this.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
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
} 