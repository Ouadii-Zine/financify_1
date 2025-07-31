import { useEffect } from 'react';
import AppearanceService from '@/services/AppearanceService';

export const useAppTitle = () => {
  useEffect(() => {
    const updateTitle = () => {
      const service = AppearanceService.getInstance();
      const fullName = service.getFullAppName();
      document.title = fullName;
    };

    // Set initial title
    updateTitle();

    // Listen for appearance updates
    const handleAppearanceUpdate = () => {
      updateTitle();
    };

    window.addEventListener('appearance-updated', handleAppearanceUpdate);
    return () => window.removeEventListener('appearance-updated', handleAppearanceUpdate);
  }, []);
}; 