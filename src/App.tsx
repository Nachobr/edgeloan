import React, { useState, useEffect } from 'react';
import { PriceChart } from './components/PriceChart';
import { HistoryPanel } from './components/HistoryPanel';
import { TradingConsole } from './components/TradingConsole';
import { Portfolio } from './components/Portfolio';
import { FlashLoanConsole } from './components/FlashLoanConsole';
import { CreditScorePanel } from './components/CreditScorePanel';
import { FAQ } from './components/FAQ';
import { useDemoStore } from './services/demoStore';
import { DemoScenario } from './types';

function App() {
  const {
    market,
    position,
    walletBalance,
    creditProfile,
    depositAndBorrow,
    repayPosition,
    resetPosition,
    triggerScenario,
    fetchData // Initial Fetch
  } = useDemoStore();

  const [currentTab, setCurrentTab] = useState<'LENDING' | 'FLASH_LOAN' | 'CREDIT' | 'FAQ'>('LENDING');

  useEffect(() => {
    // Poll for updates every 3s
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line

  return (
    <div className="min-h-screen bg-terminal-bg text-gray-300 p-4 font-mono selection:bg-terminal-green selection:text-black">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 border-b border-terminal-border pb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-terminal-green rounded-full animate-pulse"></div>
          <h1 className="text-xl font-bold tracking-tighter text-white">EDGE<span className="text-terminal-green">LEND</span>_DESKTOP <span className="text-xs text-gray-600 ml-2">v0.2.1-beta</span></h1>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="bg-terminal-panel px-3 py-1 border border-terminal-border">
            NET: <span className="text-white">{walletBalance.network}</span>
          </div>
          <div className="bg-terminal-panel px-3 py-1 border border-terminal-border">
            WALLET: <span className="text-white">0x71C...9A2</span>
          </div>
          <div className="bg-terminal-panel px-3 py-1 border border-terminal-border">
            USDC: <span className="text-terminal-green">${(walletBalance.balances['USDC'] || 0).toFixed(2)}</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex gap-2 mb-6">
        {['LENDING', 'FLASH_LOAN', 'CREDIT', 'FAQ'].map((tab) => (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab as any)}
            className={`px-4 py-2 text-xs font-bold font-mono border ${currentTab === tab ? 'bg-terminal-green text-black border-terminal-green' : 'bg-transparent text-gray-500 border-terminal-border hover:border-gray-400'}`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Main Grid */}
      <main className="grid grid-cols-12 gap-6 min-h-[calc(100vh-180px)]">

        {/* Left Col: Chart & Portfolio (Always Visible) */}
        <div className="col-span-8 flex flex-col gap-6 h-full">
          <div className="flex-grow basis-2/3 min-h-0">
            {/* Note: Chart currently only shows ETH, future could toggle based on selected asset */}
            <PriceChart data={market.priceHistory} currentPrice={market.assets['ETH']?.price || 0} />
          </div>
          <div className="flex-grow basis-1/3 flex flex-col gap-4">
            <Portfolio position={position} currentPrice={market.assets['ETH']?.price || 0} />
            <HistoryPanel history={market.positionHistory || []} />
          </div>
        </div>

        {/* Right Col: Dynamic Content based on Tab */}
        <div className="col-span-4 flex flex-col gap-6 h-full">
          <div className="flex-grow">
            {currentTab === 'LENDING' && (
              <TradingConsole
                walletBalance={walletBalance}
                onDeposit={depositAndBorrow}
                onRepay={repayPosition}
                onReset={resetPosition}
                position={position}
                currentPrice={market.assets['ETH']?.price || 0}
              />
            )}

            {currentTab === 'FLASH_LOAN' && (
              <FlashLoanConsole
                wallet={walletBalance}
                assets={market.assets}
              />
            )}

            {currentTab === 'CREDIT' && (
              <CreditScorePanel profile={creditProfile} />
            )}

            {currentTab === 'FAQ' && (
              <FAQ />
            )}
          </div>

          {/* Demo Controls - Sticky at bottom of right col */}
          <div className="bg-zinc-900 border border-red-900/50 p-4 rounded-sm">
            <h3 className="text-red-500 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Admin / Simulation Mode
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => triggerScenario(DemoScenario.DOUBLE_PRICE)}
                className="bg-black border border-zinc-700 text-xs py-2 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                TRIGGER 2X PUMP
              </button>
              <button
                onClick={() => triggerScenario(DemoScenario.CRASH_LIQUIDATION)}
                className="bg-black border border-zinc-700 text-xs py-2 hover:bg-zinc-800 hover:text-red-500 transition-colors"
              >
                TRIGGER CRASH
              </button>
              <button
                onClick={() => triggerScenario(DemoScenario.NORMAL)}
                className="col-span-2 bg-black border border-zinc-700 text-xs py-2 text-gray-500 hover:text-white"
              >
                RESET PRICE
              </button>
              <button
                onClick={resetPosition}
                className="col-span-2 bg-red-900/20 border border-red-900 text-xs py-2 text-red-500 hover:text-white hover:bg-red-900"
              >
                FULL RESET (WALLET)
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;