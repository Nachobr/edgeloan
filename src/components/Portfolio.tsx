import React from 'react';
import { Position } from '../types';

interface PortfolioProps {
  position: Position;
  currentPrice?: number; // Added currentPrice to show value changes
}

export const Portfolio: React.FC<PortfolioProps> = ({ position, currentPrice = 0 }) => {
  const getHealthColor = (hf: number) => {
    if (hf < 1.6) return 'text-terminal-red';
    if (hf < 2.0) return 'text-yellow-500';
    return 'text-terminal-green';
  };

  // Calculate live value of collateral
  const collateralValueUsd = position.collateralAmount * currentPrice;

  return (
    <div className="bg-terminal-panel border border-terminal-border p-6 rounded-sm font-mono h-full">
      <h2 className="text-terminal-accent text-sm uppercase tracking-widest mb-6 border-b border-terminal-border pb-2">
        {'>'} Live Positions
      </h2>

      {position.status === 'NONE' ? (
        <div className="h-40 flex items-center justify-center text-gray-600 text-xs">
          [NO ACTIVE STRATEGIES DETECTED]
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">COLLATERAL (ETH)</div>
              <div className="text-lg text-white">{position.collateralAmount.toFixed(4)} ETH</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">COLLATERAL VALUE ($)</div>
              <div className={`text-lg font-bold ${currentPrice > position.entryPrice ? 'text-terminal-green' : 'text-white'}`}>
                ${collateralValueUsd.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">DEBT (USDC)</div>
              <div className="text-lg text-white">${position.loanAmount.toFixed(2)}</div>
            </div>
          </div>

          <div className="h-px bg-terminal-border my-2"></div>

          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">HEALTH FACTOR</div>
            <div className={`text-2xl font-bold ${getHealthColor(position.healthFactor)}`}>
              {position.healthFactor > 100 ? '∞' : position.healthFactor.toFixed(2)}
            </div>
          </div>

          <div className="w-full bg-gray-800 h-1 mt-1">
            <div
              className={`h-1 transition-all duration-500 ${position.healthFactor < 1.5 ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min((position.healthFactor / 3) * 100, 100)}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            <div className="bg-black p-2 border border-terminal-border">
              <span className="block text-gray-600">ENTRY PRICE</span>
              ${position.entryPrice.toFixed(2)}
            </div>
            <div className="bg-black p-2 border border-terminal-border">
              <span className="block text-gray-600">LIQ. PRICE</span>
              <span className="text-terminal-red">${position.liquidationPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};