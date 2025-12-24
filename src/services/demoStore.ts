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

const API_URL = 'http://localhost:8000/api';

export const useDemoStore = create<AppState>((set, get) => ({
  market: { assets: {}, priceHistory: [], positionHistory: [] },
  position: {
    collateralAsset: 'ETH',
    collateralAmount: 0,
    loanAmount: 0,
    entryPrice: 0,
    liquidationPrice: 0,
    healthFactor: 0,
    status: 'NONE'
  },
  walletBalance: { balances: {}, network: 'Sepolia' },
  creditProfile: { score: 750, riskTier: 'LOW', maxLtvBoost: 0.05 },

  fetchData: async () => {
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
    try {
      await fetch(`${API_URL}/repay`, { method: 'POST' });
      await get().fetchData();
    } catch (e) {
      console.error(e);
    }
  },

  resetPosition: async () => {
    await fetch(`${API_URL}/reset`, { method: 'POST' });
    await get().fetchData();
  },

  triggerScenario: async (scenario) => {
    await fetch(`${API_URL}/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario })
    });
    await get().fetchData();
  },

  executeFlashLoan: async (asset, amount, direction) => {
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