/**
 * Enemy type interface
 */
export interface EnemyType {
  id: string;
  name: string;
  health: number;
  speed: number;
  damage: number;
  sprite: string;
  scale: number;
  color: number;
  radius: number;
}

/**
 * Predefined enemy types with different characteristics
 */
export const ENEMY_TYPES: Record<string, EnemyType> = {
  
  redDot: {
    id: 'redDot',
    name: 'Red Dot',
    health: 30,
    speed: 120,
    damage: 20,
    sprite: 'enemy',
    scale: 0.4,
    color: 0xff0000,
    radius: 12
  },

  yellowDot: {
    id: 'yellowDot',
    name: 'Yellow Dot',
    health: 40,
    speed: 110,
    damage: 50,
    sprite: 'enemy',
    scale: 0.5,
    color: 0xffff00,
    radius: 15
  },

  basic: {
    id: 'basic',
    name: 'Basic Enemy',
    health: 30,
    speed: 120,
    damage: 20,
    sprite: 'enemy',
    scale: 0.4,
    color: 0xff0000,
    radius: 12
  },

  fast: {
    id: 'fast',
    name: 'Fast Enemy',
    health: 20,
    speed: 180,
    damage: 15,
    sprite: 'enemy',
    scale: 0.35,
    color: 0xff6600,
    radius: 10
  },

  tank: {
    id: 'tank',
    name: 'Tank Enemy',
    health: 60,
    speed: 80,
    damage: 30,
    sprite: 'enemy',
    scale: 0.5,
    color: 0x880000,
    radius: 15
  },

  sniper: {
    id: 'sniper',
    name: 'Sniper Enemy',
    health: 25,
    speed: 100,
    damage: 40,
    sprite: 'enemy',
    scale: 0.3,
    color: 0xff00ff,
    radius: 8
  },

  swarm: {
    id: 'swarm',
    name: 'Swarm Enemy',
    health: 15,
    speed: 150,
    damage: 10,
    sprite: 'enemy',
    scale: 0.25,
    color: 0x00ff00,
    radius: 6
  }
};

/**
 * Get an enemy type by ID
 */
export function getEnemyType(typeId: string): EnemyType | null {
  return ENEMY_TYPES[typeId] || null;
}

/**
 * Get all available enemy type IDs
 */
export function getAvailableEnemyTypes(): string[] {
  return Object.keys(ENEMY_TYPES);
} 