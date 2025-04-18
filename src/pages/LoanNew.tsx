
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { LoanType, LoanStatus, Currency } from '@/types/finance';

const LoanNew = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    type: 'term' as LoanType,
    status: 'active' as LoanStatus,
    startDate: '',
    endDate: '',
    currency: 'EUR' as Currency,
    originalAmount: '',
    pd: '',
    lgd: '',
    sector: '',
    country: '',
    internalRating: '',
    margin: '',
    referenceRate: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérification des champs obligatoires
    if (!formData.name || !formData.clientName || !formData.originalAmount) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }
    
    // Simulation de l'ajout du prêt
    toast({
      title: "Prêt créé",
      description: `Le prêt "${formData.name}" a été créé avec succès.`,
      variant: "default"
    });
    
    // Dans une application réelle, on enverrait les données au serveur
    console.log("Nouveau prêt:", formData);
    
    // Redirection vers la liste des prêts
    navigate('/loans');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nouveau Prêt</h1>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations Générales</CardTitle>
            <CardDescription>
              Informations de base concernant le prêt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du Prêt *</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  placeholder="Prêt Entreprise A" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clientName">Nom du Client *</Label>
                <Input 
                  id="clientName" 
                  name="clientName" 
                  value={formData.clientName} 
                  onChange={handleInputChange} 
                  placeholder="Entreprise A" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Type de Prêt</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="term">Terme</SelectItem>
                    <SelectItem value="revolver">Revolving</SelectItem>
                    <SelectItem value="bullet">Bullet</SelectItem>
                    <SelectItem value="amortizing">Amortissement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="closed">Fermé</SelectItem>
                    <SelectItem value="default">Défaut</SelectItem>
                    <SelectItem value="restructured">Restructuré</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de Début</Label>
                <Input 
                  id="startDate" 
                  name="startDate" 
                  type="date" 
                  value={formData.startDate} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de Fin</Label>
                <Input 
                  id="endDate" 
                  name="endDate" 
                  type="date" 
                  value={formData.endDate} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => handleSelectChange('currency', value)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Sélectionnez une devise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CHF">CHF</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="originalAmount">Montant Original *</Label>
                <Input 
                  id="originalAmount" 
                  name="originalAmount" 
                  type="number" 
                  value={formData.originalAmount} 
                  onChange={handleInputChange} 
                  placeholder="1000000" 
                  required 
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Risque et Rentabilité</CardTitle>
            <CardDescription>
              Informations concernant le risque et la rentabilité du prêt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pd">Probabilité de Défaut (%)</Label>
                <Input 
                  id="pd" 
                  name="pd" 
                  type="number" 
                  step="0.01" 
                  value={formData.pd} 
                  onChange={handleInputChange} 
                  placeholder="1.0" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lgd">Loss Given Default (%)</Label>
                <Input 
                  id="lgd" 
                  name="lgd" 
                  type="number" 
                  step="0.1" 
                  value={formData.lgd} 
                  onChange={handleInputChange} 
                  placeholder="45.0" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="internalRating">Notation Interne</Label>
                <Input 
                  id="internalRating" 
                  name="internalRating" 
                  value={formData.internalRating} 
                  onChange={handleInputChange} 
                  placeholder="BB+" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="margin">Marge (%)</Label>
                <Input 
                  id="margin" 
                  name="margin" 
                  type="number" 
                  step="0.01" 
                  value={formData.margin} 
                  onChange={handleInputChange} 
                  placeholder="2.0" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="referenceRate">Taux de Référence (%)</Label>
                <Input 
                  id="referenceRate" 
                  name="referenceRate" 
                  type="number" 
                  step="0.01" 
                  value={formData.referenceRate} 
                  onChange={handleInputChange} 
                  placeholder="3.0" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Classification</CardTitle>
            <CardDescription>
              Informations de classification du prêt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sector">Secteur</Label>
                <Input 
                  id="sector" 
                  name="sector" 
                  value={formData.sector} 
                  onChange={handleInputChange} 
                  placeholder="Technologie" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Input 
                  id="country" 
                  name="country" 
                  value={formData.country} 
                  onChange={handleInputChange} 
                  placeholder="France" 
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => navigate('/loans')}>
              Annuler
            </Button>
            <Button type="submit">Créer le Prêt</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default LoanNew;
