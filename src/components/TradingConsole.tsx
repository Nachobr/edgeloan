import React, { useState } from 'react';
import { Position, WalletState } from '../types';

interface TradingConsoleProps {
  walletBalance: WalletState;
  onDeposit: (asset: string, amount: number) => void;
  onRepay: () => void;
  onReset: () => void;
  position: Position;
  currentPrice: number;
}

export const TradingConsole: React.FC<TradingConsoleProps> = ({
  walletBalance,
  onDeposit,
  onRepay,
  onReset,
  position,
  currentPrice
}) => {
  const [amount, setAmount] = useState<string>('');

  const ethBalance = walletBalance.balances['ETH'] || 0;

  const handleDeposit = () => {
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0) {
      onDeposit('ETH', val);
      setAmount('');
    }
  };

  const handleRepayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("UI: Repay button clicked");
    onRepay();
  };

  // Live PnL Calculation
  const livePnL = (currentPrice - position.entryPrice) * position.collateralAmount;
  const pnlPercent = position.entryPrice > 0 ? ((currentPrice - position.entryPrice) / position.entryPrice) * 100 : 0;

  // Net Equity = (Collateral * Price) - Loan
  const currentCollateralValue = position.collateralAmount * currentPrice;
  const currentEquity = currentCollateralValue - position.loanAmount;

  const renderDepositState = () => (
    <div className="space-y-6 z-10 relative">
      <div>
        <label className="block text-gray-500 text-xs mb-2">COLLATERAL AMOUNT (ETH)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-black border border-terminal-border text-white p-3 w-full focus:border-terminal-green focus:outline-none"
            placeholder="0.00"
          />
          <button
            onClick={() => setAmount(ethBalance.toString())}
            className="px-3 border border-terminal-border text-xs text-gray-400 hover:text-white hover:border-gray-500"
          >
            MAX
          </button>
        </div>
        <div className="mt-2 text-right text-xs text-gray-500">
          Avail: {ethBalance.toFixed(4)} ETH
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-black/50 p-3 border border-terminal-border border-dashed">
          <span className="block text-gray-500 text-xs">EST. LOAN (USDC)</span>
          <span className="text-white">
            ${(parseFloat(amount || '0') * currentPrice * 0.5).toFixed(2)}
          </span>
        </div>
        <div className="bg-black/50 p-3 border border-terminal-border border-dashed">
          <span className="block text-gray-500 text-xs">LTV RATIO</span>
          <span className="text-terminal-green">50.00%</span>
        </div>
      </div>

      <button
        onClick={handleDeposit}
        className="w-full bg-terminal-green text-black font-bold py-4 hover:bg-green-400 transition-colors uppercase tracking-widest cursor-pointer"
      >
        Execute Strategy
      </button>

      <p className="text-[10px] text-gray-600 mt-2 text-center">
        *Strategy auto-buys 1.5x Leverage on execution.
      </p>
    </div>
  );

  const renderActiveState = () => (
    <div className="flex flex-col h-full z-10 relative">
      <div className="flex-grow space-y-4">
        {/* PNL DISPLAY */}
        <div className={`border p-4 transition-colors duration-500 ${livePnL > 0 ? 'bg-green-900/20 border-terminal-green' : 'bg-black border-terminal-border'}`}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-gray-500 uppercase">Unrealized PnL</div>
            {livePnL > 0 && <div className="text-[10px] bg-terminal-green text-black px-2 py-0.5 font-bold rounded">IN PROFIT</div>}
          </div>

          <div className={`text-4xl font-bold tracking-tighter ${livePnL >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
            {livePnL >= 0 ? '+' : ''}{livePnL.toFixed(2)}
            <span className="text-sm ml-1 text-gray-500">USDC</span>
          </div>
          <div className={`text-sm ${livePnL >= 0 ? 'text-green-500' : 'text-red-500'} font-bold mt-1`}>
            {pnlPercent > 0 ? '▲' : '▼'} {pnlPercent.toFixed(2)}%
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-black/50 p-2 border border-terminal-border">
            <span className="block text-gray-500 mb-1">Total Equity</span>
            <span className="text-white text-lg">${currentEquity.toFixed(2)}</span>
          </div>
          <div className="bg-black/50 p-2 border border-terminal-border">
            <span className="block text-gray-500 mb-1">Debt Owed</span>
            <span className="text-white text-lg">${position.loanAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS - EXPLICITLY RENDERED */}
      <div className="mt-auto pt-4 border-t border-terminal-border">
        {livePnL > 500 && (
          <div className="mb-2 text-center text-terminal-green text-xs animate-bounce font-bold">
            🎉 TARGET HIT! PROFIT AVAILABLE TO CLAIM
          </div>
        )}
        <button
          onClick={handleRepayClick}
          className={`w-full font-bold py-4 transition-all uppercase tracking-widest shadow-lg cursor-pointer ${livePnL > 0
            ? 'bg-terminal-green text-black hover:bg-green-400 hover:scale-[1.02]'
            : 'bg-terminal-panel border border-terminal-green text-terminal-green hover:bg-terminal-green hover:text-black'
            }`}
        >
          {livePnL > 0 ? `Repay & Claim $${livePnL.toFixed(0)} Profit` : 'Repay Loan'}
        </button>
        <p className="text-[10px] text-gray-600 mt-2 text-center">
          Action: Sell Collateral -&gt; Pay Debt -&gt; Keep Profit
        </p>
      </div>
    </div>
  );

  const renderClosedState = () => (
    <div className="flex flex-col justify-center h-full space-y-6 z-10 relative">
      <div className={`p-6 border-2 ${position.status === 'LIQUIDATED' ? 'border-red-500 bg-red-900/10' : 'border-terminal-green bg-green-900/10'} text-center relative overflow-hidden`}>
        <div className="relative z-10">
          <div className="text-xs text-gray-400 uppercase mb-2 tracking-[0.2em]">Trade Result</div>
          <div className="text-3xl font-bold mb-2">{position.status}</div>
          {position.status === 'CLOSED' && (
            <div className="flex flex-col gap-1">
              <div className="text-terminal-green text-2xl font-bold">
                +{position.realizedPnL?.toFixed(2)} USDC
              </div>
              <div className="text-xs text-gray-400">Added to Wallet</div>
            </div>
          )}
          {position.status === 'LIQUIDATED' && (
            <div className="text-terminal-red text-xl font-bold">
              LOSS: Collateral Seized
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full border border-gray-600 text-gray-400 py-3 hover:border-white hover:text-white transition-colors uppercase text-xs tracking-widest cursor-pointer"
      >
        [ Start New Session ]
      </button>
    </div>
  );

  return (
    <div className="bg-terminal-panel border border-terminal-border p-6 rounded-sm font-mono h-full flex flex-col relative overflow-hidden">
      <h2 className="text-terminal-accent text-sm uppercase tracking-widest mb-6 border-b border-terminal-border pb-2 z-10 relative">
        {'>'} Command Center
      </h2>

      {position.status === 'NONE' && renderDepositState()}
      {position.status === 'ACTIVE' && renderActiveState()}
      {(position.status === 'CLOSED' || position.status === 'LIQUIDATED') && renderClosedState()}
    </div>
  );
};