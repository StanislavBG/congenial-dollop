import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private bullets!: Phaser.GameObjects.Group;
  private health: number;
  private lastShootTime: number = 0;
  private shootCooldown: number = 200; // milliseconds
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key, A: Phaser.Input.Keyboard.Key, S: Phaser.Input.Keyboard.Key, D: Phaser.Input.Keyboard.Key };
  private isInvulnerable: boolean = false;
  private invulnerabilityEndTime: number = 0;
  private collisionDamage: number = 15; // Damage player does to enemies on collision

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
    // Check invulnerability
    if (this.isInvulnerable && this.scene.time.now > this.invulnerabilityEndTime) {
      this.isInvulnerable = false;
      this.clearTint();
    }
    
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
    if (this.x < 10) {
      this.x = 10;
      this.setVelocityX(0);
    } else if (this.x > 790) {
      this.x = 790;
      this.setVelocityX(0);
    }
    
    if (this.y < 10) {
      this.y = 10;
      this.setVelocityY(0);
    } else if (this.y > 590) {
      this.y = 590;
      this.setVelocityY(0);
    }
    
    // Additional safety check - if somehow outside bounds, force back in
    if (this.x < 0 || this.x > 800 || this.y < 0 || this.y > 600) {
      this.x = Math.max(10, Math.min(790, this.x));
      this.y = Math.max(10, Math.min(590, this.y));
      this.setVelocity(0, 0);
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
    if (this.isInvulnerable) {
      return; // Don't take damage if invulnerable
    }
    
    this.health -= damageAmount;
    
    // Start invulnerability frames (0.2 seconds)
    this.isInvulnerable = true;
    this.invulnerabilityEndTime = this.scene.time.now + 200;
    
    // Start blinking effect
    this.startBlinking();
  }

  private startBlinking() {
    let blinkCount = 0;
    const maxBlinks = 4; // 4 blinks over 0.2 seconds
    
    const blinkInterval = setInterval(() => {
      if (blinkCount >= maxBlinks || !this.isInvulnerable) {
        clearInterval(blinkInterval);
        this.clearTint();
        return;
      }
      
      this.setTint(blinkCount % 2 === 0 ? 0xffffff : 0x00ff00);
      blinkCount++;
    }, 50); // Blink every 50ms
  }

  // Deal damage to enemy on collision
  dealCollisionDamage(enemy: any) {
    return this.collisionDamage;
  }

  getHealth(): number {
    return this.health;
  }
  
  resetHealth(health: number) {
    this.health = health;
  }

  isInvulnerableToDamage(): boolean {
    return this.isInvulnerable;
  }

  getCollisionDamage(): number {
    return this.collisionDamage;
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