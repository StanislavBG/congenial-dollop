import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private bullets!: Phaser.GameObjects.Group;
  private health: number;
  private maxHealth: number = 100;
  private lastShootTime: number = 0;
  private shootCooldown: number = 200; // milliseconds
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key, A: Phaser.Input.Keyboard.Key, S: Phaser.Input.Keyboard.Key, D: Phaser.Input.Keyboard.Key };
  private isInvulnerable: boolean = false;
  private invulnerabilityEndTime: number = 0;
  private collisionDamage: number = 15; // Damage player does to enemies on collision
  private bulletDamage: number = 10; // Base bullet damage
  private movementSpeed: number = 200; // Base movement speed
  constructor(scene: Phaser.Scene, x: number, y: number, health: number = 100) {
    super(scene, x, y, 'player-idle');
    
    this.health = health;
    this.maxHealth = health;
    
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set proper scale and origin
    this.setScale(0.25); // Scale down for 256x256 sprites
    this.setOrigin(0.5, 0.5);
    
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

  private lastWalkCycle: number = 0;
  private lastWalkCycleTime: number = 0;
  private currentTexture: string = 'player-idle';

  private handlePlayerAnimations(isMoving: boolean) {
    // Don't change texture if hit animation is playing
    if (this.isInvulnerable && this.scene.time.now < this.invulnerabilityEndTime) {
      return;
    }
    
    const currentTime = this.scene.time.now;
    
    if (isMoving) {
      // Only recalculate walk cycle every 500ms
      if (currentTime - this.lastWalkCycleTime > 500) {
        this.lastWalkCycle = (this.lastWalkCycle + 1) % 2;
        this.lastWalkCycleTime = currentTime;
      }
      
      const targetTexture = this.lastWalkCycle === 0 ? 'player-walk-a' : 'player-walk-b';
      
      // Only change texture if different
      if (this.currentTexture !== targetTexture) {
        this.setTexture(targetTexture);
        this.currentTexture = targetTexture;
      }
    } else {
      // Use idle texture when not moving
      if (this.currentTexture !== 'player-idle') {
        this.setTexture('player-idle');
        this.currentTexture = 'player-idle';
      }
    }
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    // Safety check: ensure we have a valid scene and body
    if (!this.scene || !this.body) {
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

  shootAt(targetX: number, targetY: number, bullet?: Bullet) {
    // Safety check: ensure we have a valid scene and bullets group
    if (!this.scene || !this.bullets) {
      return;
    }
    
    const currentTime = Date.now();
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

  private hitAnimationActive: boolean = false;

  damage(damageAmount: number = 20) {
    if (this.isInvulnerable) {
      return; // Don't take damage if invulnerable
    }
    
    this.health -= damageAmount;
    
    // Start invulnerability frames (0.5 seconds)
    this.isInvulnerable = true;
    this.invulnerabilityEndTime = this.scene.time.now + 500;
    
    // Show hit texture for 0.5 seconds (only if not already active)
    if (!this.hitAnimationActive) {
      this.hitAnimationActive = true;
      this.setTexture('player-hit');
      this.currentTexture = 'player-hit';
      
      this.scene.time.delayedCall(500, () => {
        // Return to idle after hit duration
        this.setTexture('player-idle');
        this.currentTexture = 'player-idle';
        this.hitAnimationActive = false;
      });
    }
    
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