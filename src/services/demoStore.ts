import { create } from 'zustand';
import { MarketState, Position, WalletState, CreditProfile } from '../types';

interface AppState {
  market: MarketState;
  position: Position;
  walletBalance: WalletState;
  creditProfile: CreditProfile;

  // Actions
  fetchData: () => Promise<void>;
  depositAndBorrow: (asset: string, amount: number) => Promise<void>;
  repayPosition: () => Promise<void>;
  resetPosition: () => Promise<void>;
  triggerScenario: (scenario: string) => Promise<void>;
  executeFlashLoan: (asset: string, amount: number, direction: 'LONG' | 'SHORT') => Promise<{ success: boolean, message: string }>;
  simulateArbStrategy: (asset: string, amount: number, direction: 'LONG' | 'SHORT') => Promise<{ success: boolean, message: string }>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Mock Data for Vercel Demo
const MOCK_MARKET = {
  assets: {
    'ETH': { symbol: 'ETH', name: 'Ethereum', price: 2000.0, ltv: 0.80, liquidation_threshold: 0.85 },
    'BTC': { symbol: 'BTC', name: 'Bitcoin', price: 60000.0, ltv: 0.75, liquidation_threshold: 0.80 },
    'SOL': { symbol: 'SOL', name: 'Solana', price: 100.0, ltv: 0.60, liquidation_threshold: 0.65 },
    'USDC': { symbol: 'USDC', name: 'USD Coin', price: 1.0, ltv: 0.90, liquidation_threshold: 0.95 },
  },
  priceHistory: Array(20).fill(0).map((_, i) => ({ time: `10:${i}`, assets: { 'ETH': 2000 + Math.random() * 10 } })),
  positionHistory: []
};
const MOCK_WALLET: WalletState = { balances: { 'ETH': 10, 'BTC': 0.5, 'SOL': 100, 'USDC': 10000 }, network: 'Sepolia (Demo)' };
const MOCK_PROFILE: CreditProfile = { score: 750, riskTier: 'LOW', maxLtvBoost: 0.05 };

export const useDemoStore = create<AppState>((set, get) => ({
  market: { assets: {}, priceHistory: [], positionHistory: [] },
  position: { collateralAsset: 'ETH', collateralAmount: 0, loanAmount: 0, entryPrice: 0, liquidationPrice: 0, healthFactor: 0, status: 'NONE' },
  walletBalance: { balances: {}, network: 'Sepolia' },
  creditProfile: { score: 750, riskTier: 'LOW', maxLtvBoost: 0.05 },

  fetchData: async () => {
    if (IS_DEMO_MODE) {
      // Mock state updates
      set(state => ({
        market: state.market.assets['ETH'] ? state.market : MOCK_MARKET, // Keep state if init
        walletBalance: state.walletBalance.balances['ETH'] ? state.walletBalance : MOCK_WALLET,
        creditProfile: MOCK_PROFILE
      }));
      return;
    }
    try {
      const [marketRes, walletRes, posRes, creditRes] = await Promise.all([
        fetch(`${API_URL}/market`),
        fetch(`${API_URL}/wallet`),
        fetch(`${API_URL}/position`),
        fetch(`${API_URL}/credit-profile`)
      ]);

      if (marketRes.ok && walletRes.ok && posRes.ok && creditRes.ok) {
        set({
          market: await marketRes.json(),
          walletBalance: await walletRes.json(),
          position: await posRes.json(),
          creditProfile: await creditRes.json()
        });
      }
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
  },

  depositAndBorrow: async (asset, amount) => {
    if (IS_DEMO_MODE) {
      alert("Interactive Deposit is disabled in Vercel Demo Mode. Download Desktop App for full engine.");
      return;
    }
    try {
      await fetch(`${API_URL}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset, amount })
      });
      await get().fetchData();
    } catch (e) {
      console.error(e);
      alert("Deposit failed");
    }
  },

  repayPosition: async () => {
    if (IS_DEMO_MODE) return;
    try {
      await fetch(`${API_URL}/repay`, { method: 'POST' });
      await get().fetchData();
    } catch (e) {
      console.error(e);
    }
  },

  resetPosition: async () => {
    if (IS_DEMO_MODE) return;
    await fetch(`${API_URL}/reset`, { method: 'POST' });
    await get().fetchData();
  },

  triggerScenario: async (scenario) => {
    if (IS_DEMO_MODE) {
      alert("Simulations require Python backend. Please download the Desktop App.");
      return;
    }
    await fetch(`${API_URL}/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario })
    });
    await get().fetchData();
  },

  executeFlashLoan: async (asset, amount, direction) => {
    if (IS_DEMO_MODE) {
      return { success: true, message: "Demo Mode: Logic executed (simulated)" };
    }
    try {
      const res = await fetch(`${API_URL}/flash-loan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset, amount, direction })
      });
      const data = await res.json();
      await get().fetchData();
      return {
        success: data.status === 'success',
        message: data.status === 'success' ? `Profit: $${data.profit.toFixed(4)}` : `Failed. Loss: $${Math.abs(data.profit).toFixed(4)}`
      };
    } catch (e) {
      return { success: false, message: "Network Error" };
    }
  },

  simulateArbStrategy: async (asset, amount, direction) => {
    if (IS_DEMO_MODE) {
      return { success: true, message: "✅ Profit: $500.00 (Demo Mode)" };
    }
    try {
      const res = await fetch(`${API_URL}/simulate-arb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset, amount, direction })
      });
      const data = await res.json();
      return {
        success: data.success,
        message: data.message
      };
    } catch (e) {
      return { success: false, message: "Simulation Error" };
    }
  }
}));