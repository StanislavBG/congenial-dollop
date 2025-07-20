# Congenial Dollop Game

A 2D top-down shooter game built with Phaser.js and TypeScript.

## Features

- **Player Movement**: Use arrow keys to move around
- **Shooting**: Press spacebar to shoot bullets towards the mouse cursor
- **Enemy AI**: Enemies move randomly and chase the player when close
- **Health System**: Player and enemies have health that decreases when hit
- **Score System**: Earn points by defeating enemies
- **Game Over**: Restart the game when you lose all health

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

## Controls

- **Arrow Keys**: Move the player
- **Spacebar**: Shoot bullets
- **Mouse**: Aim bullets (bullets shoot towards mouse cursor)

## Game Mechanics

- **Player**: Green square that you control
- **Enemies**: Red circles that move around and chase you
- **Bullets**: Yellow circles that destroy enemies
- **Health**: Player starts with 100 health, enemies with 30 health
- **Scoring**: 10 points per enemy defeated

## Development

- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`
- **Lint code**: `npm run lint`

## Project Structure

```
src/
├── main.ts          # Game entry point
├── Game.ts          # Main game configuration
├── scenes/
│   └── MainScene.ts # Main gameplay scene
└── entities/
    ├── Player.ts    # Player character
    └── Enemy.ts     # Enemy AI
```

## Technologies Used

- **Phaser.js**: 2D game framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast development server and build tool
- **HTML5 Canvas**: Game rendering 