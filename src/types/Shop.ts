export interface ShopCard {
  id: string;
  type: 'health' | 'damage' | 'speed' | 'maxHealth'; // maxHealth for future max health cap increases
  name: string;
  description: string;
  value: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  probability: number; // 0-1, probability of this card appearing
  color: number; // Hex color for the card
  icon?: string; // Optional icon identifier
}

export interface ShopConfig {
  healthUpgrade: {
    minValue: number;
    maxValue: number;
  };
  damageUpgrade: {
    minValue: number;
    maxValue: number;
  };
  speedUpgrade: {
    minValue: number;
    maxValue: number;
  };
  cardCount: number; // Number of cards to show in shop
}

export const SHOP_CONFIG: ShopConfig = {
  healthUpgrade: {
    minValue: 5,
    maxValue: 15
  },
  damageUpgrade: {
    minValue: 5,
    maxValue: 15
  },
  speedUpgrade: {
    minValue: 5,
    maxValue: 15
  },
  cardCount: 3
};

export const SHOP_CARDS: ShopCard[] = [
  {
    id: 'health_common',
    type: 'health',
    name: 'Health Boost',
    description: 'Increase maximum health',
    value: 0, // Will be randomized
    rarity: 'common',
    probability: 0.4,
    color: 0x00ff00
  },
  {
    id: 'health_uncommon',
    type: 'health',
    name: 'Health Surge',
    description: 'Significantly increase maximum health',
    value: 0, // Will be randomized
    rarity: 'uncommon',
    probability: 0.3,
    color: 0x00cc00
  },
  {
    id: 'damage_common',
    type: 'damage',
    name: 'Damage Boost',
    description: 'Increase bullet damage',
    value: 0, // Will be randomized
    rarity: 'common',
    probability: 0.4,
    color: 0xff0000
  },
  {
    id: 'damage_uncommon',
    type: 'damage',
    name: 'Damage Surge',
    description: 'Significantly increase bullet damage',
    value: 0, // Will be randomized
    rarity: 'uncommon',
    probability: 0.3,
    color: 0xcc0000
  },
  {
    id: 'speed_common',
    type: 'speed',
    name: 'Speed Boost',
    description: 'Increase movement speed',
    value: 0, // Will be randomized
    rarity: 'common',
    probability: 0.4,
    color: 0x0000ff
  },
  {
    id: 'speed_uncommon',
    type: 'speed',
    name: 'Speed Surge',
    description: 'Significantly increase movement speed',
    value: 0, // Will be randomized
    rarity: 'uncommon',
    probability: 0.3,
    color: 0x0000cc
  }
]; 