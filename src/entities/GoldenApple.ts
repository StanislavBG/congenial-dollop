import Phaser from 'phaser';

export class GoldenApple extends Phaser.Physics.Arcade.Sprite {
  private healthBonus: number = 50;
  private rotationSpeed: number = 0.02;
  private bobSpeed: number = 0.003;
  private bobAmount: number = 5;
  private startY: number = 0;
  public isCollected: boolean = false; // Guard against multiple collections - made public for external access

  constructor(scene: Phaser.Scene, x: number, y: number, healthBonus: number = 50) {
    super(scene, x, y, 'goldenApple');
    
    this.healthBonus = healthBonus;
    this.startY = y;
    
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set up apple properties
    this.setScale(0.6);
    this.setBounce(0.2);
    this.setCollideWorldBounds(true);
    
    // Create apple sprite
    this.createAppleSprite();
  }

  private createAppleSprite() {
    // Create a golden apple sprite
    const graphics = this.scene.add.graphics();
    
    // Apple body (red circle)
    graphics.fillStyle(0xff0000);
    graphics.fillCircle(0, 0, 12);
    
    // Apple highlight (lighter red)
    graphics.fillStyle(0xff6666);
    graphics.fillCircle(-3, -3, 4);
    
    // Golden glow effect
    graphics.lineStyle(3, 0xffdd00, 0.8);
    graphics.strokeCircle(0, 0, 15);
    
    // Apple stem (brown)
    graphics.fillStyle(0x8B4513);
    graphics.fillRect(-1, -12, 2, 4);
    
    // Apple leaf (green)
    graphics.fillStyle(0x228B22);
    graphics.fillEllipse(4, -10, 6, 3);
    
    graphics.generateTexture('goldenApple', 32, 32);
    graphics.destroy();
    
    this.setTexture('goldenApple');
  }

  update() {
    // Rotate the apple
    this.rotation += this.rotationSpeed;
    
    // Bob up and down
    const bobOffset = Math.sin(this.scene.time.now * this.bobSpeed) * this.bobAmount;
    this.y = this.startY + bobOffset;
  }

  getHealthBonus(): number {
    return this.healthBonus;
  }

  collect(): void {
    // Prevent multiple collections
    if (this.isCollected) {
      console.log(`🍎 Apple already collected, ignoring duplicate collection`);
      return;
    }
    
    this.isCollected = true;
    console.log(`🍎 Apple collection started, will destroy in 300ms`);
    
    // Play collection effect
    this.setTint(0xffff00);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.destroy();
      }
    });
  }
} 