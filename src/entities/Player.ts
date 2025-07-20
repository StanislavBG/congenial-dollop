import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private bullets!: Phaser.GameObjects.Group;
  private health: number = 100;
  private lastShootTime: number = 0;
  private shootCooldown: number = 200; // milliseconds

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set up player properties
    this.setCollideWorldBounds(true);
    this.setScale(0.5);
    
    // Create bullet group
    this.bullets = scene.add.group();
    
    // Create a simple rectangle for the player (placeholder)
    this.createPlayerSprite();
  }

  private createPlayerSprite() {
    // Create a simple colored rectangle for the player
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x00ff00);
    graphics.fillRect(-10, -10, 20, 20);
    graphics.generateTexture('player', 20, 20);
    graphics.destroy();
    
    this.setTexture('player');
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    // Handle movement
    this.setVelocity(0);
    
    if (cursors.left?.isDown) {
      this.setVelocityX(-200);
    } else if (cursors.right?.isDown) {
      this.setVelocityX(200);
    }
    
    if (cursors.up?.isDown) {
      this.setVelocityY(-200);
    } else if (cursors.down?.isDown) {
      this.setVelocityY(200);
    }
    
    // Handle shooting
    if (cursors.space?.isDown) {
      this.shoot();
    }
  }

  private shoot() {
    const currentTime = Date.now();
    if (currentTime - this.lastShootTime < this.shootCooldown) {
      return;
    }
    
    this.lastShootTime = currentTime;
    
    // Create bullet
    const bullet = new Bullet(this.scene, this.x, this.y);
    this.bullets.add(bullet);
    
    // Set bullet velocity towards mouse or forward direction
    const pointer = this.scene.input.activePointer;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.x, pointer.y);
    bullet.setVelocity(
      Math.cos(angle) * 400,
      Math.sin(angle) * 400
    );
  }

  getBullets(): Phaser.GameObjects.Group {
    return this.bullets;
  }

  damage() {
    this.health -= 20;
    // Flash red when damaged
    this.setTint(0xff0000);
    this.scene.time.delayedCall(200, () => {
      this.clearTint();
    });
  }

  getHealth(): number {
    return this.health;
  }
}

class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bullet');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setScale(0.3);
    
    // Create bullet sprite
    this.createBulletSprite();
    
    // Auto-destroy after 2 seconds
    scene.time.delayedCall(2000, () => {
      this.destroy();
    });
  }

  private createBulletSprite() {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xffff00);
    graphics.fillCircle(0, 0, 5);
    graphics.generateTexture('bullet', 10, 10);
    graphics.destroy();
    
    this.setTexture('bullet');
  }
} 