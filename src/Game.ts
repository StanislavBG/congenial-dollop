import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';

export class Game {
  private game: Phaser.Game;

  constructor() {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'game-container',
      backgroundColor: '#2c3e50',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: [MainScene]
    };

    this.game = new Phaser.Game(config);
  }
} 