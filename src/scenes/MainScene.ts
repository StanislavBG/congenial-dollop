import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.GameObjects.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    // Create player
    this.player = new Player(this, 400, 300);
    
    // Create enemy group
    this.enemies = this.add.group();
    this.spawnEnemies();
    
    // Setup input
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // Setup UI
    this.setupUI();
    
    // Setup collision detection
    this.setupCollisions();
  }

  update() {
    if (this.player) {
      this.player.update(this.cursors);
    }
    
    // Update enemies
    this.enemies.children.each((enemy: any) => {
      enemy.update(this.player);
    });
  }

  private spawnEnemies() {
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(100, 700);
      const y = Phaser.Math.Between(100, 500);
      const enemy = new Enemy(this, x, y);
      this.enemies.add(enemy);
    }
  }

  private setupUI() {
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '32px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 4
    });
  }

  private setupCollisions() {
    // Player bullets vs enemies
    this.physics.add.overlap(
      this.player.getBullets(),
      this.enemies,
      this.onBulletHitEnemy,
      undefined,
      this
    );

    // Player vs enemies
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.onPlayerHitEnemy,
      undefined,
      this
    );
  }

  private onBulletHitEnemy(bullet: any, enemy: any) {
    bullet.destroy();
    enemy.damage();
    
    if (enemy.getHealth() <= 0) {
      enemy.destroy();
      this.score += 10;
      this.scoreText.setText('Score: ' + this.score);
      
      // Spawn new enemy if all are dead
      if (this.enemies.countActive() === 0) {
        this.spawnEnemies();
      }
    }
  }

  private onPlayerHitEnemy(player: any, enemy: any) {
    // Player takes damage
    player.damage();
    enemy.destroy();
    
    if (player.getHealth() <= 0) {
      this.gameOver();
    }
  }

  private gameOver() {
    this.scene.pause();
    this.add.text(400, 300, 'GAME OVER', {
      fontSize: '64px',
      color: '#ff0000',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    this.add.text(400, 400, 'Press SPACE to restart', {
      fontSize: '24px',
      color: '#fff'
    }).setOrigin(0.5);
    
    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.restart();
    });
  }
} 