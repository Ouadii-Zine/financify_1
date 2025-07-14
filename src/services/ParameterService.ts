import { CalculationParameters } from '../types/finance';
import { defaultCalculationParameters } from '../data/sampleData';
import { 
  spTransitionMatrix, 
  moodysTransitionMatrix, 
  fitchTransitionMatrix 
} from '../data/transitionMatrices';

const PARAMETERS_STORAGE_KEY = 'financify-calculation-parameters';

export class ParameterService {
  /**
   * Save calculation parameters to localStorage
   */
  static saveParameters(parameters: CalculationParameters): void {
    try {
      const serialized = JSON.stringify(parameters);
      localStorage.setItem(PARAMETERS_STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Failed to save parameters:', error);
    }
  }

  /**
   * Load calculation parameters from localStorage
   */
  static loadParameters(): CalculationParameters {
    try {
      const serialized = localStorage.getItem(PARAMETERS_STORAGE_KEY);
      if (serialized) {
        const parsed = JSON.parse(serialized);
        // Ensure all required fields are present by merging with defaults
        return {
          ...defaultCalculationParameters,
          ...parsed,
          // Ensure rating mappings structure exists
          ratingPDMappings: {
            ...defaultCalculationParameters.ratingPDMappings,
            ...parsed.ratingPDMappings
          },
          // Ensure transition matrices structure exists
          transitionMatrices: {
            ...defaultCalculationParameters.transitionMatrices,
            ...parsed.transitionMatrices
          }
        };
      }
    } catch (error) {
      console.error('Failed to load parameters:', error);
    }
    
    return defaultCalculationParameters;
  }

  /**
   * Reset parameters to default values and load fixed transition matrices
   */
  static resetToDefaults(): CalculationParameters {
    localStorage.removeItem(PARAMETERS_STORAGE_KEY);
    
    // Create default parameters with fixed transition matrices
    const resetParams = {
      ...defaultCalculationParameters,
      transitionMatrices: {
        internal: [],
        sp: [...spTransitionMatrix],
        moodys: [...moodysTransitionMatrix],
        fitch: [...fitchTransitionMatrix]
      }
    };
    
    // Save the reset parameters with fixed matrices
    this.saveParameters(resetParams);
    
    return resetParams;
  }

  /**
   * Load fixed transition matrices from files
   */
  static fixTransitionMatrices(): void {
    const parameters = this.loadParameters();
    
    // Load fixed transition matrices from separate files
    parameters.transitionMatrices.internal = [];
    parameters.transitionMatrices.sp = [...spTransitionMatrix];
    parameters.transitionMatrices.moodys = [...moodysTransitionMatrix];
    parameters.transitionMatrices.fitch = [...fitchTransitionMatrix];
    
    this.saveParameters(parameters);
  }

  /**
   * Export parameters as JSON for backup/sharing
   */
  static exportParameters(parameters: CalculationParameters): string {
    return JSON.stringify(parameters, null, 2);
  }

  /**
   * Import parameters from JSON
   */
  static importParameters(jsonString: string): CalculationParameters {
    try {
      const parsed = JSON.parse(jsonString);
      // Validate and merge with defaults
      const merged = {
        ...defaultCalculationParameters,
        ...parsed,
        ratingPDMappings: {
          ...defaultCalculationParameters.ratingPDMappings,
          ...parsed.ratingPDMappings
        },
        transitionMatrices: {
          ...defaultCalculationParameters.transitionMatrices,
          ...parsed.transitionMatrices
        }
      };
      
      // Save the imported parameters
      this.saveParameters(merged);
      return merged;
    } catch (error) {
      console.error('Failed to import parameters:', error);
      throw new Error('Invalid parameter format');
    }
  }

  /**
   * Get PD value for a specific rating and type from current parameters
   */
  static getPDValue(ratingType: 'internal' | 'sp' | 'moodys' | 'fitch', rating: string): number | null {
    const parameters = this.loadParameters();
    const mappings = parameters.ratingPDMappings[ratingType];
    if (mappings) {
      const mapping = mappings.find(m => m.rating === rating);
      return mapping ? mapping.pd : null;
    }
    return null;
  }

  /**
   * Update PD value for a specific rating and type
   */
  static updatePDValue(ratingType: 'internal' | 'sp' | 'moodys' | 'fitch', rating: string, pd: number): void {
    const parameters = this.loadParameters();
    const mappings = parameters.ratingPDMappings[ratingType];
    if (mappings) {
      const mappingIndex = mappings.findIndex(m => m.rating === rating);
      if (mappingIndex !== -1) {
        mappings[mappingIndex].pd = pd;
        this.saveParameters(parameters);
      }
    }
  }

  /**
   * Get transition probability between two ratings
   */
  static getTransitionProbability(ratingType: 'internal' | 'sp' | 'moodys' | 'fitch', fromRating: string, toRating: string): number | null {
    const parameters = this.loadParameters();
    const transitions = parameters.transitionMatrices[ratingType];
    if (transitions) {
      const transition = transitions.find(t => t.from === fromRating && t.to === toRating);
      return transition ? transition.probability : null;
    }
    return null;
  }

  /**
   * Update transition probability between two ratings
   */
  static updateTransitionProbability(ratingType: 'internal' | 'sp' | 'moodys' | 'fitch', fromRating: string, toRating: string, probability: number): void {
    const parameters = this.loadParameters();
    const transitions = parameters.transitionMatrices[ratingType];
    if (transitions) {
      const transitionIndex = transitions.findIndex(t => t.from === fromRating && t.to === toRating);
      if (transitionIndex !== -1) {
        transitions[transitionIndex].probability = probability;
        this.saveParameters(parameters);
      } else {
        // Add new transition if it doesn't exist
        transitions.push({ from: fromRating, to: toRating, probability });
        this.saveParameters(parameters);
      }
    }
  }

  /**
   * Get all ratings for a specific rating type
   */
  static getRatingsForType(ratingType: 'internal' | 'sp' | 'moodys' | 'fitch'): string[] {
    const parameters = this.loadParameters();
    const mappings = parameters.ratingPDMappings[ratingType];
    return mappings ? mappings.map(m => m.rating) : [];
  }


}

export default ParameterService; 