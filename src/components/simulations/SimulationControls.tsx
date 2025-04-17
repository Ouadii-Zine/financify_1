
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface SimulationControlsProps {
  scenarioName: string;
  pdMultiplier: number;
  lgdMultiplier: number;
  rateShift: number;
  spreadShift: number;
  onScenarioNameChange: (value: string) => void;
  onPdMultiplierChange: (value: number) => void;
  onLgdMultiplierChange: (value: number) => void;
  onRateShiftChange: (value: number) => void;
  onSpreadShiftChange: (value: number) => void;
  onReset: () => void;
}

const SimulationControls = ({
  scenarioName,
  pdMultiplier,
  lgdMultiplier,
  rateShift,
  spreadShift,
  onScenarioNameChange,
  onPdMultiplierChange,
  onLgdMultiplierChange,
  onRateShiftChange,
  onSpreadShiftChange,
  onReset,
}: SimulationControlsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="scenario-name">Nom du Scénario</Label>
          <Input 
            id="scenario-name" 
            value={scenarioName} 
            onChange={(e) => onScenarioNameChange(e.target.value)} 
            placeholder="Nom du scénario"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="pd-multiplier">Multiplicateur PD: {pdMultiplier.toFixed(2)}x</Label>
            <span className="text-sm text-muted-foreground">
              {((pdMultiplier - 1) * 100).toFixed(0)}%
            </span>
          </div>
          <Slider 
            id="pd-multiplier"
            min={0.5} 
            max={2} 
            step={0.01} 
            value={[pdMultiplier]} 
            onValueChange={(values) => onPdMultiplierChange(values[0])} 
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="lgd-multiplier">Multiplicateur LGD: {lgdMultiplier.toFixed(2)}x</Label>
            <span className="text-sm text-muted-foreground">
              {((lgdMultiplier - 1) * 100).toFixed(0)}%
            </span>
          </div>
          <Slider 
            id="lgd-multiplier"
            min={0.5} 
            max={2} 
            step={0.01} 
            value={[lgdMultiplier]} 
            onValueChange={(values) => onLgdMultiplierChange(values[0])} 
          />
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="rate-shift">Variation Taux: {rateShift} bp</Label>
            <span className="text-sm text-muted-foreground">
              {(rateShift / 100).toFixed(2)}%
            </span>
          </div>
          <Slider 
            id="rate-shift"
            min={-200} 
            max={200} 
            step={1} 
            value={[rateShift]} 
            onValueChange={(values) => onRateShiftChange(values[0])} 
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="spread-shift">Variation Marges: {spreadShift} bp</Label>
            <span className="text-sm text-muted-foreground">
              {(spreadShift / 100).toFixed(2)}%
            </span>
          </div>
          <Slider 
            id="spread-shift"
            min={-200} 
            max={200} 
            step={1} 
            value={[spreadShift]} 
            onValueChange={(values) => onSpreadShiftChange(values[0])} 
          />
        </div>
        
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={onReset}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Réinitialiser</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimulationControls;
