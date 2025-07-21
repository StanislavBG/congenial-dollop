import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';

export class Game {
  constructor() {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,   // Single main area
      height: 600,  // Single main area
      parent: 'game-container',
      backgroundColor: '#2c3e50',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: [MainScene],
      input: {
        keyboard: true,
        mouse: true
      }
    };

    new Phaser.Game(config);
  }
} 