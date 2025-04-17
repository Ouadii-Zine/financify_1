
import React from 'react';
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
import { Separator } from '@/components/ui/separator';
import { defaultCalculationParameters } from '@/data/sampleData';

const Documentation = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Documentation Technique</h1>
      
      <Tabs defaultValue="formulas">
        <TabsList>
          <TabsTrigger value="formulas">Formules Financières</TabsTrigger>
          <TabsTrigger value="models">Modèles de Risque</TabsTrigger>
          <TabsTrigger value="parameters">Paramètres</TabsTrigger>
          <TabsTrigger value="glossary">Glossaire</TabsTrigger>
        </TabsList>
        
        <TabsContent value="formulas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expected Loss (EL)</CardTitle>
              <CardDescription>
                La perte attendue est le montant qu'une banque s'attend à perdre en moyenne sur un prêt donné.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md mb-4">
                <p className="font-mono text-lg">EL = PD × LGD × EAD</p>
              </div>
              
              <div className="space-y-2">
                <p><strong>PD (Probability of Default)</strong> : Probabilité que l'emprunteur fasse défaut au cours d'une période donnée (généralement un an).</p>
                <p><strong>LGD (Loss Given Default)</strong> : Pourcentage du montant exposé qui ne sera pas récupéré en cas de défaut.</p>
                <p><strong>EAD (Exposure at Default)</strong> : Montant total auquel la banque est exposée au moment du défaut.</p>
              </div>
              
              <Separator className="my-4" />
              
              <h3 className="text-lg font-semibold mb-2">Exemple de calcul</h3>
              <p className="mb-2">Pour un prêt avec :</p>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li>PD = 2% (0.02)</li>
                <li>LGD = 45% (0.45)</li>
                <li>EAD = 1,000,000 €</li>
              </ul>
              <p><strong>EL = 0.02 × 0.45 × 1,000,000 € = 9,000 €</strong></p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Risk-Weighted Assets (RWA)</CardTitle>
              <CardDescription>
                Les actifs pondérés par le risque représentent la base du calcul des exigences en capital réglementaire selon Bâle.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md mb-4">
                <p className="font-mono text-lg">RWA = K × 12.5 × EAD</p>
                <p className="font-mono mt-2">où K = (1 - R)^(-0.5) × G(PD) + (R / (1 - R))^(0.5) × G(0.999) - PD × LGD</p>
              </div>
              
              <div className="space-y-2">
                <p><strong>K</strong> : Exigence en capital selon la formule IRB de Bâle</p>
                <p><strong>R</strong> : Corrélation d'actifs, déterminée selon une formule basée sur la PD</p>
                <p><strong>G(x)</strong> : Inverse de la fonction de répartition normale standard</p>
                <p><strong>12.5</strong> : Multiplicateur (inverse du ratio de capital minimum de 8%)</p>
              </div>
              
              <h3 className="text-lg font-semibold mt-4 mb-2">Formulation simplifiée utilisée dans l'application</h3>
              <div className="bg-muted p-4 rounded-md">
                <p className="font-mono">
                  maturityAdjustment = 1 + (2.5 × (endDate - currentDate) / (365 × 24 × 60 × 60 × 1000))
                </p>
                <p className="font-mono mt-2">
                  correlationFactor = 0.12 × (1 - exp(-50 × PD)) / (1 - exp(-50)) + 0.24 × (1 - (1 - exp(-50 × PD)) / (1 - exp(-50)))
                </p>
                <p className="font-mono mt-2">
                  K = (1 - correlationFactor) × LGD × PD + correlationFactor × LGD × 1.06 × sqrt(1.5)
                </p>
                <p className="font-mono mt-2">
                  RWA = EAD × K × maturityAdjustment × 12.5 × capitalRatio
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Return on Equity (ROE)</CardTitle>
              <CardDescription>
                Le retour sur fonds propres mesure la rentabilité d'un prêt par rapport au capital économique alloué.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md mb-4">
                <p className="font-mono text-lg">ROE = Profit après impôts / Capital Requis</p>
              </div>
              
              <h3 className="font-semibold mb-2">Calcul détaillé</h3>
              <div className="space-y-2 mb-4">
                <p><strong>Capital Requis</strong> = RWA × Ratio de Capital</p>
                <p><strong>Revenu Annuel</strong> = (Marge + Taux de référence) × Montant tiré + Frais d'engagement × Montant non tiré + Frais divers / Durée du prêt</p>
                <p><strong>Coût de Financement</strong> = Coût de Funding × Montant tiré</p>
                <p><strong>Coût Opérationnel</strong> = Ratio de Coût Opérationnel × Montant original</p>
                <p><strong>Profit avant impôts</strong> = Revenu Annuel - Coût de Financement - Coût Opérationnel - Expected Loss</p>
                <p><strong>Profit après impôts</strong> = Profit avant impôts × (1 - Taux d'imposition)</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Economic Value Added (EVA)</CardTitle>
              <CardDescription>
                La valeur économique ajoutée mesure la création de valeur économique au-delà du coût du capital.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md mb-4">
                <p className="font-mono text-lg">EVA = (ROE - ROE Cible) × Capital Requis</p>
              </div>
              
              <div className="space-y-2">
                <p><strong>ROE Cible</strong> : Le retour sur capital minimum exigé par les actionnaires ({(defaultCalculationParameters.targetROE * 100).toFixed(2)}% dans les paramètres par défaut)</p>
                <p><strong>Capital Requis</strong> : Le capital économique alloué au prêt</p>
              </div>
              
              <h3 className="text-lg font-semibold mt-4 mb-2">Types d'EVA calculés</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>EVA Intrinsèque</strong> : Basée sur le ROE du prêt et le capital alloué</li>
                <li><strong>EVA de Cession</strong> : Inclut l'impact d'une potentielle cession du prêt sur le marché secondaire</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Risk-Adjusted Return on Capital (RAROC)</CardTitle>
              <CardDescription>
                Le RAROC est une mesure de rentabilité ajustée au risque utilisée pour comparer des activités avec différents profils de risque.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md mb-4">
                <p className="font-mono text-lg">RAROC = Profit Ajusté au Risque / Capital Économique</p>
              </div>
              
              <div className="space-y-2">
                <p><strong>Profit Ajusté au Risque</strong> : Revenu Annuel - Coût de Financement - Coût Opérationnel - Expected Loss</p>
                <p><strong>Capital Économique</strong> : Capital requis pour couvrir les pertes inattendues à un niveau de confiance donné</p>
              </div>
              
              <h3 className="text-lg font-semibold mt-4 mb-2">Interprétation</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>RAROC {">"} ROE Cible : Le prêt crée de la valeur économique</li>
                <li>RAROC = ROE Cible : Le prêt couvre exactement le coût du capital</li>
                <li>RAROC {"<"} ROE Cible : Le prêt détruit de la valeur économique</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Modèles de Probabilité de Défaut (PD)</CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold mb-2">Modèle de Notation Interne</h3>
              <p className="mb-4">
                L'application utilise un système de notation interne qui associe chaque notation à une probabilité de défaut calibrée.
              </p>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Notation Interne</TableHead>
                    <TableHead>Notation Externe Équivalente</TableHead>
                    <TableHead className="text-right">PD à 1 an</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>AAA</TableCell>
                    <TableCell>Aaa/AAA</TableCell>
                    <TableCell className="text-right">0.01%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>AA</TableCell>
                    <TableCell>Aa/AA</TableCell>
                    <TableCell className="text-right">0.05%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>A</TableCell>
                    <TableCell>A/A</TableCell>
                    <TableCell className="text-right">0.10%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>BBB</TableCell>
                    <TableCell>Baa/BBB</TableCell>
                    <TableCell className="text-right">0.30%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>BB</TableCell>
                    <TableCell>Ba/BB</TableCell>
                    <TableCell className="text-right">1.00%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>B</TableCell>
                    <TableCell>B/B</TableCell>
                    <TableCell className="text-right">3.00%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>CCC</TableCell>
                    <TableCell>Caa/CCC</TableCell>
                    <TableCell className="text-right">10.00%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              <h3 className="font-semibold mt-6 mb-2">Modèle de Migration de Crédit</h3>
              <p className="mb-2">
                L'application modélise également les migrations de crédit selon une matrice de transition qui estime 
                la probabilité qu'un emprunteur passe d'une notation à une autre sur une période donnée.
              </p>
              <p className="text-sm text-muted-foreground">
                Les matrices de transition sont calculées à partir de données historiques et peuvent être 
                ajustées en fonction des conditions macroéconomiques.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Modèles de LGD (Loss Given Default)</CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold mb-2">Modèle LGD par Secteur</h3>
              <p className="mb-4">
                Les valeurs de LGD sont estimées par secteur d'activité en fonction des taux de recouvrement historiques.
              </p>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Secteur</TableHead>
                    <TableHead className="text-right">LGD Moyen</TableHead>
                    <TableHead>Facteurs d'Influence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Banque et Finance</TableCell>
                    <TableCell className="text-right">45%</TableCell>
                    <TableCell>Régulation, liquidité du marché</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Industrie</TableCell>
                    <TableCell className="text-right">50%</TableCell>
                    <TableCell>Valeur des actifs corporels, cyclicité</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Immobilier Commercial</TableCell>
                    <TableCell className="text-right">35%</TableCell>
                    <TableCell>Valeur collatérale, localisation</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Technologie</TableCell>
                    <TableCell className="text-right">65%</TableCell>
                    <TableCell>Faible valeur d'actifs tangibles, obsolescence</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Services Publics</TableCell>
                    <TableCell className="text-right">30%</TableCell>
                    <TableCell>Stabilité des cash flows, support gouvernemental</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              <h3 className="font-semibold mt-6 mb-2">Ajustements LGD</h3>
              <p>Les valeurs de LGD peuvent être ajustées en fonction de facteurs spécifiques :</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Présence et qualité des garanties</li>
                <li>Séniorité de la dette dans la structure de capital</li>
                <li>Juridiction et cadre légal applicable</li>
                <li>Phase du cycle économique</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Modèles de Diversification et Corrélation</CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold mb-2">Diversification du Portefeuille</h3>
              <p className="mb-4">
                L'application calcule les bénéfices de diversification en tenant compte des corrélations entre les actifs.
              </p>
              
              <div className="bg-muted p-4 rounded-md mb-4">
                <p className="font-mono">
                  DiversificationBenefit = PerfectCorrelationEL - PortfolioEL
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Où PerfectCorrelationEL est la somme des Expected Loss individuelles et PortfolioEL tient compte des corrélations.
                </p>
              </div>
              
              <h3 className="font-semibold mt-4 mb-2">Matrice de Corrélation</h3>
              <p className="mb-2">
                Les corrélations entre secteurs d'activité sont estimées à partir de données historiques de défaut.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Dans la version actuelle, une approche simplifiée est utilisée avec un bénéfice de diversification fixé à 20% de la somme des Expected Loss.
              </p>
              
              <h3 className="font-semibold mt-4 mb-2">Modèle de Corrélation d'Actifs</h3>
              <div className="bg-muted p-4 rounded-md">
                <p className="font-mono">
                  R = 0.12 × (1 - exp(-50 × PD)) / (1 - exp(-50)) + 0.24 × (1 - (1 - exp(-50 × PD)) / (1 - exp(-50)))
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Formule de corrélation d'actifs selon le modèle ASRF (Asymptotic Single Risk Factor) utilisé dans Bâle II.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="parameters">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de Calcul</CardTitle>
              <CardDescription>
                Les paramètres utilisés dans les calculs financiers et leur signification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paramètre</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>ROE Cible</TableCell>
                    <TableCell>{(defaultCalculationParameters.targetROE * 100).toFixed(2)}%</TableCell>
                    <TableCell>Rentabilité minimum exigée par les actionnaires</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Taux d'imposition</TableCell>
                    <TableCell>{(defaultCalculationParameters.corporateTaxRate * 100).toFixed(2)}%</TableCell>
                    <TableCell>Taux d'imposition sur les bénéfices</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Ratio de Capital</TableCell>
                    <TableCell>{(defaultCalculationParameters.capitalRatio * 100).toFixed(2)}%</TableCell>
                    <TableCell>Ratio Common Equity Tier 1 (CET1) cible</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Coût de Funding</TableCell>
                    <TableCell>{(defaultCalculationParameters.fundingCost * 100).toFixed(2)}%</TableCell>
                    <TableCell>Coût de refinancement moyen</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Ratio de Coûts Opérationnels</TableCell>
                    <TableCell>{(defaultCalculationParameters.operationalCostRatio * 100).toFixed(2)}%</TableCell>
                    <TableCell>Coûts opérationnels exprimés en % du montant du prêt</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              <h3 className="font-semibold mt-6 mb-2">Scénarios de Stress</h3>
              <p className="mb-4">
                Les scénarios de stress permettent d'évaluer la résistance du portefeuille face à différentes conditions économiques.
              </p>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scénario</TableHead>
                    <TableHead>Mult. PD</TableHead>
                    <TableHead>Mult. LGD</TableHead>
                    <TableHead>Variation Taux</TableHead>
                    <TableHead>Variation Spread</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Crise Légère</TableCell>
                    <TableCell>1.5x</TableCell>
                    <TableCell>1.2x</TableCell>
                    <TableCell>+50bp</TableCell>
                    <TableCell>+100bp</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Crise Modérée</TableCell>
                    <TableCell>2.5x</TableCell>
                    <TableCell>1.5x</TableCell>
                    <TableCell>+100bp</TableCell>
                    <TableCell>+200bp</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Crise Sévère</TableCell>
                    <TableCell>4.0x</TableCell>
                    <TableCell>1.8x</TableCell>
                    <TableCell>+200bp</TableCell>
                    <TableCell>+300bp</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="glossary">
          <Card>
            <CardHeader>
              <CardTitle>Glossaire des Termes Financiers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h3 className="font-semibold">PD (Probability of Default)</h3>
                  <p className="text-sm">Probabilité qu'un emprunteur ne puisse pas rembourser sa dette sur une période donnée, généralement un an.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">LGD (Loss Given Default)</h3>
                  <p className="text-sm">Pourcentage du montant exposé qui ne sera pas récupéré en cas de défaut de l'emprunteur.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">EAD (Exposure at Default)</h3>
                  <p className="text-sm">Montant auquel la banque est exposée au moment du défaut, incluant les montants tirés et une partie des engagements non tirés.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">EL (Expected Loss)</h3>
                  <p className="text-sm">Perte moyenne anticipée sur un prêt ou un portefeuille sur une période donnée. Calculée comme EL = PD × LGD × EAD.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">UL (Unexpected Loss)</h3>
                  <p className="text-sm">Volatilité des pertes autour de la perte attendue. Le capital économique est dimensionné pour couvrir ces pertes inattendues.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">RWA (Risk-Weighted Assets)</h3>
                  <p className="text-sm">Actifs pondérés par le risque, utilisés pour calculer les exigences en capital réglementaire selon les accords de Bâle.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">ROE (Return on Equity)</h3>
                  <p className="text-sm">Rentabilité des fonds propres. Mesure le rendement net généré par le capital investi.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">RAROC (Risk-Adjusted Return on Capital)</h3>
                  <p className="text-sm">Ratio de rentabilité ajusté au risque, permettant de comparer des activités avec différents profils de risque.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">EVA (Economic Value Added)</h3>
                  <p className="text-sm">Mesure de la création de valeur économique au-delà du coût du capital. EVA = (ROE - ROE Cible) × Capital Requis.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">Term Loan</h3>
                  <p className="text-sm">Prêt à terme avec un calendrier d'amortissement prédéfini.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">Revolver</h3>
                  <p className="text-sm">Ligne de crédit renouvelable où l'emprunteur peut tirer, rembourser et retirer des fonds à sa discrétion jusqu'à une limite définie.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">Bullet Loan</h3>
                  <p className="text-sm">Prêt dont le principal est remboursé en totalité à l'échéance (pas d'amortissement intermédiaire).</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">Funding Cost</h3>
                  <p className="text-sm">Coût de refinancement pour la banque, utilisé comme base pour déterminer le prix des prêts.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">Upfront Fee</h3>
                  <p className="text-sm">Commission initiale payée à la mise en place du prêt.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">Commitment Fee</h3>
                  <p className="text-sm">Commission payée sur la partie non tirée d'une ligne de crédit.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">Margin</h3>
                  <p className="text-sm">Spread ajouté au taux de référence pour déterminer le taux d'intérêt total du prêt.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Documentation;
