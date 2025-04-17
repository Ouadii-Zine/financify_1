
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { defaultCalculationParameters } from '@/data/sampleData';
import { PlusCircle, Save, Trash2 } from 'lucide-react';

// Extend the default parameters type to include priceFactor and spread
interface CalculationParameters {
  targetROE: number;
  corporateTaxRate: number;
  capitalRatio: number;
  fundingCost: number;
  operationalCostRatio: number;
  pdCurve: { rating: string; pd: number; }[];
  lgdAssumptions: { sector: string; lgd: number; }[];
  stressScenarios: {
    name: string;
    pdMultiplier: number;
    lgdMultiplier: number;
    rateShift: number;
    spreadShift: number;
  }[];
  priceFactor: number;
  spread: number;
}

const Parameters = () => {
  // Initialize with default parameters and add the missing properties
  const [parameters, setParameters] = useState<CalculationParameters>({
    ...defaultCalculationParameters,
    priceFactor: 1.5,
    spread: 0.2
  });
  
  const handleSaveParameters = () => {
    toast({
      title: "Paramètres enregistrés",
      description: "Les paramètres ont été mis à jour avec succès.",
      variant: "default"
    });
  };
  
  const handleResetToDefault = () => {
    setParameters({
      ...defaultCalculationParameters,
      priceFactor: 1.5,
      spread: 0.2
    });
    toast({
      title: "Paramètres réinitialisés",
      description: "Les paramètres ont été restaurés aux valeurs par défaut.",
      variant: "default"
    });
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Paramètres de Calcul</h1>
      
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Généraux</TabsTrigger>
          <TabsTrigger value="risk">Risque</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="stress">Scénarios de Stress</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Généraux</CardTitle>
              <CardDescription>
                Ces paramètres sont utilisés dans tous les calculs financiers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="targetROE">ROE Cible (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Slider 
                      id="targetROE"
                      min={5} 
                      max={20} 
                      step={0.1} 
                      value={[parameters.targetROE * 100]} 
                      onValueChange={(values) => setParameters({
                        ...parameters, 
                        targetROE: values[0] / 100
                      })} 
                      className="flex-1"
                    />
                    <span className="w-12 text-center font-mono">
                      {(parameters.targetROE * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Rentabilité minimale exigée par les actionnaires
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="corporateTaxRate">Taux d'Imposition (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Slider 
                      id="corporateTaxRate"
                      min={10} 
                      max={40} 
                      step={0.5} 
                      value={[parameters.corporateTaxRate * 100]} 
                      onValueChange={(values) => setParameters({
                        ...parameters, 
                        corporateTaxRate: values[0] / 100
                      })} 
                      className="flex-1"
                    />
                    <span className="w-12 text-center font-mono">
                      {(parameters.corporateTaxRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Taux d'imposition sur les bénéfices
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="capitalRatio">Ratio de Capital (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Slider 
                      id="capitalRatio"
                      min={8} 
                      max={20} 
                      step={0.1} 
                      value={[parameters.capitalRatio * 100]} 
                      onValueChange={(values) => setParameters({
                        ...parameters, 
                        capitalRatio: values[0] / 100
                      })} 
                      className="flex-1"
                    />
                    <span className="w-12 text-center font-mono">
                      {(parameters.capitalRatio * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ratio CET1 (Common Equity Tier 1)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="useRegParameters">Utiliser Paramètres Réglementaires</Label>
                  <div className="flex items-center space-x-2">
                    <Switch id="useRegParameters" />
                    <Label htmlFor="useRegParameters">
                      Activer
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Utiliser les paramètres standards de Bâle III
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de Risque</CardTitle>
              <CardDescription>
                Paramètres utilisés dans les calculs de risque et d'expected loss.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fundingCost">Coût de Funding (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Slider 
                      id="fundingCost"
                      min={0} 
                      max={10} 
                      step={0.05} 
                      value={[parameters.fundingCost * 100]} 
                      onValueChange={(values) => setParameters({
                        ...parameters, 
                        fundingCost: values[0] / 100
                      })} 
                      className="flex-1"
                    />
                    <span className="w-12 text-center font-mono">
                      {(parameters.fundingCost * 100).toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Coût moyen de refinancement
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="operationalCostRatio">Coûts Opérationnels (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Slider 
                      id="operationalCostRatio"
                      min={0} 
                      max={5} 
                      step={0.05} 
                      value={[parameters.operationalCostRatio * 100]} 
                      onValueChange={(values) => setParameters({
                        ...parameters, 
                        operationalCostRatio: values[0] / 100
                      })} 
                      className="flex-1"
                    />
                    <span className="w-12 text-center font-mono">
                      {(parameters.operationalCostRatio * 100).toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ratio de coûts opérationnels en % du montant du prêt
                  </p>
                </div>
              </div>
              
              <h3 className="text-lg font-medium mt-4">PD par Notation</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Notation</TableHead>
                    <TableHead className="text-right">PD</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parameters.pdCurve.map((rating, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input 
                          value={rating.rating} 
                          onChange={(e) => {
                            const newPdCurve = [...parameters.pdCurve];
                            newPdCurve[index].rating = e.target.value;
                            setParameters({...parameters, pdCurve: newPdCurve});
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Slider 
                            min={0.0001} 
                            max={0.3} 
                            step={0.0001} 
                            value={[rating.pd]} 
                            onValueChange={(values) => {
                              const newPdCurve = [...parameters.pdCurve];
                              newPdCurve[index].pd = values[0];
                              setParameters({...parameters, pdCurve: newPdCurve});
                            }} 
                            className="w-32"
                          />
                          <span className="w-16 text-right font-mono">
                            {typeof rating.pd === 'number' ? (rating.pd * 100).toFixed(2) + '%' : '0.00%'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            const newPdCurve = parameters.pdCurve.filter((_, i) => i !== index);
                            setParameters({...parameters, pdCurve: newPdCurve});
                          }}
                        >
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <Button 
                onClick={() => {
                  const newPdCurve = [...parameters.pdCurve, { rating: 'New Rating', pd: 0.01 }];
                  setParameters({...parameters, pdCurve: newPdCurve});
                }}
              >
                Ajouter une Notation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>
                Paramètres utilisés dans les calculs de pricing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="priceFactor">Facteur de Pricing</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      id="priceFactor"
                      type="number" 
                      step="0.01"
                      value={parameters.priceFactor} 
                      onChange={(e) => setParameters({
                        ...parameters, 
                        priceFactor: parseFloat(e.target.value)
                      })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {(parameters.priceFactor * 100).toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Facteur de pricing pour les produits financiers
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="spread">Spread (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      id="spread"
                      type="number" 
                      step="0.01"
                      value={parameters.spread} 
                      onChange={(e) => setParameters({
                        ...parameters, 
                        spread: parseFloat(e.target.value)
                      })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {(parameters.spread * 100).toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Spreads pour les produits financiers
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stress">
          <Card>
            <CardHeader>
              <CardTitle>Scénarios de Stress</CardTitle>
              <CardDescription>
                Configurez des scénarios prédéfinis pour les analyses de sensibilité.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom du Scénario</TableHead>
                    <TableHead>PD x</TableHead>
                    <TableHead>LGD x</TableHead>
                    <TableHead>Taux Δ</TableHead>
                    <TableHead>Spread Δ</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parameters.stressScenarios.map((scenario, index) => (
                    <TableRow key={index}>
                      <TableCell>{scenario.name}</TableCell>
                      <TableCell>{scenario.pdMultiplier.toFixed(2)}x</TableCell>
                      <TableCell>{scenario.lgdMultiplier.toFixed(2)}x</TableCell>
                      <TableCell>{scenario.rateShift > 0 ? '+' : ''}{(scenario.rateShift * 100).toFixed(0)} bp</TableCell>
                      <TableCell>{scenario.spreadShift > 0 ? '+' : ''}{(scenario.spreadShift * 100).toFixed(0)} bp</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="flex justify-between mt-4">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Ajouter un Scénario</span>
                </Button>
                
                <Button 
                  className="flex items-center gap-2"
                  onClick={handleSaveParameters}
                >
                  <Save className="h-4 w-4" />
                  <span>Sauvegarder</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={handleResetToDefault}>
          Restaurer les Valeurs par Défaut
        </Button>
        <Button onClick={handleSaveParameters}>
          Enregistrer les Paramètres
        </Button>
      </div>
    </div>
  );
};

export default Parameters;
