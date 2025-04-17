
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Slider 
} from '@/components/ui/slider';
import { LineChart, ResponsiveContainer, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Save, PlusCircle, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { defaultCalculationParameters } from '@/data/sampleData';
import { CalculationParameters } from '@/types/finance';

const Parameters = () => {
  const [params, setParams] = useState<CalculationParameters>({
    ...defaultCalculationParameters
  });
  
  const handleParameterChange = (key: keyof CalculationParameters, value: number) => {
    if (key in params) {
      setParams({ ...params, [key]: value });
    }
  };
  
  const handleSaveParameters = () => {
    // Dans une application réelle, on sauvegarderait les paramètres
    toast({
      title: "Paramètres sauvegardés",
      description: "Les nouveaux paramètres ont été enregistrés avec succès.",
      variant: "success"
    });
  };
  
  const handleAddPdMapping = () => {
    const newPdMappings = [...params.pdCurve, { rating: "", pd: 0 }];
    setParams({ ...params, pdCurve: newPdMappings });
  };
  
  const handleRemovePdMapping = (index: number) => {
    const newPdMappings = [...params.pdCurve];
    newPdMappings.splice(index, 1);
    setParams({ ...params, pdCurve: newPdMappings });
  };
  
  const handlePdMappingChange = (index: number, field: 'rating' | 'pd', value: string | number) => {
    const newPdMappings = [...params.pdCurve];
    if (field === 'pd') {
      newPdMappings[index].pd = Number(value);
    } else {
      newPdMappings[index].rating = value as string;
    }
    setParams({ ...params, pdCurve: newPdMappings });
  };
  
  const handleAddLgdMapping = () => {
    const newLgdMappings = [...params.lgdAssumptions, { sector: "", lgd: 0 }];
    setParams({ ...params, lgdAssumptions: newLgdMappings });
  };
  
  const handleRemoveLgdMapping = (index: number) => {
    const newLgdMappings = [...params.lgdAssumptions];
    newLgdMappings.splice(index, 1);
    setParams({ ...params, lgdAssumptions: newLgdMappings });
  };
  
  const handleLgdMappingChange = (index: number, field: 'sector' | 'lgd', value: string | number) => {
    const newLgdMappings = [...params.lgdAssumptions];
    if (field === 'lgd') {
      newLgdMappings[index].lgd = Number(value);
    } else {
      newLgdMappings[index].sector = value as string;
    }
    setParams({ ...params, lgdAssumptions: newLgdMappings });
  };
  
  // Données pour la courbe de PD
  const pdCurveData = params.pdCurve.map(item => ({
    rating: item.rating,
    pd: item.pd * 100
  }));
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Paramètres de Calcul</h1>
      
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Paramètres Généraux</TabsTrigger>
          <TabsTrigger value="pd-curve">Courbe PD</TabsTrigger>
          <TabsTrigger value="lgd-assumptions">Hypothèses LGD</TabsTrigger>
          <TabsTrigger value="scenarios">Scénarios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Généraux</CardTitle>
              <CardDescription>
                Configurez les paramètres globaux pour les calculs financiers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="target-roe">ROE Cible</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="target-roe"
                        type="number" 
                        step="0.01"
                        value={params.targetROE} 
                        onChange={(e) => handleParameterChange('targetROE', parseFloat(e.target.value))}
                      />
                      <span className="text-sm text-muted-foreground">
                        {(params.targetROE * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="corporate-tax-rate">Taux d'Impôt sur les Sociétés</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="corporate-tax-rate"
                        type="number" 
                        step="0.01"
                        value={params.corporateTaxRate} 
                        onChange={(e) => handleParameterChange('corporateTaxRate', parseFloat(e.target.value))}
                      />
                      <span className="text-sm text-muted-foreground">
                        {(params.corporateTaxRate * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="capital-ratio">Ratio de Capital (CET1)</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="capital-ratio"
                        type="number" 
                        step="0.01"
                        value={params.capitalRatio} 
                        onChange={(e) => handleParameterChange('capitalRatio', parseFloat(e.target.value))}
                      />
                      <span className="text-sm text-muted-foreground">
                        {(params.capitalRatio * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="funding-cost">Coût de Funding</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="funding-cost"
                        type="number" 
                        step="0.001"
                        value={params.fundingCost} 
                        onChange={(e) => handleParameterChange('fundingCost', parseFloat(e.target.value))}
                      />
                      <span className="text-sm text-muted-foreground">
                        {(params.fundingCost * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="operational-cost-ratio">Ratio des Coûts Opérationnels</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="operational-cost-ratio"
                        type="number" 
                        step="0.001"
                        value={params.operationalCostRatio} 
                        onChange={(e) => handleParameterChange('operationalCostRatio', parseFloat(e.target.value))}
                      />
                      <span className="text-sm text-muted-foreground">
                        {(params.operationalCostRatio * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-8">
                    <Button 
                      className="flex items-center gap-2"
                      onClick={handleSaveParameters}
                    >
                      <Save className="h-4 w-4" />
                      <span>Sauvegarder</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pd-curve">
          <Card>
            <CardHeader>
              <CardTitle>Courbe de PD par Rating</CardTitle>
              <CardDescription>
                Définissez les probabilités de défaut pour chaque note de crédit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rating</TableHead>
                        <TableHead>PD</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {params.pdCurve.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input 
                              value={item.rating} 
                              onChange={(e) => handlePdMappingChange(index, 'rating', e.target.value)} 
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Slider 
                                min={0} 
                                max={0.5} 
                                step={0.001} 
                                value={[item.pd]} 
                                onValueChange={(values) => handlePdMappingChange(index, 'pd', values[0])} 
                              />
                              <span className="text-sm w-16 text-right">
                                {(item.pd * 100).toFixed(2)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleRemovePdMapping(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <Button 
                    variant="outline" 
                    className="mt-4 flex items-center gap-2"
                    onClick={handleAddPdMapping}
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Ajouter un Rating</span>
                  </Button>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pdCurveData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" />
                      <YAxis unit="%" />
                      <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="pd" 
                        stroke="#FF3B5B" 
                        name="PD (%)" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
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
        
        <TabsContent value="lgd-assumptions">
          <Card>
            <CardHeader>
              <CardTitle>Hypothèses LGD par Secteur</CardTitle>
              <CardDescription>
                Définissez les LGD (Loss Given Default) par secteur économique.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Secteur</TableHead>
                    <TableHead>LGD</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {params.lgdAssumptions.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input 
                          value={item.sector} 
                          onChange={(e) => handleLgdMappingChange(index, 'sector', e.target.value)} 
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Slider 
                            min={0} 
                            max={1} 
                            step={0.01} 
                            value={[item.lgd]} 
                            onValueChange={(values) => handleLgdMappingChange(index, 'lgd', values[0])} 
                          />
                          <span className="text-sm w-16 text-right">
                            {(item.lgd * 100).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveLgdMapping(index)}
                        >
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
                  onClick={handleAddLgdMapping}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Ajouter un Secteur</span>
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
        
        <TabsContent value="scenarios">
          <Card>
            <CardHeader>
              <CardTitle>Scénarios de Stress Test</CardTitle>
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
                  {params.stressScenarios.map((scenario, index) => (
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
    </div>
  );
};

export default Parameters;
