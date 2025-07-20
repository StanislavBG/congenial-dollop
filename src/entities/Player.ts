import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private bullets!: Phaser.GameObjects.Group;
  private health: number;
  private lastShootTime: number = 0;
  private shootCooldown: number = 200; // milliseconds
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key, A: Phaser.Input.Keyboard.Key, S: Phaser.Input.Keyboard.Key, D: Phaser.Input.Keyboard.Key };

  constructor(scene: Phaser.Scene, x: number, y: number, health: number = 100) {
    super(scene, x, y, 'player');
    
    this.health = health;
    
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set up player properties
    this.setScale(0.5);
    
    // Create bullet group
    this.bullets = scene.add.group();
    
    // Create a simple rectangle for the player (placeholder)
    this.createPlayerSprite();

    // WASD keys
    this.wasdKeys = {
      W: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
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
    // Handle keyboard movement
    this.setVelocity(0);
    
    if (cursors.left?.isDown || this.wasdKeys.A.isDown) {
      this.setVelocityX(-200);
    } else if (cursors.right?.isDown || this.wasdKeys.D.isDown) {
      this.setVelocityX(200);
    }
    
    if (cursors.up?.isDown || this.wasdKeys.W.isDown) {
      this.setVelocityY(-200);
    } else if (cursors.down?.isDown || this.wasdKeys.S.isDown) {
      this.setVelocityY(200);
    }
    
    // Keep player within main area bounds (800x600)
    // X: 0 to 800
    // Y: 0 to 600
    if (this.x < 0 || this.x > 800) {
      this.setVelocityX(-this.body!.velocity.x);
    }
    if (this.y < 0 || this.y > 600) {
      this.setVelocityY(-this.body!.velocity.y);
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
    
    // Determine bullet direction - shoot towards mouse cursor
    const mouse = this.scene.input.activePointer;
    let targetPos = { x: this.x, y: this.y - 100 }; // Default: shoot up
    
    if (mouse && (mouse.x !== 0 || mouse.y !== 0)) {
      targetPos = { x: mouse.x, y: mouse.y };
    }
    
    this.shootAt(targetPos.x, targetPos.y, bullet);
  }
  
  shootAt(targetX: number, targetY: number, bullet?: Bullet) {
    const currentTime = Date.now();
    if (currentTime - this.lastShootTime < this.shootCooldown) {
      return;
    }
    
    this.lastShootTime = currentTime;
    
    // Create bullet if not provided
    if (!bullet) {
      bullet = new Bullet(this.scene, this.x, this.y);
      this.bullets.add(bullet);
    }
    
    // Calculate angle and set velocity
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    bullet.setVelocity(
      Math.cos(angle) * 400,
      Math.sin(angle) * 400
    );
  }

  getBullets(): Phaser.GameObjects.Group {
    return this.bullets;
  }

  damage(damageAmount: number = 20) {
    this.health -= damageAmount;
    // Flash red when damaged
    this.setTint(0xff0000);
    this.scene.time.delayedCall(200, () => {
      this.clearTint();
    });
  }

  getHealth(): number {
    return this.health;
  }
  
  resetHealth(health: number) {
    this.health = health;
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