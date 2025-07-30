import Phaser from 'phaser';

export interface HealthBarConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  maxHealth: number;
  currentHealth: number;
  width: number;
  height: number;
  segmentSpacing?: number;
  activeColor?: number;
  inactiveColor?: number;
  textColor?: string;
  textStrokeColor?: string;
  textStrokeThickness?: number;
  fontSize?: string;
  fontFamily?: string;
}

export class HealthBar {
  private scene: Phaser.Scene;
  private x: number;
  private y: number;
  private maxHealth: number;
  private currentHealth: number;
  private width: number;
  private height: number;
  private segmentSpacing: number;
  private activeColor: number;
  private inactiveColor: number;
  private textColor: string;
  private textStrokeColor: string;
  private textStrokeThickness: number;
  private fontSize: string;
  private fontFamily: string;
  
  private healthSegments: Phaser.GameObjects.Rectangle[] = [];
  private healthText: Phaser.GameObjects.Text | null = null;
  private healthPerSegment: number = 5; // Each segment represents 5 health points

  constructor(config: HealthBarConfig) {
    this.scene = config.scene;
    this.x = config.x;
    this.y = config.y;
    this.maxHealth = config.maxHealth;
    this.currentHealth = config.currentHealth;
    this.width = config.width;
    this.height = config.height;
    this.segmentSpacing = config.segmentSpacing ?? 1;
    this.activeColor = config.activeColor ?? 0x00ff00;
    this.inactiveColor = config.inactiveColor ?? 0x444444;
    this.textColor = config.textColor ?? '#ffffff';
    this.textStrokeColor = config.textStrokeColor ?? '#000';
    this.textStrokeThickness = config.textStrokeThickness ?? 2;
    this.fontSize = config.fontSize ?? '14px';
    this.fontFamily = config.fontFamily ?? 'monospace';
    
    this.createHealthBar();
  }

  private createHealthBar(): void {
    // Calculate segments based on max health
    const healthSegments = Math.ceil(this.maxHealth / this.healthPerSegment);
    const segmentWidth = Math.floor((this.width - (healthSegments - 1) * this.segmentSpacing) / healthSegments);
    
    // Create health segments
    for (let i = 0; i < healthSegments; i++) {
      const rect = this.scene.add.rectangle(
        this.x + i * (segmentWidth + this.segmentSpacing),
        this.y,
        segmentWidth,
        this.height,
        this.activeColor
      ).setOrigin(0, 0);
      this.healthSegments.push(rect);
    }
    
    // Create health text
    this.healthText = this.scene.add.text(
      this.x + this.width + 20,
      this.y,
      '',
      {
        fontSize: this.fontSize,
        color: this.textColor,
        stroke: this.textStrokeColor,
        strokeThickness: this.textStrokeThickness,
        fontFamily: this.fontFamily
      }
    ).setOrigin(0, 0);
    
    // Initial update
    this.update();
  }

  public update(currentHealth?: number): void {
    if (currentHealth !== undefined) {
      this.currentHealth = Math.max(0, Math.min(currentHealth, this.maxHealth));
    }
    
    const segmentsToShow = Math.ceil(this.currentHealth / this.healthPerSegment);
    const healthPercentage = this.currentHealth / this.maxHealth;
    const currentActiveColor = this.getHealthColor(healthPercentage);
    
    // Update health text
    if (this.healthText && this.healthText.active) {
      if (this.currentHealth < this.maxHealth || this.currentHealth === this.maxHealth) {
        this.healthText.setText(`${this.currentHealth}`);
        this.healthText.setVisible(true);
      } else {
        this.healthText.setVisible(false);
      }
    }
    
    // Update health segments
    for (let i = 0; i < this.healthSegments.length; i++) {
      if (this.healthSegments[i] && this.healthSegments[i].active) {
        if (i < segmentsToShow) {
          // Active health segments with dynamic color
          this.healthSegments[i].setFillStyle(currentActiveColor);
        } else {
          // Empty segments
          this.healthSegments[i].setFillStyle(this.inactiveColor);
        }
      }
    }
  }

  private getHealthColor(healthPercentage: number): number {
    if (healthPercentage > 0.6) {
      return 0x00ff00; // Green for high health (>60%)
    } else if (healthPercentage > 0.3) {
      return 0xffff00; // Yellow for medium health (30-60%)
    } else {
      return 0xff0000; // Red for low health (<30%)
    }
  }

  public setMaxHealth(maxHealth: number): void {
    this.maxHealth = maxHealth;
    this.recreateHealthBar();
  }

  public setCurrentHealth(currentHealth: number): void {
    this.currentHealth = Math.max(0, Math.min(currentHealth, this.maxHealth));
    this.update();
  }

  public getCurrentHealth(): number {
    return this.currentHealth;
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }

  private recreateHealthBar(): void {
    // Clean up existing elements
    this.destroy();
    
    // Recreate with new max health
    this.createHealthBar();
  }

  public setVisible(visible: boolean): void {
    this.healthSegments.forEach(segment => {
      if (segment && segment.active) {
        segment.setVisible(visible);
      }
    });
    
    if (this.healthText && this.healthText.active) {
      this.healthText.setVisible(visible);
    }
  }

  public destroy(): void {
    // Destroy health segments
    this.healthSegments.forEach(segment => {
      if (segment && segment.active) {
        segment.destroy();
      }
    });
    this.healthSegments = [];
    
    // Destroy health text
    if (this.healthText && this.healthText.active) {
      this.healthText.destroy();
      this.healthText = null;
    }
  }

  public isActive(): boolean {
    return this.healthSegments.length > 0 && 
           this.healthSegments.some(segment => segment && segment.active);
  }
} 