import React, { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loan, CashFlow, Currency } from '@/types/finance';
import LoanDataService from '@/services/LoanDataService';
import ParameterService from '@/services/ParameterService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { formatCurrency, convertCurrency, convertLoanAmountToDisplayCurrency } from '@/utils/currencyUtils';
import { ChevronDown, ChevronRight } from 'lucide-react';

const CASHFLOW_TYPES = [
  { key: 'contractual', label: 'Contractual' },
  { key: 'forecast', label: 'Forecast' },
  { key: 'stress', label: 'Stress' }
];

const STRESS_SUBTYPES = [
  { key: 'DEFAULT', label: 'Default' },
  { key: 'LIQUIDITY_CRISIS', label: 'Liquidity Crisis' },
  { key: 'INTEREST_SHOCK', label: 'Interest Shock' }
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
  // Drawdown initial - use drawnAmount, fallback to originalAmount if drawnAmount is 0
  const initialDrawdownAmount = loan.drawnAmount > 0 ? loan.drawnAmount : loan.originalAmount;
  flows.push({
    id: 'drawdown-1',
    date: start.toISOString().split('T')[0],
    type: 'drawdown',
    amount: initialDrawdownAmount,
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
    principalSchedule[N - 1] = loan.drawnAmount;
  } else if (amortType === 'constant') {
    const perPeriod = loan.drawnAmount / N;
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
    const annuity = loan.drawnAmount * r / (1 - Math.pow(1 + r, -n));
    let outstanding = loan.drawnAmount;
    for (let i = 0; i < N; i++) {
      if (i < grace) continue;
      const interest = outstanding * r;
      const principal = annuity - interest;
      principalSchedule[i] = principal;
      outstanding -= principal;
    }
  }
  // Générer les cash flows d'intérêts et de principal
  let outstanding = loan.drawnAmount > 0 ? loan.drawnAmount : loan.originalAmount;
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
const DEFAULT_STRESS_VARS = {
  pd: 0.01,
  lgd: 0.45,
  outstanding: undefined as number | undefined, // fallback to loan.outstandingAmount
};
const LIQUIDITY_CRISIS_VARS = {
  stressUtilizationRate: 0.7,
  scheduledOutflows: undefined as number | undefined, // fallback to loan.originalAmount
  availableLiquidity: undefined as number | undefined, // fallback to loan.drawnAmount + loan.undrawnAmount
  // undrawn removed
};
const INTEREST_SHOCK_VARS = {
  interestShock: 0.02,
};

function generateTermLoanStressCashFlows(
  loan: Loan,
  subType: 'DEFAULT' | 'LIQUIDITY_CRISIS' | 'INTEREST_SHOCK',
  defaultVars: typeof DEFAULT_STRESS_VARS,
  liquidityVars: typeof LIQUIDITY_CRISIS_VARS,
  interestShockVars: typeof INTEREST_SHOCK_VARS
): CashFlow[] {
  const baseFlows = generateTermLoanContractualCashFlows(loan);
  let combined: CashFlow[] = baseFlows;
  if (subType === 'DEFAULT') {
    const pd = defaultVars.pd;
    const lgd = defaultVars.lgd;
    const outstanding = defaultVars.outstanding ?? loan.outstandingAmount ?? loan.originalAmount;
    const defaultAmount = outstanding * pd;
    const recoveryAmount = defaultAmount * (1 - lgd);
    const netLoss = defaultAmount - recoveryAmount;
    const lastDate = baseFlows.length > 0 ? baseFlows[baseFlows.length - 1].date : new Date().toISOString().split('T')[0];
    combined = [
      ...baseFlows,
      {
        id: 'stress-default',
        date: lastDate,
        type: 'default',
        amount: defaultAmount,
        isManual: false,
        description: `Default scenario: DefaultAmount = Outstanding × PD = ${outstanding} × ${pd}`
      },
      {
        id: 'stress-recovery',
        date: lastDate,
        type: 'recovery',
        amount: recoveryAmount,
        isManual: false,
        description: `Recovery: RecoveryAmount = DefaultAmount × (1 - LGD) = ${defaultAmount} × (1 - ${lgd})`
      },
      {
        id: 'stress-netloss',
        date: lastDate,
        type: 'netloss',
        amount: netLoss,
        isManual: false,
        description: `Net Loss: NetLoss = DefaultAmount - RecoveryAmount = ${defaultAmount} - ${recoveryAmount}`
      }
    ];
  } else if (subType === 'LIQUIDITY_CRISIS') {
    // Always calculate undrawn as originalAmount - drawnAmount from loan details
    const stressUtilizationRate = typeof liquidityVars.stressUtilizationRate === 'number' ? liquidityVars.stressUtilizationRate : 0.7;
    const scheduledOutflows = typeof liquidityVars.scheduledOutflows === 'number' ? liquidityVars.scheduledOutflows : loan.originalAmount;
    // For liquidity gap, only use drawnAmount as available liquidity (not drawn + undrawn)
    const availableLiquidity = typeof liquidityVars.availableLiquidity === 'number' ? liquidityVars.availableLiquidity : loan.drawnAmount;
    const undrawn = loan.originalAmount - loan.drawnAmount;
    const stressedDrawings = undrawn * stressUtilizationRate;
    const liquidityGap = scheduledOutflows - availableLiquidity;
    const firstDate = baseFlows.length > 0 ? baseFlows[0].date : new Date().toISOString().split('T')[0];
    combined = [
      ...baseFlows,
      {
        id: 'stress-liquidity-drawdown',
        date: firstDate,
        type: 'drawdown',
        amount: stressedDrawings,
        isManual: false,
        description: `Liquidity crisis: StressedDrawings = ${undrawn} × ${stressUtilizationRate}`
      },
      {
        id: 'stress-liquidity-gap',
        date: firstDate,
        type: 'liquidity_crisis',
        amount: liquidityGap,
        isManual: false,
        description: `Liquidity Gap = ScheduledOutflows - AvailableLiquidity = ${scheduledOutflows} - ${availableLiquidity}`
      }
    ];
  } else if (subType === 'INTEREST_SHOCK') {
    const interestShock = interestShockVars.interestShock;
    combined = baseFlows.map(cf =>
      cf.type === 'interest'
        ? {
            ...cf,
            amount: cf.amount * (1 + interestShock / (loan.margin + loan.referenceRate)),
            description: (cf.description || '') + ` (Interest shock: +${interestShock * 100}bps)`
          }
        : cf
    );
  }
  // Sort by date, then by type for same-date events
  return combined.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) return dateA - dateB;
    return a.type.localeCompare(b.type);
  });
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
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ USD: 1 });
  const [isTableOpen, setIsTableOpen] = useState(true);
  const [stressSubType, setStressSubType] = useState<'DEFAULT' | 'LIQUIDITY_CRISIS' | 'INTEREST_SHOCK'>('DEFAULT');
  const [defaultVars, setDefaultVars] = useState(DEFAULT_STRESS_VARS);
  const [liquidityVars, setLiquidityVars] = useState(LIQUIDITY_CRISIS_VARS);
  const [interestShockVars, setInterestShockVars] = useState(INTEREST_SHOCK_VARS);

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
      // Récupérer tous les taux de change
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (response.ok) {
          const data = await response.json();

          setExchangeRates(data.rates || { USD: 1 });
          const eurRate = data.rates?.EUR;
          if (eurRate) {
            setEurToUsdRate(eurRate);
          }
        }
      } catch (error) {
        setEurToUsdRate(0.9689);
        setExchangeRates({ USD: 1, EUR: 0.9689 });
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
      // Mettre à jour tous les taux de change
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (response.ok) {
          const data = await response.json();

          setExchangeRates(data.rates || { USD: 1 });
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
          return generateTermLoanStressCashFlows(loan, stressSubType, defaultVars, liquidityVars, interestShockVars) || [];
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
  }, [loan, typeToUse, stressSubType, defaultVars, liquidityVars, interestShockVars]);
  // Correction : agréger les cash flows par date pour additionner intérêts et principal sur la même échéance
  const chartData = useMemo(() => {
    if (!loan) return [];
    // For stress scenario: liquidity crisis, adjust outstanding for stressed drawings only
    if (selectedType === 'stress' && stressSubType === 'LIQUIDITY_CRISIS') {
      // Get base chart data
      const baseChart = (() => {
        // Grouper tous les cash flows par date
        const grouped: Record<string, { date: string; interest: number; principal: number; outstanding: number }> = {};
        let outstanding = loan.drawnAmount || 0;
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
        return Object.values(grouped)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map(row => ({
            ...row,
            interest: convertLoanAmountToDisplayCurrency(row.interest, loan?.currency || 'USD', currentCurrency, exchangeRates, eurToUsdRate),
            principal: convertLoanAmountToDisplayCurrency(row.principal, loan?.currency || 'USD', currentCurrency, exchangeRates, eurToUsdRate),
            outstanding: convertLoanAmountToDisplayCurrency(row.outstanding, loan?.currency || 'USD', currentCurrency, exchangeRates, eurToUsdRate)
          }));
      })();
      // Find the crisis date (first cashflow date)
      const crisisDate = baseChart.length > 0 ? baseChart[0].date : undefined;
      // Calculate stressed drawings as undrawn * stressUtilizationRate
      const undrawn = loan.originalAmount - loan.drawnAmount;
      const stressUtilizationRate = typeof liquidityVars.stressUtilizationRate === 'number' ? liquidityVars.stressUtilizationRate : 0.7;
      const stressedDrawings = undrawn * stressUtilizationRate;
      // Apply the jump at the crisis date (add only stressedDrawings, not liquidity gap)
      return baseChart.map(row => {
        if (row.date === crisisDate) {
          return { ...row, outstanding: row.outstanding + convertLoanAmountToDisplayCurrency(stressedDrawings, loan?.currency || 'USD', currentCurrency, exchangeRates, eurToUsdRate) };
        }
        return row;
      });
    }
    // Default: use existing logic
    // Grouper tous les cash flows par date
    const grouped: Record<string, { date: string; interest: number; principal: number; outstanding: number }> = {};
    let outstanding = loan.drawnAmount || 0;
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
        interest: convertLoanAmountToDisplayCurrency(row.interest, loan?.currency || 'USD', currentCurrency, exchangeRates, eurToUsdRate),
        principal: convertLoanAmountToDisplayCurrency(row.principal, loan?.currency || 'USD', currentCurrency, exchangeRates, eurToUsdRate),
        outstanding: convertLoanAmountToDisplayCurrency(row.outstanding, loan?.currency || 'USD', currentCurrency, exchangeRates, eurToUsdRate)
      }));
      }, [flows, loan, currentCurrency, exchangeRates, eurToUsdRate, selectedType, stressSubType, liquidityVars, flows]);
  // For Interest & Principal Payments chart, recalculate after crisis for liquidity crisis scenario
  const interestPrincipalChartData = useMemo(() => {
    if (!loan) return [];
    if (selectedType === 'stress' && stressSubType === 'LIQUIDITY_CRISIS') {
      // Use the same crisis date and stressedDrawings as in the outstanding logic
      const baseFlows = generateTermLoanContractualCashFlows(loan);
      const crisisDate = baseFlows.length > 0 ? baseFlows[0].date : new Date().toISOString().split('T')[0];
      const undrawn = loan.originalAmount - loan.drawnAmount;
      const stressUtilizationRate = typeof liquidityVars.stressUtilizationRate === 'number' ? liquidityVars.stressUtilizationRate : 0.7;
      const stressedDrawings = undrawn * stressUtilizationRate;
      // Recalculate interest and principal after the crisis date using new outstanding
      let outstanding = loan.originalAmount + stressedDrawings;
      const freq = loan.principalRepaymentFrequency || 'annual';
      const intFreq = loan.interestPaymentFrequency || freq;
      const amortType = loan.amortizationType || 'inFine';
      const grace = loan.gracePeriodMonths || 0;
      const start = new Date(loan.startDate);
      const end = new Date(loan.endDate);
      const periods: Date[] = [];
      let d = new Date(start);
      while (d < end) {
        periods.push(new Date(d));
        d = addPeriod(d, freq);
        if (d > end) d = new Date(end);
      }
      if (periods[periods.length - 1].getTime() !== end.getTime()) periods.push(end);
      const N = periods.length;
      let principalSchedule = Array(N).fill(0);
      if (amortType === 'inFine') {
        principalSchedule[N - 1] = outstanding;
      } else if (amortType === 'constant') {
        const perPeriod = outstanding / N;
        for (let i = grace; i < N; i++) principalSchedule[i] = perPeriod;
      } else if (amortType === 'annuity') {
        let periodsPerYear = 1;
        if (freq === 'monthly') periodsPerYear = 12;
        else if (freq === 'quarterly') periodsPerYear = 4;
        else if (freq === 'semiannual') periodsPerYear = 2;
        const r = (loan.margin + loan.referenceRate) / periodsPerYear;
        const n = N - grace;
        const annuity = outstanding * r / (1 - Math.pow(1 + r, -n));
        let out = outstanding;
        for (let i = 0; i < N; i++) {
          if (i < grace) continue;
          const interest = out * r;
          const principal = annuity - interest;
          principalSchedule[i] = principal;
          out -= principal;
        }
      }
      // Build chart data
      let out = outstanding;
      const chartRows = periods.map((date, i) => {
        let interest = 0;
        if (i >= grace) {
          interest = out * (loan.margin + loan.referenceRate) * getYearFraction(freq);
        }
        let principal = 0;
        if (principalSchedule[i] > 0) {
          principal = principalSchedule[i];
          out -= principal;
        }
        return {
          date: date.toISOString().split('T')[0],
          interest: convertLoanAmountToDisplayCurrency(interest, loan?.currency || 'USD', currentCurrency, exchangeRates, eurToUsdRate),
          principal: convertLoanAmountToDisplayCurrency(principal, loan?.currency || 'USD', currentCurrency, exchangeRates, eurToUsdRate)
        };
      });
      return chartRows;
    }
    // Default: use existing logic
    // Grouper tous les cash flows par date
    const grouped: Record<string, { date: string; interest: number; principal: number }> = {};
    (Array.isArray(flows) ? flows : []).forEach(cf => {
      if (!grouped[cf.date]) {
        grouped[cf.date] = { date: cf.date, interest: 0, principal: 0 };
      }
      if (cf.type === 'interest') {
        grouped[cf.date].interest += cf.amount;
      }
      if (cf.type === 'repayment' || cf.type === 'prepayment') {
        grouped[cf.date].principal += cf.amount;
      }
    });
    return Object.values(grouped)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(row => ({
        ...row,
        interest: convertLoanAmountToDisplayCurrency(row.interest, loan?.currency || 'USD', currentCurrency, exchangeRates, eurToUsdRate),
        principal: convertLoanAmountToDisplayCurrency(row.principal, loan?.currency || 'USD', currentCurrency, exchangeRates, eurToUsdRate)
      }));
      }, [flows, loan, currentCurrency, exchangeRates, eurToUsdRate, selectedType, stressSubType, liquidityVars]);
  if (!loan) return <div>Loan not found</div>;
  const renderStressVars = () => {
    if (selectedType !== 'stress') return null;
    const handleReset = () => {
      if (stressSubType === 'DEFAULT') setDefaultVars(DEFAULT_STRESS_VARS);
      if (stressSubType === 'LIQUIDITY_CRISIS') setLiquidityVars(LIQUIDITY_CRISIS_VARS);
      if (stressSubType === 'INTEREST_SHOCK') setInterestShockVars(INTEREST_SHOCK_VARS);
    };
    if (stressSubType === 'DEFAULT') {
      return (
        <div className="flex flex-wrap gap-4 mb-2 items-end">
          <label>PD (%)
            <input type="number" step="0.01" min="0" max="1" value={defaultVars.pd}
              onChange={e => setDefaultVars(v => ({ ...v, pd: parseFloat(e.target.value) }))}
              className="ml-1 border rounded px-2 py-1 w-20" />
          </label>
          <label>LGD (%)
            <input type="number" step="0.01" min="0" max="1" value={defaultVars.lgd}
              onChange={e => setDefaultVars(v => ({ ...v, lgd: parseFloat(e.target.value) }))}
              className="ml-1 border rounded px-2 py-1 w-20" />
          </label>
          <label>Outstanding
            <input type="number" step="0.01" min="0" value={defaultVars.outstanding ?? ''}
              onChange={e => setDefaultVars(v => ({ ...v, outstanding: e.target.value ? parseFloat(e.target.value) : undefined }))}
              placeholder="auto"
              className="ml-1 border rounded px-2 py-1 w-24" />
          </label>
          <button type="button" onClick={handleReset} className="ml-4 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm">Reset to Default</button>
        </div>
      );
    }
    if (stressSubType === 'LIQUIDITY_CRISIS') {
      return (
        <div className="flex flex-wrap gap-4 mb-2 items-end">
          <label>Stress Utilization Rate
            <input type="number" step="0.01" min="0" max="1" value={liquidityVars.stressUtilizationRate}
              onChange={e => setLiquidityVars(v => ({ ...v, stressUtilizationRate: parseFloat(e.target.value) }))}
              className="ml-1 border rounded px-2 py-1 w-24" />
          </label>
          <label>Scheduled Outflows
            <input type="number" step="0.01" min="0" value={liquidityVars.scheduledOutflows ?? ''}
              onChange={e => setLiquidityVars(v => ({ ...v, scheduledOutflows: e.target.value ? parseFloat(e.target.value) : undefined }))}
              placeholder="auto"
              className="ml-1 border rounded px-2 py-1 w-24" />
          </label>
          <label>Available Liquidity
            <input type="number" step="0.01" min="0" value={liquidityVars.availableLiquidity ?? ''}
              onChange={e => setLiquidityVars(v => ({ ...v, availableLiquidity: e.target.value ? parseFloat(e.target.value) : undefined }))}
              placeholder="auto"
              className="ml-1 border rounded px-2 py-1 w-24" />
          </label>
          <button type="button" onClick={handleReset} className="ml-4 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm">Reset to Default</button>
        </div>
      );
    }
    if (stressSubType === 'INTEREST_SHOCK') {
      return (
        <div className="flex flex-wrap gap-4 mb-2 items-end">
          <label>Interest Shock (decimal)
            <input type="number" step="0.001" min="0" value={interestShockVars.interestShock}
              onChange={e => setInterestShockVars(v => ({ ...v, interestShock: parseFloat(e.target.value) }))}
              className="ml-1 border rounded px-2 py-1 w-24" />
          </label>
          <button type="button" onClick={handleReset} className="ml-4 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm">Reset to Default</button>
        </div>
      );
    }
    return null;
  };
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
        {selectedType === 'stress' && (
          <div className="flex gap-2 ml-4">
            {STRESS_SUBTYPES.map(s => (
              <button
                key={s.key}
                className={`px-3 py-1 rounded border ${stressSubType === s.key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}
                onClick={() => setStressSubType(s.key as any)}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {renderStressVars()}
      {Array.isArray(flows) && flows[0] && flows[0].id.startsWith('error-') && (
        <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
          {flows[0].description}
        </div>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setIsTableOpen(v => !v)}>
          <div className="flex items-center gap-2">
            {isTableOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            <CardTitle>Cash Flow Schedule ({CASHFLOW_TYPES.find(t => t.key === typeToUse)?.label})</CardTitle>
          </div>
        </CardHeader>
        {isTableOpen && (
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
                      convertLoanAmountToDisplayCurrency(cf.amount, loan?.currency || 'USD', currentCurrency, exchangeRates, eurToUsdRate),
                      currentCurrency
                    )}</TableCell>
                    <TableCell>{cf.description || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
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
            <BarChart data={interestPrincipalChartData}>
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