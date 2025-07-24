import React, { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loan, CashFlow, Currency } from '@/types/finance';
import LoanDataService from '@/services/LoanDataService';
import ParameterService from '@/services/ParameterService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { formatCurrency, convertCurrency } from '@/utils/currencyUtils';

const CASHFLOW_TYPES = [
  { key: 'contractual', label: 'Contractual' },
  { key: 'forecast', label: 'Forecast' },
  { key: 'stress', label: 'Stress' }
];

function addPeriod(date: Date, freq: 'monthly' | 'quarterly' | 'semiannual' | 'annual') {
  const d = new Date(date);
  switch (freq) {
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'semiannual': d.setMonth(d.getMonth() + 6); break;
    case 'annual': d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

function getYearFraction(freq: 'monthly' | 'quarterly' | 'semiannual' | 'annual') {
  switch (freq) {
    case 'monthly': return 1 / 12;
    case 'quarterly': return 1 / 4;
    case 'semiannual': return 1 / 2;
    case 'annual': return 1;
  }
}

function safeNumber(val: any, fallback = 0) {
  return typeof val === 'number' && !isNaN(val) ? val : fallback;
}

// CONTRACTUAL CASH FLOWS
function generateTermLoanContractualCashFlows(loan: Loan): CashFlow[] {
  const flows: CashFlow[] = [];
  const freq = loan.principalRepaymentFrequency || 'annual';
  const intFreq = loan.interestPaymentFrequency || freq;
  const amortType = loan.amortizationType || 'inFine';
  const grace = loan.gracePeriodMonths || 0;
  const start = new Date(loan.startDate);
  const end = new Date(loan.endDate);
  const periods: Date[] = [];
  let d = new Date(start);
  // Générer toutes les dates d'échéance
  while (d < end) {
    periods.push(new Date(d));
    d = addPeriod(d, freq);
    if (d > end) d = new Date(end);
  }
  if (periods[periods.length - 1].getTime() !== end.getTime()) periods.push(end);
  const N = periods.length;
  // Drawdown initial
  flows.push({
    id: 'drawdown-1',
    date: start.toISOString().split('T')[0],
    type: 'drawdown',
    amount: loan.originalAmount,
    isManual: false,
    description: 'Initial drawdown'
  });
  // Frais initiaux
  if (loan.fees?.upfront) {
    flows.push({
      id: 'fee-upfront',
      date: start.toISOString().split('T')[0],
      type: 'fee',
      amount: loan.fees.upfront,
      isManual: false,
      description: 'Upfront fee'
    });
  }
  // Amortissement
  let principalSchedule = Array(N).fill(0);
  if (amortType === 'inFine') {
    principalSchedule[N - 1] = loan.originalAmount;
  } else if (amortType === 'constant') {
    const perPeriod = loan.originalAmount / N;
    for (let i = grace; i < N; i++) principalSchedule[i] = perPeriod;
  } else if (amortType === 'annuity') {
    // r = taux périodique
    const annualRate = loan.margin + loan.referenceRate;
    let periodsPerYear = 1;
    if (freq === 'monthly') periodsPerYear = 12;
    else if (freq === 'quarterly') periodsPerYear = 4;
    else if (freq === 'semiannual') periodsPerYear = 2;
    const r = annualRate / periodsPerYear;
    const n = N - grace;
    const annuity = loan.originalAmount * r / (1 - Math.pow(1 + r, -n));
    let outstanding = loan.originalAmount;
    for (let i = 0; i < N; i++) {
      if (i < grace) continue;
      const interest = outstanding * r;
      const principal = annuity - interest;
      principalSchedule[i] = principal;
      outstanding -= principal;
    }
  }
  // Générer les cash flows d'intérêts et de principal
  let outstanding = loan.originalAmount;
  for (let i = 0; i < N; i++) {
    const date = periods[i].toISOString().split('T')[0];
    // Intérêts
    if (i >= grace) {
      const interest = outstanding * (loan.margin + loan.referenceRate) * getYearFraction(freq);
      flows.push({
        id: `interest-${i + 1}`,
        date,
        type: 'interest',
        amount: interest,
        isManual: false,
        description: 'Interest payment'
      });
    }
    // Principal
    if (principalSchedule[i] > 0) {
      flows.push({
        id: `repayment-${i + 1}`,
        date,
        type: 'repayment',
        amount: principalSchedule[i],
        isManual: false,
        description: 'Principal repayment'
      });
      outstanding -= principalSchedule[i];
    }
    // Frais annuels/agence/autres (optionnel)
    if (loan.fees?.agency && i === 0) {
      flows.push({
        id: `fee-agency`,
        date,
        type: 'fee',
        amount: loan.fees.agency,
        isManual: false,
        description: 'Agency fee'
      });
    }
    if (loan.fees?.other && i === 0) {
      flows.push({
        id: `fee-other`,
        date,
        type: 'fee',
        amount: loan.fees.other,
        isManual: false,
        description: 'Other fee'
      });
    }
  }
  return flows;
}

// FORECAST CASH FLOWS (prévisionnels)
function generateTermLoanForecastCashFlows(loan: Loan): CashFlow[] {
  // Clone les contractuels et change la description/type
  return generateTermLoanContractualCashFlows(loan).map(cf => ({
    ...cf,
    description: (cf.description || '') + ' (forecast)',
    type: cf.type === 'repayment' ? 'prepayment' : cf.type
  }));
}

// STRESS CASH FLOWS
function generateTermLoanStressCashFlows(loan: Loan): CashFlow[] {
  // Clone les contractuels et change la description/type
  return generateTermLoanContractualCashFlows(loan).map(cf => ({
    ...cf,
    description: (cf.description || '') + ' (stress)',
    type: cf.type === 'interest' ? 'interest' : cf.type
  }));
}

interface LoanCashflowProps {
  forcedType?: 'contractual' | 'forecast' | 'stress';
}

const LoanCashflow: React.FC = () => {
  const { id } = useParams();
  const loan = LoanDataService.getInstance().getAllLoans().find(l => l.id === id);
  const [selectedType, setSelectedType] = useState<'contractual' | 'forecast' | 'stress'>('contractual');
  const [currentCurrency, setCurrentCurrency] = useState<Currency>('USD');
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number>(1.0);
  const [eurToUsdRate, setEurToUsdRate] = useState<number>(1.0968);

  // Charger la currency choisie depuis les paramètres globaux
  useEffect(() => {
    const loadCurrencySettings = async () => {
      const parameters = ParameterService.loadParameters();
      if (parameters.currency) {
        setCurrentCurrency(parameters.currency);
      }
      if (parameters.exchangeRate) {
        setCurrentExchangeRate(parameters.exchangeRate);
      }
      // Toujours récupérer le taux EUR pour la conversion
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (response.ok) {
          const data = await response.json();
          const eurRate = data.rates?.EUR;
          if (eurRate) {
            setEurToUsdRate(eurRate);
          }
        }
      } catch (error) {
        setEurToUsdRate(0.9689);
      }
    };
    loadCurrencySettings();
    // Écouter les changements de paramètres
    const handleParametersUpdated = async () => {
      const parameters = ParameterService.loadParameters();
      if (parameters.currency) {
        setCurrentCurrency(parameters.currency);
      }
      if (parameters.exchangeRate) {
        setCurrentExchangeRate(parameters.exchangeRate);
      }
      // Mettre à jour le taux EUR
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (response.ok) {
          const data = await response.json();
          const eurRate = data.rates?.EUR;
          if (eurRate) {
            setEurToUsdRate(eurRate);
          }
        }
      } catch (error) {}
    };
    window.addEventListener('parameters-updated', handleParametersUpdated);
    return () => {
      window.removeEventListener('parameters-updated', handleParametersUpdated);
    };
  }, []);

  const typeToUse = selectedType;
  // Génération des cash flows selon le type, même logique pour tous
  const flows: CashFlow[] = useMemo(() => {
    if (!loan) return [];
    try {
      switch (typeToUse) {
        case 'contractual':
          return generateTermLoanContractualCashFlows(loan) || [];
        case 'forecast':
          return generateTermLoanForecastCashFlows(loan) || [];
        case 'stress':
          return generateTermLoanStressCashFlows(loan) || [];
        default:
          return [];
      }
    } catch (e) {
      console.error('Error generating cash flows:', e);
      return [{
        id: 'error-main',
        date: '',
        type: 'fee',
        amount: 0,
        isManual: false,
        description: 'Error: ' + (e instanceof Error ? e.message : String(e))
      }];
    }
  }, [loan, typeToUse]);
  // Correction : agréger les cash flows par date pour additionner intérêts et principal sur la même échéance
  const chartData = useMemo(() => {
    if (!loan) return [];
    // Grouper tous les cash flows par date
    const grouped: Record<string, { date: string; interest: number; principal: number; outstanding: number }> = {};
    let outstanding = loan.originalAmount || 0;
    (Array.isArray(flows) ? flows : []).forEach(cf => {
      if (!grouped[cf.date]) {
        grouped[cf.date] = { date: cf.date, interest: 0, principal: 0, outstanding };
      }
      if (cf.type === 'interest') {
        grouped[cf.date].interest += cf.amount;
      }
      if (cf.type === 'repayment' || cf.type === 'prepayment') {
        grouped[cf.date].principal += cf.amount;
        outstanding -= cf.amount;
      }
      // Mettre à jour l'encours après chaque principal
      grouped[cf.date].outstanding = Math.max(outstanding, 0);
    });
    // Retourner les dates triées et convertir les montants dans la bonne currency
    return Object.values(grouped)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(row => ({
        ...row,
        interest: convertCurrency(row.interest, currentCurrency, currentExchangeRate, eurToUsdRate),
        principal: convertCurrency(row.principal, currentCurrency, currentExchangeRate, eurToUsdRate),
        outstanding: convertCurrency(row.outstanding, currentCurrency, currentExchangeRate, eurToUsdRate)
      }));
  }, [flows, loan, currentCurrency, currentExchangeRate, eurToUsdRate]);
  if (!loan) return <div>Loan not found</div>;
  return (
    <div className="space-y-8">
      <div className="flex gap-2 mb-2">
        {CASHFLOW_TYPES.map(t => (
          <button
            key={t.key}
            className={`px-4 py-2 rounded ${selectedType === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
            onClick={() => setSelectedType(t.key as any)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {Array.isArray(flows) && flows[0] && flows[0].id.startsWith('error-') && (
        <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
          {flows[0].description}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Schedule ({CASHFLOW_TYPES.find(t => t.key === typeToUse)?.label})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(flows) ? flows : []).map(cf => (
                <TableRow key={cf.id}>
                  <TableCell>{cf.date}</TableCell>
                  <TableCell>{cf.type}</TableCell>
                  <TableCell className="text-right">{formatCurrency(
                    convertCurrency(cf.amount, currentCurrency, currentExchangeRate, eurToUsdRate),
                    currentCurrency
                  )}</TableCell>
                  <TableCell>{cf.description || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Evolution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="outstanding" name="Outstanding" stroke="#2D5BFF" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Interest & Principal Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="interest" name="Interest" fill="#FFB800" />
              <Bar dataKey="principal" name="Principal" fill="#00C48C" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoanCashflow; 