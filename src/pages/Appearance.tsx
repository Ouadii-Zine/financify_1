import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Settings, Palette, Save, RotateCcw, Upload, X, Image } from 'lucide-react';
import AppearanceService, { AppAppearance } from '@/services/AppearanceService';

const Appearance = () => {
  const { toast } = useToast();
  const [appearance, setAppearance] = useState<AppAppearance>(AppearanceService.getInstance().getAppearance());
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(AppearanceService.getInstance().getLogo());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load appearance settings on component mount
  useEffect(() => {
    const service = AppearanceService.getInstance();
    const appearance = service.getAppearance();
    setAppearance(appearance);
    setLogoPreview(appearance.logo || null);
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    
    const service = AppearanceService.getInstance();
    // Include the current logo in the appearance object
    const appearanceWithLogo = {
      ...appearance,
      logo: logoPreview
    };
    const success = service.saveAppearance(appearanceWithLogo);
    
    if (success) {
      toast({
        title: "Appearance Updated",
        description: "Your app appearance settings have been saved successfully.",
        variant: "default"
      });
    } else {
      toast({
        title: "Save Failed",
        description: "Failed to save appearance settings. Please try again.",
        variant: "destructive"
      });
    }
    
    setIsSaving(false);
  };

  const handleReset = () => {
    const service = AppearanceService.getInstance();
    const defaultAppearance = service.resetToDefault();
    setAppearance(defaultAppearance);
    setLogoPreview(null);
    
    toast({
      title: "Appearance Reset",
      description: "Appearance settings have been reset to default values.",
      variant: "default"
    });
  };

  const handleInputChange = (field: keyof AppAppearance, value: string) => {
    setAppearance(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (PNG, JPG, SVG, etc.).",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 2MB.",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        // Don't save to service immediately, wait for user to click Save
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    // Don't save to service immediately, wait for user to click Save
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Palette className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Appearance</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            App Name Customization
          </CardTitle>
          <CardDescription>
            Customize the name and appearance of your application. The main title will be displayed prominently, with the subtitle shown below it in smaller text.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mainTitle">Main Title *</Label>
              <Input
                id="mainTitle"
                value={appearance.mainTitle}
                onChange={(e) => handleInputChange('mainTitle', e.target.value)}
                placeholder="Enter main title"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                This will be the primary name of your application (max 50 characters)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={appearance.subtitle}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                placeholder="Enter subtitle (optional)"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Optional subtitle displayed below the main title (max 100 characters)
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="text-sm font-medium">Logo</Label>
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                onClick={handleLogoClick}
              >
                {logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="App Logo" 
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogoClick}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {logoPreview ? 'Change Logo' : 'Upload Logo'}
                </Button>
                
                {logoPreview && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRemoveLogo}
                    className="ml-2 flex items-center gap-2 text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </Button>
                )}
                
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a logo image (PNG, JPG, SVG). Max size: 2MB.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="text-sm font-medium">Preview</Label>
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="App Logo" 
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                      <Image className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-foreground">
                    {appearance.mainTitle || 'Main Title'}
                  </h2>
                </div>
                {appearance.subtitle && (
                  <p className="text-sm text-muted-foreground">
                    {appearance.subtitle}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              This is how your app name and logo will appear in the application header and other places.
            </p>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !appearance.mainTitle.trim()}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Default
            </Button>
          </div>

          {!appearance.mainTitle.trim() && (
            <p className="text-sm text-destructive">
              Main title is required. Please enter a title to save your changes.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Hidden file input for logo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleLogoUpload}
        className="hidden"
      />

    </div>
  );
};

export default Appearance; 