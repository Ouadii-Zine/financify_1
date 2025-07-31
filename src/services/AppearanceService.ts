export interface AppAppearance {
  mainTitle: string;
  subtitle: string;
  logo?: string; // Base64 encoded logo image
}

const defaultAppearance: AppAppearance = {
  mainTitle: 'Financify',
  subtitle: 'Portfolio Lens'
};

class AppearanceService {
  private static instance: AppearanceService;
  private currentAppearance: AppAppearance;

  private constructor() {
    this.currentAppearance = this.loadAppearance();
  }

  static getInstance(): AppearanceService {
    if (!AppearanceService.instance) {
      AppearanceService.instance = new AppearanceService();
    }
    return AppearanceService.instance;
  }

  // Load appearance settings from localStorage
  private loadAppearance(): AppAppearance {
    try {
      const savedAppearance = localStorage.getItem('app-appearance');
      if (savedAppearance) {
        const parsed = JSON.parse(savedAppearance);
        // Validate the structure
        if (parsed && typeof parsed.mainTitle === 'string' && typeof parsed.subtitle === 'string') {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading appearance settings:', error);
    }
    return defaultAppearance;
  }

  // Get current appearance settings
  getAppearance(): AppAppearance {
    return { ...this.currentAppearance };
  }

  // Save appearance settings
  saveAppearance(appearance: AppAppearance): boolean {
    try {
      // Validate input
      if (!appearance.mainTitle || !appearance.mainTitle.trim()) {
        throw new Error('Main title is required');
      }

      // Update current appearance
      this.currentAppearance = {
        mainTitle: appearance.mainTitle.trim(),
        subtitle: appearance.subtitle.trim(),
        logo: appearance.logo
      };



      // Save to localStorage
      localStorage.setItem('app-appearance', JSON.stringify(this.currentAppearance));

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('appearance-updated', { 
        detail: this.currentAppearance 
      }));

      return true;
    } catch (error) {
      console.error('Error saving appearance settings:', error);
      return false;
    }
  }

  // Reset to default appearance
  resetToDefault(): AppAppearance {
    this.currentAppearance = { ...defaultAppearance };
    localStorage.removeItem('app-appearance');
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('appearance-updated', { 
      detail: this.currentAppearance 
    }));

    return this.currentAppearance;
  }

  // Get the full app name as a string
  getFullAppName(): string {
    if (this.currentAppearance.subtitle) {
      return `${this.currentAppearance.mainTitle} - ${this.currentAppearance.subtitle}`;
    }
    return this.currentAppearance.mainTitle;
  }

  // Get just the main title
  getMainTitle(): string {
    return this.currentAppearance.mainTitle;
  }

  // Get just the subtitle
  getSubtitle(): string {
    return this.currentAppearance.subtitle;
  }

  // Get the logo
  getLogo(): string | null {
    return this.currentAppearance.logo || null;
  }

  // Set the logo
  setLogo(logo: string | null): void {
    this.currentAppearance.logo = logo || undefined;
  }

  // Check if current appearance is the default
  isDefault(): boolean {
    return (
      this.currentAppearance.mainTitle === defaultAppearance.mainTitle &&
      this.currentAppearance.subtitle === defaultAppearance.subtitle
    );
  }

  // Get default appearance (read-only)
  getDefaultAppearance(): AppAppearance {
    return { ...defaultAppearance };
  }
}

export default AppearanceService; 