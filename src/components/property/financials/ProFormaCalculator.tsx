import React, { useState, useMemo } from 'react';
import { AtlasProperty } from '@/types/property';
import { 
  Calculator, DollarSign, TrendingUp, Percent, ShieldCheck, 
  ChevronDown, ChevronUp, Download, RefreshCw, BarChart3, AlertCircle 
} from 'lucide-react';

interface ProFormaCalculatorProps {
  property: AtlasProperty;
  onUnlockOM?: () => void;
}

export const ProFormaCalculator: React.FC<ProFormaCalculatorProps> = ({ property, onUnlockOM }) => {
  // Baseline financial metrics seeded from property price
  const basePrice = property.price > 0 ? property.price : 8500000;
  const currencySymbol = property.currency === 'EUR' ? '€' : property.currency === 'GBP' ? '£' : '$';

  // Underwriting Inputs
  const [purchasePrice, setPurchasePrice] = useState<number>(basePrice);
  const [downPaymentPct, setDownPaymentPct] = useState<number>(35); // 35% equity
  const [interestRatePct, setInterestRatePct] = useState<number>(5.85); // 5.85% debt
  const [amortizationYears, setAmortizationYears] = useState<number>(30);
  
  // Income & Expenses
  const estimatedInitialGrossIncome = Math.round(basePrice * 0.082); // ~8.2% gross rent baseline
  const [grossAnnualIncome, setGrossAnnualIncome] = useState<number>(estimatedInitialGrossIncome);
  const [operatingExpensePct, setOperatingExpensePct] = useState<number>(32); // 32% OPEX
  const [capexReservePct, setCapexReservePct] = useState<number>(3); // 3% reserve
  const [annualRentGrowthPct, setAnnualRentGrowthPct] = useState<number>(3.5); // 3.5% rent growth
  
  // Exit & Investment Horizon
  const [holdPeriodYears, setHoldPeriodYears] = useState<number>(5);
  const [exitCapRatePct, setExitCapRatePct] = useState<number>(5.75);

  // Quick Scenarios
  const setScenario = (preset: 'conservative' | 'base' | 'aggressive') => {
    if (preset === 'conservative') {
      setDownPaymentPct(40);
      setInterestRatePct(6.5);
      setOperatingExpensePct(36);
      setAnnualRentGrowthPct(2.0);
      setExitCapRatePct(6.25);
    } else if (preset === 'base') {
      setDownPaymentPct(35);
      setInterestRatePct(5.85);
      setOperatingExpensePct(32);
      setAnnualRentGrowthPct(3.5);
      setExitCapRatePct(5.75);
    } else {
      setDownPaymentPct(30);
      setInterestRatePct(5.25);
      setOperatingExpensePct(28);
      setAnnualRentGrowthPct(4.5);
      setExitCapRatePct(5.25);
    }
  };

  // Calculations
  const metrics = useMemo(() => {
    const equityRequired = purchasePrice * (downPaymentPct / 100);
    const loanAmount = purchasePrice - equityRequired;

    // Monthly debt service payment
    const monthlyRate = (interestRatePct / 100) / 12;
    const totalPayments = amortizationYears * 12;
    let annualDebtService = 0;
    if (monthlyRate > 0 && loanAmount > 0) {
      const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                            (Math.pow(1 + monthlyRate, totalPayments) - 1);
      annualDebtService = monthlyPayment * 12;
    }

    // Operating expenses
    const opex = grossAnnualIncome * (operatingExpensePct / 100);
    const capex = grossAnnualIncome * (capexReservePct / 100);
    const totalExpenses = opex + capex;

    // NOI & Returns
    const inPlaceNOI = grossAnnualIncome - totalExpenses;
    const inPlaceCapRate = purchasePrice > 0 ? (inPlaceNOI / purchasePrice) * 100 : 0;
    const preTaxCashFlow = inPlaceNOI - annualDebtService;
    const cashOnCashPct = equityRequired > 0 ? (preTaxCashFlow / equityRequired) * 100 : 0;
    const dscr = annualDebtService > 0 ? inPlaceNOI / annualDebtService : 0;

    // 5-Year Projection & Exit
    const compoundedRentFactor = Math.pow(1 + annualRentGrowthPct / 100, holdPeriodYears);
    const exitGrossIncome = grossAnnualIncome * compoundedRentFactor;
    const exitNOI = exitGrossIncome * (1 - (operatingExpensePct + capexReservePct) / 100);
    const projectedExitValue = exitCapRatePct > 0 ? exitNOI / (exitCapRatePct / 100) : 0;

    // Estimated Loan Balance at Exit (Approximation)
    const principalPaidDownPct = (holdPeriodYears / amortizationYears) * 0.28;
    const exitLoanBalance = Math.max(0, loanAmount * (1 - principalPaidDownPct));
    const exitNetProceeds = projectedExitValue - exitLoanBalance;
    const cumulativeCashFlow = preTaxCashFlow * holdPeriodYears * 1.05; // slight growth
    const totalReturnCapital = exitNetProceeds + cumulativeCashFlow;
    const equityMultiple = equityRequired > 0 ? totalReturnCapital / equityRequired : 0;
    
    // Leveraged IRR approximation
    const leveragedIRR = equityMultiple > 1 && holdPeriodYears > 0 
      ? (Math.pow(equityMultiple, 1 / holdPeriodYears) - 1) * 100 
      : 0;

    return {
      equityRequired,
      loanAmount,
      annualDebtService,
      totalExpenses,
      inPlaceNOI,
      inPlaceCapRate,
      preTaxCashFlow,
      cashOnCashPct,
      dscr,
      projectedExitValue,
      equityMultiple,
      leveragedIRR
    };
  }, [
    purchasePrice,
    downPaymentPct,
    interestRatePct,
    amortizationYears,
    grossAnnualIncome,
    operatingExpensePct,
    capexReservePct,
    annualRentGrowthPct,
    holdPeriodYears,
    exitCapRatePct
  ]);

  const formatCurrency = (val: number) => {
    return `${currencySymbol}${Math.round(val).toLocaleString()}`;
  };

  const [expandedAdvanced, setExpandedAdvanced] = useState(false);

  return (
    <div className="p-6 sm:p-8 rounded-sm bg-[#111116] border border-white/[0.08] space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
            <Calculator className="w-3.5 h-3.5 text-[#c5a880]" />
            <span>Institutional Pro-Forma & Financial Underwriting Engine</span>
          </div>
          <h2 className="font-editorial text-2xl text-[#f4f2ec]">Dynamic Investment Underwriting</h2>
          <p className="text-xs text-[#8e8d93] font-light">
            Real-time sensitivity modeling, debt service coverage (DSCR), and leveraged IRR returns.
          </p>
        </div>

        {/* Preset scenario tabs */}
        <div className="flex items-center gap-2 p-1 rounded bg-black/40 border border-white/10 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setScenario('conservative')}
            className="px-3 py-1 text-[10px] font-mono-luxury uppercase tracking-wider rounded text-[#8e8d93] hover:text-[#f4f2ec] hover:bg-white/5 transition-colors"
          >
            Conservative
          </button>
          <button
            type="button"
            onClick={() => setScenario('base')}
            className="px-3 py-1 text-[10px] font-mono-luxury uppercase tracking-wider rounded bg-[#c5a880]/15 text-[#c5a880] font-semibold border border-[#c5a880]/30"
          >
            Base Case
          </button>
          <button
            type="button"
            onClick={() => setScenario('aggressive')}
            className="px-3 py-1 text-[10px] font-mono-luxury uppercase tracking-wider rounded text-[#8e8d93] hover:text-[#f4f2ec] hover:bg-white/5 transition-colors"
          >
            Aggressive
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Operating Income */}
        <div className="p-4 rounded bg-black/30 border border-white/[0.06] space-y-1">
          <div className="text-[10px] font-mono-luxury uppercase text-[#8e8d93]">In-Place NOI (Year 1)</div>
          <div className="font-mono-luxury text-xl font-bold text-[#f4f2ec]">
            {formatCurrency(metrics.inPlaceNOI)}
          </div>
          <div className="text-[10px] text-[#c5a880] font-mono-luxury">
            Cap Rate: {metrics.inPlaceCapRate.toFixed(2)}%
          </div>
        </div>

        {/* Cash-on-Cash Return */}
        <div className="p-4 rounded bg-black/30 border border-white/[0.06] space-y-1">
          <div className="text-[10px] font-mono-luxury uppercase text-[#8e8d93]">Cash-on-Cash Return</div>
          <div className={`font-mono-luxury text-xl font-bold ${metrics.cashOnCashPct >= 7 ? 'text-emerald-400' : 'text-[#f4f2ec]'}`}>
            {metrics.cashOnCashPct.toFixed(2)}%
          </div>
          <div className="text-[10px] text-[#8e8d93] font-mono-luxury">
            Net Cash Flow: {formatCurrency(metrics.preTaxCashFlow)}/yr
          </div>
        </div>

        {/* 5-Yr Leveraged IRR */}
        <div className="p-4 rounded bg-black/30 border border-white/[0.06] space-y-1">
          <div className="text-[10px] font-mono-luxury uppercase text-[#8e8d93]">5-Yr Leveraged IRR</div>
          <div className="font-mono-luxury text-xl font-bold text-[#c5a880]">
            {metrics.leveragedIRR.toFixed(1)}%
          </div>
          <div className="text-[10px] text-[#8e8d93] font-mono-luxury">
            Equity Multiple: {metrics.equityMultiple.toFixed(2)}x
          </div>
        </div>

        {/* DSCR */}
        <div className="p-4 rounded bg-black/30 border border-white/[0.06] space-y-1">
          <div className="text-[10px] font-mono-luxury uppercase text-[#8e8d93]">Debt Coverage (DSCR)</div>
          <div className={`font-mono-luxury text-xl font-bold ${
            metrics.dscr >= 1.25 ? 'text-emerald-400' : metrics.dscr >= 1.1 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {metrics.dscr.toFixed(2)}x
          </div>
          <div className="text-[10px] text-[#8e8d93] font-mono-luxury">
            {metrics.dscr >= 1.25 ? 'Institutional Grade' : 'Lender Review Required'}
          </div>
        </div>
      </div>

      {/* Inputs Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {/* Purchase Price Input */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono-luxury">
            <span className="text-[#8e8d93]">Acquisition Price</span>
            <span className="text-[#f4f2ec] font-semibold">{formatCurrency(purchasePrice)}</span>
          </div>
          <input
            type="range"
            min={basePrice * 0.5}
            max={basePrice * 1.8}
            step={50000}
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(Number(e.target.value))}
            className="w-full accent-[#c5a880] cursor-pointer"
          />
        </div>

        {/* Down Payment % */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono-luxury">
            <span className="text-[#8e8d93]">Equity Down Payment (LTV: {100 - downPaymentPct}%)</span>
            <span className="text-[#f4f2ec] font-semibold">{downPaymentPct}% ({formatCurrency(metrics.equityRequired)})</span>
          </div>
          <input
            type="range"
            min={15}
            max={60}
            step={1}
            value={downPaymentPct}
            onChange={(e) => setDownPaymentPct(Number(e.target.value))}
            className="w-full accent-[#c5a880] cursor-pointer"
          />
        </div>

        {/* Debt Interest Rate % */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono-luxury">
            <span className="text-[#8e8d93]">Debt Interest Rate</span>
            <span className="text-[#f4f2ec] font-semibold">{interestRatePct.toFixed(2)}%</span>
          </div>
          <input
            type="range"
            min={3.5}
            max={9.5}
            step={0.05}
            value={interestRatePct}
            onChange={(e) => setInterestRatePct(Number(e.target.value))}
            className="w-full accent-[#c5a880] cursor-pointer"
          />
        </div>

        {/* Gross Annual Rental Income */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono-luxury">
            <span className="text-[#8e8d93]">Gross Annual Revenue</span>
            <span className="text-[#f4f2ec] font-semibold">{formatCurrency(grossAnnualIncome)}</span>
          </div>
          <input
            type="range"
            min={purchasePrice * 0.04}
            max={purchasePrice * 0.15}
            step={25000}
            value={grossAnnualIncome}
            onChange={(e) => setGrossAnnualIncome(Number(e.target.value))}
            className="w-full accent-[#c5a880] cursor-pointer"
          />
        </div>

        {/* Operating Expenses (OPEX %) */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono-luxury">
            <span className="text-[#8e8d93]">Operating Expense Ratio (OPEX)</span>
            <span className="text-[#f4f2ec] font-semibold">{operatingExpensePct}%</span>
          </div>
          <input
            type="range"
            min={18}
            max={50}
            step={1}
            value={operatingExpensePct}
            onChange={(e) => setOperatingExpensePct(Number(e.target.value))}
            className="w-full accent-[#c5a880] cursor-pointer"
          />
        </div>

        {/* Target Exit Cap Rate */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono-luxury">
            <span className="text-[#8e8d93]">Exit Cap Rate (Year {holdPeriodYears})</span>
            <span className="text-[#f4f2ec] font-semibold">{exitCapRatePct.toFixed(2)}%</span>
          </div>
          <input
            type="range"
            min={4.0}
            max={8.5}
            step={0.05}
            value={exitCapRatePct}
            onChange={(e) => setExitCapRatePct(Number(e.target.value))}
            className="w-full accent-[#c5a880] cursor-pointer"
          />
        </div>
      </div>

      {/* Advanced Underwriting Sensitivity Matrix Toggle */}
      <div className="pt-2 border-t border-white/[0.06]">
        <button
          type="button"
          onClick={() => setExpandedAdvanced(!expandedAdvanced)}
          className="flex items-center gap-2 text-xs font-mono-luxury uppercase text-[#c5a880] hover:text-[#e2c295]"
        >
          {expandedAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{expandedAdvanced ? 'Collapse 5-Year Sensitivity Matrix' : 'View 5-Year Exit Valuation & Sensitivity Matrix'}</span>
        </button>

        {expandedAdvanced && (
          <div className="mt-4 p-5 rounded bg-black/40 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono-luxury uppercase text-[#f4f2ec]">
                Projected Year 5 Exit Valuation Matrix
              </div>
              <div className="text-[10px] text-[#8e8d93] font-mono-luxury">
                Exit NOI: {formatCurrency(metrics.inPlaceNOI * Math.pow(1 + annualRentGrowthPct/100, holdPeriodYears))}
              </div>
            </div>

            {/* Sensitivity Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono-luxury text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[#8e8d93]">
                    <th className="py-2 pr-4 font-normal">Exit Cap Rate</th>
                    <th className="py-2 px-4 font-normal">Exit Asset Valuation</th>
                    <th className="py-2 px-4 font-normal">Gross Profit</th>
                    <th className="py-2 px-4 font-normal">Equity Multiple</th>
                    <th className="py-2 pl-4 font-normal">Projected IRR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-[#f4f2ec]">
                  {[-0.5, -0.25, 0, 0.25, 0.5].map((capDelta) => {
                    const testCap = exitCapRatePct + capDelta;
                    const exitVal = metrics.inPlaceNOI * Math.pow(1 + annualRentGrowthPct/100, 5) / (testCap / 100);
                    const grossProfit = exitVal - purchasePrice;
                    const eqMult = (exitVal - metrics.loanAmount * 0.85 + metrics.preTaxCashFlow * 5) / metrics.equityRequired;
                    const testIRR = (Math.pow(Math.max(1, eqMult), 1/5) - 1) * 100;
                    const isBase = capDelta === 0;

                    return (
                      <tr key={capDelta} className={isBase ? 'bg-[#c5a880]/10 font-semibold' : ''}>
                        <td className="py-2.5 pr-4 text-[#c5a880]">
                          {testCap.toFixed(2)}% {isBase ? '(Base)' : ''}
                        </td>
                        <td className="py-2.5 px-4">{formatCurrency(exitVal)}</td>
                        <td className={`py-2.5 px-4 ${grossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCurrency(grossProfit)}
                        </td>
                        <td className="py-2.5 px-4">{eqMult.toFixed(2)}x</td>
                        <td className="py-2.5 pl-4 text-[#c5a880]">{testIRR.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Call to action & Confidential Offering Memorandum Teaser */}
      <div className="p-4 rounded bg-[#c5a880]/10 border border-[#c5a880]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-mono-luxury font-semibold uppercase tracking-wider text-[#c5a880]">
            <ShieldCheck className="w-4 h-4" />
            <span>Audited Rent Roll & Capital Expenditure Schedule</span>
          </div>
          <p className="text-xs text-[#8e8d93] font-light">
            Access verified tenant lease expirations, historical operating statements, and sponsor debt terms in the Digital Deal Room.
          </p>
        </div>

        {onUnlockOM && (
          <button
            type="button"
            onClick={onUnlockOM}
            className="shrink-0 px-4 py-2 rounded bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] text-xs font-mono-luxury font-semibold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <span>Unlock Offering Memorandum</span>
            <span className="text-[10px] opacity-75">(NDA Required)</span>
          </button>
        )}
      </div>
    </div>
  );
};
