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
    // Position will be set dynamically in show() method
    this.container = scene.add.container(0, 0);
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
    
    // Position shop in bottom half of screen, centered
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;
    const shopX = screenWidth / 2;
    const shopY = screenHeight * 0.75; // 75% down the screen (bottom half)
    
    this.container.setPosition(shopX, shopY);
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
    
    // Calculate responsive shop dimensions
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;
    const shopWidth = Math.min(800, Math.floor(screenWidth * 0.8)); // 80% of screen width, max 800px
    const shopHeight = Math.min(200, Math.floor(screenHeight * 0.15)); // 15% of screen height, max 200px
    const titleFontSize = Math.max(24, Math.floor(screenWidth * 0.018)); // 1.8% of screen width, min 24px
    
    // Create responsive shop background
    const background = this.scene.add.rectangle(0, 0, shopWidth, shopHeight, 0x000000, 0.8);
    background.setStrokeStyle(2, 0xffffff);
    this.container.add(background);
    
    // Create shop title with responsive font size
    const title = this.scene.add.text(0, -Math.floor(shopHeight * 0.4), 'SHOP', {
      fontSize: `${titleFontSize}px`,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.container.add(title);
    
    // Create responsive cards
    this.cards.forEach((card, index) => {
      const cardContainer = this.createCard(card, index, shopWidth, shopHeight);
      this.cardSprites.push(cardContainer);
      this.container.add(cardContainer);
    });
  }

  private createCard(card: ShopCard, index: number, shopWidth: number, shopHeight: number): Phaser.GameObjects.Container {
    const cardContainer = this.scene.add.container(0, 0);
    
    // Calculate responsive card dimensions
    const cardWidth = Math.min(180, Math.floor(shopWidth * 0.25)); // 25% of shop width, max 180px
    const cardHeight = Math.min(100, Math.floor(shopHeight * 0.6)); // 60% of shop height, max 100px
    const spacing = Math.max(15, Math.floor(cardWidth * 0.1)); // 10% of card width, min 15px
    
    // Calculate responsive font sizes
    const titleFontSize = Math.max(14, Math.floor(cardWidth * 0.08)); // 8% of card width, min 14px
    const valueFontSize = Math.max(18, Math.floor(cardWidth * 0.12)); // 12% of card width, min 18px
    const typeFontSize = Math.max(10, Math.floor(cardWidth * 0.07)); // 7% of card width, min 10px
    const numberFontSize = Math.max(12, Math.floor(cardWidth * 0.08)); // 8% of card width, min 12px
    
    // Calculate card positioning within shop
    const totalWidth = (this.cards.length * cardWidth) + ((this.cards.length - 1) * spacing);
    const startX = -totalWidth / 2 + cardWidth / 2;
    const x = startX + index * (cardWidth + spacing);
    const y = Math.floor(shopHeight * 0.1); // 10% from top of shop area
    
    // Card background
    const cardBg = this.scene.add.rectangle(x, y, cardWidth, cardHeight, card.color, 0.8);
    cardBg.setStrokeStyle(1, 0xffffff);
    cardContainer.add(cardBg);
    
    // Card title (responsive)
    const title = this.scene.add.text(x, y - Math.floor(cardHeight * 0.3), card.name, {
      fontSize: `${titleFontSize}px`,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    cardContainer.add(title);
    
    // Card value (responsive)
    const valueText = this.scene.add.text(x, y, `+${card.value}`, {
      fontSize: `${valueFontSize}px`,
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    cardContainer.add(valueText);
    
    // Card type indicator (responsive)
    const typeText = this.scene.add.text(x, y + Math.floor(cardHeight * 0.25), card.type.toUpperCase(), {
      fontSize: `${typeFontSize}px`,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    cardContainer.add(typeText);
    
    // Card number for keyboard selection (responsive)
    const cardNumber = this.scene.add.text(x + Math.floor(cardWidth * 0.35), y - Math.floor(cardHeight * 0.35), `[${index + 1}]`, {
      fontSize: `${numberFontSize}px`,
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