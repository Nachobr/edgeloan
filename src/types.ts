export interface Asset {
  symbol: string;
  name: string;
  price: number;
  ltv: number;
  liquidation_threshold: number;
}

export interface Position {
  collateralAsset: string;
  collateralAmount: number;
  loanAmount: number;
  entryPrice: number;
  liquidationPrice: number;
  healthFactor: number;
  status: 'ACTIVE' | 'LIQUIDATED' | 'CLOSED' | 'NONE';
  realizedPnL?: number;
}

export interface PositionHistoryItem {
  date: string;
  collateral: string;
  amount: number;
  pnl: number;
  result: 'CLOSED' | 'LIQUIDATED' | 'FLASH_LOAN';
}

export interface MarketState {
  assets: Record<string, Asset>;
  priceHistory: { time: string; assets: Record<string, number> }[];
  positionHistory: PositionHistoryItem[];
}

export interface WalletState {
  balances: Record<string, number>;
  network: string;
}

export interface CreditProfile {
  score: number;
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
  maxLtvBoost: number;
}

export interface FlashLoanResult {
  status: string;
  profit: number;
  newBalance: number;
}

export enum DemoScenario {
  NORMAL = 'NORMAL',
  DOUBLE_PRICE = 'DOUBLE_PRICE',
  CRASH_LIQUIDATION = 'CRASH_LIQUIDATION',
}