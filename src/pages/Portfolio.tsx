
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  BarChart, 
  ResponsiveContainer, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { samplePortfolio, defaultCalculationParameters } from '@/data/sampleData';
import { calculatePortfolioMetrics, calculateLoanMetrics } from '@/utils/financialCalculations';
import { Loan } from '@/types/finance';

const Portfolio = () => {
  const [loans, setLoans] = useState<Loan[]>(samplePortfolio.loans);
  
  useEffect(() => {
    // Calculer les métriques pour chaque prêt
    const updatedLoans = loans.map(loan => {
      const metrics = calculateLoanMetrics(loan, defaultCalculationParameters);
      return { ...loan, metrics };
    });
    
    setLoans(updatedLoans);
  }, []);
  
  // Données pour le graphique EVA par prêt
  const loanEvaData = loans.map(loan => ({
    name: loan.name,
    evaIntrinsic: loan.metrics?.evaIntrinsic || 0,
    roe: (loan.metrics?.roe || 0) * 100
  }));
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Portefeuille de Prêts</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Analyse de la Valeur Économique Ajoutée (EVA)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loanEvaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => 
                    new Intl.NumberFormat('fr-FR', { 
                      style: 'currency', 
                      currency: 'EUR', 
                      maximumFractionDigits: 0 
                    }).format(value)
                  } 
                />
                <Legend />
                <Bar dataKey="evaIntrinsic" fill="#00C48C" name="EVA Intrinsèque" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Liste des Prêts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Montant Original</TableHead>
                <TableHead>Encours</TableHead>
                <TableHead>EVA Intrinsèque</TableHead>
                <TableHead>ROE</TableHead>
                <TableHead>Risque (EL)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map(loan => (
                <TableRow key={loan.id}>
                  <TableCell className="font-medium">{loan.name}</TableCell>
                  <TableCell>{loan.clientName}</TableCell>
                  <TableCell>{loan.type}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('fr-FR', { 
                      style: 'currency', 
                      currency: loan.currency, 
                      maximumFractionDigits: 0 
                    }).format(loan.originalAmount)}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('fr-FR', { 
                      style: 'currency', 
                      currency: loan.currency, 
                      maximumFractionDigits: 0 
                    }).format(loan.outstandingAmount)}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('fr-FR', { 
                      style: 'currency', 
                      currency: loan.currency, 
                      maximumFractionDigits: 0 
                    }).format(loan.metrics?.evaIntrinsic || 0)}
                  </TableCell>
                  <TableCell>
                    {((loan.metrics?.roe || 0) * 100).toFixed(2)}%
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('fr-FR', { 
                      style: 'currency', 
                      currency: loan.currency, 
                      maximumFractionDigits: 0 
                    }).format(loan.metrics?.expectedLoss || 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Portfolio;
