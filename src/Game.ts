import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';

export class Game {
  constructor() {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: 'game-container',
      backgroundColor: '#2c3e50',
      transparent: true, // Enable transparency for proper PNG alpha channel handling
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false // Will be enabled per-object in test mode
        }
      },
      scene: [MainScene],
                input: {
            keyboard: true
          }
    };

    const game = new Phaser.Game(config);
    
    // Handle window resize for responsive design
    window.addEventListener('resize', () => {
      game.scale.resize(window.innerWidth, window.innerHeight);
    });
  }
} 