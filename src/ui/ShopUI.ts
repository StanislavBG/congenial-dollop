import Phaser from 'phaser';
import { ShopCard } from '../types/Shop';

export class ShopUI {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private cards: ShopCard[] = [];
  private cardSprites: Phaser.GameObjects.Container[] = [];
  private isVisible: boolean = false;
  private onCardSelected?: (card: ShopCard) => void;
  private currentLevel: number = 1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(400, 420); // Moved to bottom half, below messages
    this.container.setVisible(false);
    this.generateCards();
  }

  private generateCards(): void {
    this.cards = [];
    
    // Scale values based on level (higher levels = better upgrades)
    const levelMultiplier = Math.max(1, this.currentLevel - 100); // Level 101 = 1, 102 = 2, 103 = 3
    
    const testCards = [
      {
        id: 'health_test',
        type: 'health' as const,
        name: 'Health Restore',
        description: 'Restore current health',
        value: 15 * levelMultiplier, // Scales with level
        rarity: 'common' as const,
        probability: 1,
        color: 0x00ff00
      },
      {
        id: 'damage_test',
        type: 'damage' as const,
        name: 'Damage Boost',
        description: 'Increase bullet damage',
        value: 12 * levelMultiplier, // Scales with level
        rarity: 'common' as const,
        probability: 1,
        color: 0xff0000
      },
      {
        id: 'speed_test',
        type: 'speed' as const,
        name: 'Speed Boost',
        description: 'Increase movement speed',
        value: 20 * levelMultiplier, // Scales with level
        rarity: 'common' as const,
        probability: 1,
        color: 0x0000ff
      }
    ];
    
    this.cards = testCards;
  }

  show(onCardSelected?: (card: ShopCard) => void, level?: number): void {
    this.onCardSelected = onCardSelected;
    this.currentLevel = level || 1;
    this.isVisible = true;
    this.container.setVisible(true);
    this.generateCards(); // Generate new cards each time
    this.createShopInterface();
  }

  hide(): void {
    this.isVisible = false;
    this.container.setVisible(false);
    this.clearCards();
  }

  private createShopInterface(): void {
    this.clearCards();
    
    // Create expanded shop background
    const background = this.scene.add.rectangle(0, 0, 600, 150, 0x000000, 0.8);
    background.setStrokeStyle(2, 0xffffff);
    this.container.add(background);
    
    // Create shop title
    const title = this.scene.add.text(0, -50, 'SHOP', {
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.container.add(title);
    
    // Create smaller cards
    this.cards.forEach((card, index) => {
      const cardContainer = this.createCard(card, index);
      this.cardSprites.push(cardContainer);
      this.container.add(cardContainer);
    });
  }

  private createCard(card: ShopCard, index: number): Phaser.GameObjects.Container {
    const cardContainer = this.scene.add.container(0, 0);
    
    // Calculate expanded card position
    const cardWidth = 150;
    const cardHeight = 80;
    const spacing = 20;
    const totalWidth = (this.cards.length * cardWidth) + ((this.cards.length - 1) * spacing);
    const startX = -totalWidth / 2 + cardWidth / 2;
    const x = startX + index * (cardWidth + spacing);
    const y = 10; // Centered in shop area
    
    // Card background
    const cardBg = this.scene.add.rectangle(x, y, cardWidth, cardHeight, card.color, 0.8);
    cardBg.setStrokeStyle(1, 0xffffff);
    cardContainer.add(cardBg);
    
    // Card title (expanded)
    const title = this.scene.add.text(x, y - 25, card.name, {
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    cardContainer.add(title);
    
    // Card value (expanded)
    const valueText = this.scene.add.text(x, y, `+${card.value}`, {
      fontSize: '20px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    cardContainer.add(valueText);
    
    // Card type indicator (expanded)
    const typeText = this.scene.add.text(x, y + 20, card.type.toUpperCase(), {
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    cardContainer.add(typeText);
    
    // Card number for keyboard selection
    const cardNumber = this.scene.add.text(x + 50, y - 30, `[${index + 1}]`, {
      fontSize: '14px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    cardContainer.add(cardNumber);
    
    // Make card interactive
    cardBg.setInteractive();
    cardBg.on('pointerdown', () => {
      this.selectCard(card);
    });
    
    // Hover effects
    cardBg.on('pointerover', () => {
      cardBg.setScale(1.05);
      cardBg.setStrokeStyle(2, 0xffff00);
    });
    
    cardBg.on('pointerout', () => {
      cardBg.setScale(1);
      cardBg.setStrokeStyle(1, 0xffffff);
    });
    
    return cardContainer;
  }

  private selectCard(card: ShopCard): void {
    if (this.onCardSelected) {
      this.onCardSelected(card);
    }
    this.hide();
  }

  public selectCardByIndex(index: number): void {
    if (index >= 0 && index < this.cards.length) {
      this.selectCard(this.cards[index]);
    }
  }

  private clearCards(): void {
    this.cardSprites.forEach(sprite => {
      sprite.destroy();
    });
    this.cardSprites = [];
    
    // Clear container children except background and title
    this.container.each((child: any) => {
      if (child.type !== 'Rectangle' && child.text !== 'SHOP') {
        child.destroy();
      }
    });
  }

  isShopVisible(): boolean {
    return this.isVisible;
  }
} 