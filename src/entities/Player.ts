import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private bullets!: Phaser.GameObjects.Group;
  private health: number;
  private maxHealth: number = 20;
  private lastShootTime: number = 0;
  private shootCooldown: number = 200; // milliseconds
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key, A: Phaser.Input.Keyboard.Key, S: Phaser.Input.Keyboard.Key, D: Phaser.Input.Keyboard.Key };
  private isInvulnerable: boolean = false;
  private invulnerabilityEndTime: number = 0;
  private collisionDamage: number = 15; // Damage player does to enemies on collision
  private bulletDamage: number = 10; // Base bullet damage
  private movementSpeed: number = 200; // Base movement speed
  constructor(scene: Phaser.Scene, x: number, y: number, health: number = 20) {
    super(scene, x, y, 'dog-run');
    
    this.health = health;
    this.maxHealth = health;
    
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set proper scale and origin for dog sprites
    this.setScale(0.1); // Much smaller scale for 682x682 frames
    this.setOrigin(0.5, 0.5);
    
    // Don't start animation immediately - let handlePlayerAnimations handle it
    if ((this.scene as any).USE_TEST_MODE) {
      console.log('Dog sprite created, ready for animation');
    }
    
    // Use Phaser's built-in bounds system instead of manual checking
    this.setCollideWorldBounds(true);
    this.body!.bounce.set(0.1, 0.1); // Small bounce when hitting walls
    
    // Debug: Show collision box outline only in test mode
    if ((this.scene as any).USE_TEST_MODE) {
      this.body!.debugBodyColor = 0xff0000; // Red outline
      this.body!.debugShowBody = true;
    }
    
    // Create bullet group
    this.bullets = scene.add.group();

    // WASD keys
    this.wasdKeys = {
      W: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
  }

  private handlePlayerAnimations(isMoving: boolean) {
    // Check if game is paused - don't animate if paused
    if ((this.scene as any).gameStateManager && !(this.scene as any).gameStateManager.isPlaying()) {
      return;
    }
    
    // Don't change animation if hit animation is playing
    if (this.isInvulnerable && this.scene.time.now < this.invulnerabilityEndTime) {
      return;
    }
    
    if (isMoving) {
      // Play the dog-run animation when moving
      if (!this.anims.isPlaying) {
        if ((this.scene as any).USE_TEST_MODE) {
          console.log('Player moving, playing dog-run animation');
        }
        this.play('dog-run');
      }
    } else {
      // Stop animation when not moving
      if ((this.scene as any).USE_TEST_MODE) {
        console.log('Player stopped, stopping animation');
      }
      this.stop();
    }
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    // Safety check: ensure we have a valid scene and body
    if (!this.scene || !this.body) {
      return;
    }
    
    // Check if game is paused - don't update if paused
    if ((this.scene as any).gameStateManager && !(this.scene as any).gameStateManager.isPlaying()) {
      return;
    }
    
    // Check invulnerability
    if (this.isInvulnerable && this.scene.time.now > this.invulnerabilityEndTime) {
      this.isInvulnerable = false;
      this.clearTint();
    }
    
    // Handle keyboard movement
    this.setVelocity(0);
    let isMoving = false;
    
    if (cursors.left?.isDown || this.wasdKeys.A.isDown) {
      this.setVelocityX(-this.movementSpeed);
      isMoving = true;
    } else if (cursors.right?.isDown || this.wasdKeys.D.isDown) {
      this.setVelocityX(this.movementSpeed);
      isMoving = true;
    }
    
    if (cursors.up?.isDown || this.wasdKeys.W.isDown) {
      this.setVelocityY(-this.movementSpeed);
      isMoving = true;
    } else if (cursors.down?.isDown || this.wasdKeys.S.isDown) {
      this.setVelocityY(this.movementSpeed);
      isMoving = true;
    }
    
    // Handle animations
    this.handlePlayerAnimations(isMoving);
    
    // Flip the dog based on movement direction
    if (this.body!.velocity.x < 0) {
      this.setFlipX(true); // Flip left when moving left
    } else if (this.body!.velocity.x > 0) {
      this.setFlipX(false); // Face right when moving right
    }
    // Don't change flip when moving only vertically
    
    // Debug: Log movement state occasionally only in test mode
    if ((this.scene as any).USE_TEST_MODE && Math.random() < 0.01) { // 1% chance to log (to avoid spam)
      console.log('Movement debug - isMoving:', isMoving, 'velocity:', this.body!.velocity.x, this.body!.velocity.y);
    }
    
    // Phaser's setCollideWorldBounds handles all bounds checking automatically
    // No need for manual bounds checking anymore
  }

  shootAt(targetX: number, targetY: number, bullet?: Bullet) {
    // Safety check: ensure we have a valid scene and bullets group
    if (!this.scene || !this.bullets) {
      return;
    }
    
    const currentTime = this.scene.time.now; // Use Phaser time instead of Date.now()
    if (currentTime - this.lastShootTime < this.shootCooldown) {
      return;
    }
    
    this.lastShootTime = currentTime;
    
    try {
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
    } catch (error) {
      console.error('Error in shootAt:', error);
    }
  }

  getBullets(): Phaser.GameObjects.Group {
    return this.bullets;
  }

  damage(damageAmount: number = 20) {
    if (this.isInvulnerable) {
      return; // Don't take damage if invulnerable
    }
    
    this.health -= damageAmount;
    
    // Start invulnerability frames (0.15 seconds)
    this.isInvulnerable = true;
    this.invulnerabilityEndTime = this.scene.time.now + 150;
    
    // For dog, we'll just use the blinking effect for hit feedback
    // since we don't have a separate hit animation
    
    // Start blinking effect
    this.startBlinking();
  }

  private startBlinking() {
    // Use Phaser tweens instead of setInterval
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.clearTint();
      }
    });
  }

  // Deal damage to enemy on collision
  dealCollisionDamage() {
    return this.collisionDamage;
  }

  getHealth(): number {
    return this.health;
  }
  
  resetHealth(health: number) {
    this.health = health;
  }

  addHealth(amount: number) {
    this.health += amount;
  }

  isInvulnerableToDamage(): boolean {
    return this.isInvulnerable;
  }

  getCollisionDamage(): number {
    return this.collisionDamage;
  }

  // Upgrade methods
  upgradeHealth(amount: number): void {
    this.maxHealth += amount;
    this.health += amount; // Also heal the player
  }

  upgradeDamage(amount: number): void {
    this.bulletDamage += amount;
  }

  upgradeSpeed(amount: number): void {
    this.movementSpeed += amount;
  }

  // Getter methods for stats
  getMaxHealth(): number {
    return this.maxHealth;
  }

  getBulletDamage(): number {
    return this.bulletDamage;
  }

  getMovementSpeed(): number {
    return this.movementSpeed;
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
      if (this.active) {
        this.destroy();
      }
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