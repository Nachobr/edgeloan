from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Literal, Dict
from enum import Enum
import asyncio
import random
from datetime import datetime
from web3 import Web3

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. State Management (In-Memory) ---

class Asset(BaseModel):
    symbol: str
    name: str
    price: float
    ltv: float
    liquidation_threshold: float

# Initial Assets
ASSETS = {
    'ETH': Asset(symbol='ETH', name='Ethereum', price=2000.0, ltv=0.80, liquidation_threshold=0.85),
    'BTC': Asset(symbol='BTC', name='Bitcoin', price=60000.0, ltv=0.75, liquidation_threshold=0.80),
    'SOL': Asset(symbol='SOL', name='Solana', price=100.0, ltv=0.60, liquidation_threshold=0.65),
    'USDC': Asset(symbol='USDC', name='USD Coin', price=1.0, ltv=0.90, liquidation_threshold=0.95),
}

class MarketState:
    assets: Dict[str, Asset] = ASSETS
    price_history: List[dict] = [] # { time: str, assets: { 'ETH': 2000, 'BTC': 60000 ... } }
    position_history: List[dict] = [] # [{ date: str, collateral: str, pnl: float, result: str }]

class PositionState:
    collateral_asset: str = 'ETH'
    collateral_amount: float = 0.0
    loan_amount: float = 0.0 # Always in USDC
    entry_price: float = 0.0
    liquidation_price: float = 0.0
    health_factor: float = 0.0
    status: Literal['ACTIVE', 'LIQUIDATED', 'CLOSED', 'NONE'] = 'NONE'
    realized_pnl: float = 0.0

class WalletState:
    balances: Dict[str, float] = {
        'ETH': 10.0,
        'BTC': 0.5,
        'SOL': 100.0,
        'USDC': 10000.0
    }
    reputation_score: int = 750 # AI Credit Score (300-900)
    risk_tier: Literal['LOW', 'MEDIUM', 'HIGH'] = 'LOW'
    network: str = 'Sepolia'

# Global State
market = MarketState()
position = PositionState()
wallet = WalletState()

# --- Helpers ---

def update_credit_score(action: Literal['REPAY', 'LIQUIDATE', 'FLASH_LOAN']):
    global wallet
    if action == 'REPAY':
        wallet.reputation_score = min(900, wallet.reputation_score + 15)
    elif action == 'LIQUIDATE':
        wallet.reputation_score = max(300, wallet.reputation_score - 50)
    elif action == 'FLASH_LOAN':
        wallet.reputation_score = min(900, wallet.reputation_score + 5)
    
    # Update Risk Tier
    if wallet.reputation_score >= 800:
        wallet.risk_tier = 'LOW'
    elif wallet.reputation_score >= 600:
        wallet.risk_tier = 'MEDIUM'
    else:
        wallet.risk_tier = 'HIGH'

def calculate_health_factor(collateral_amount: float, loan_amount: float, price: float, threshold: float) -> float:
    if loan_amount == 0:
        return 999.0
    collateral_value = collateral_amount * price
    # HF = (Collateral * LiquidationThreshold) / Loan
    # Note: Traditional Aave HF formula
    return (collateral_value * threshold) / loan_amount

def close_position_logic(price: float, reason: Literal['LIQUIDATED', 'CLOSED']):
    global position, wallet
    
    if position.status != 'ACTIVE':
        return

    pnl = 0.0
    returned_usdc = 0.0
    
    asset_symbol = position.collateral_asset

    if reason == 'CLOSED':
        collateral_value = position.collateral_amount * price
        # Sell Collateral, Pay Debt, Keep Remainder
        returned_usdc = collateral_value - position.loan_amount
        pnl = (price - position.entry_price) * position.collateral_amount
        update_credit_score('REPAY')
    else:
        # Liquidation
        returned_usdc = 0.0 # Simplified: You lose it all in this demo
        pnl = -(position.collateral_amount * position.entry_price)
        update_credit_score('LIQUIDATE')

    # Update Wallet (Return remainder in USDC for simplicity of demo)
    wallet.balances['USDC'] += returned_usdc
    
    # SAVE TO HISTORY
    market.position_history.insert(0, {
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "collateral": asset_symbol,
        "amount": position.collateral_amount,
        "pnl": pnl,
        "result": reason
    })
    
    # Update Position Status
    position.status = reason
    position.health_factor = 0.0 if reason == 'LIQUIDATED' else 999.0
    position.realized_pnl = pnl
    
    print(f"Backend: Position closed. Reason: {reason}, PnL: {pnl}")

# --- Models (Matching TypeScript Interfaces) ---

class CreditProfileResponse(BaseModel):
    score: int
    riskTier: str
    maxLtvBoost: float # e.g. 0.05 for High Rep

class FlashLoanRequest(BaseModel):
    asset: str
    amount: float
    direction: Literal['LONG', 'SHORT']

class FlashLoanResponse(BaseModel):
    status: str
    profit: float
    newBalance: float

class PositionResponse(BaseModel):
    collateralAsset: str
    collateralAmount: float
    loanAmount: float
    entryPrice: float
    liquidationPrice: float
    healthFactor: float
    status: str
    realizedPnL: Optional[float] = 0.0

class MarketResponse(BaseModel):
    assets: Dict[str, Asset]
    priceHistory: List[dict]
    positionHistory: List[dict]

class WalletResponse(BaseModel):
    balances: Dict[str, float]
    network: str

class DepositRequest(BaseModel):
    asset: str
    amount: float
    targetLtv: Optional[float] = 0.50

class ScenarioRequest(BaseModel):
    scenario: str

class SimulateArbRequest(BaseModel):
    asset: str
    amount: float
    direction: Literal['LONG', 'SHORT']

class SimulateArbResponse(BaseModel):
    success: bool
    message: str
    gasSaved: Optional[float] = None
    profit: Optional[float] = None

# --- 4. Live Oracle Logic (Chainlink Sepolia) ---

# Chainlink Setup (Ethereum Sepolia Testnet)
RPC_URL = "https://rpc.ankr.com/eth_sepolia/b6034d8a1a6efc9ee7e09a3a16edf37a266ac1998874467e7606aee8b9ab2842"
CHAINLINK_AGGREGATOR_ADDRESS = "0x694AA1769357215DE4FAC081bf1f309aDC325306" # ETH/USD on Sepolia
CHAINLINK_ABI = '[{"inputs":[],"name":"latestRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"}]'

w3 = Web3(Web3.HTTPProvider(RPC_URL))
price_feed_contract = w3.eth.contract(address=CHAINLINK_AGGREGATOR_ADDRESS, abi=CHAINLINK_ABI)

@app.on_event("startup")
async def startup_event():
    # Initialize history
    for i in range(20):
        market.price_history.append({
            "time": f"{10+i}:00",
            "assets": {k: v.price for k, v in market.assets.items()}
        })
    asyncio.create_task(run_oracle_loop())

async def run_oracle_loop():
    print(f"Backend: Starting Oracle Loop via RPC: {RPC_URL}")
    while True:
        try:
            # 1. Fetch ETH Price from Chainlink (Real)
            latest_data = await asyncio.to_thread(price_feed_contract.functions.latestRoundData().call)
            eth_price = float(latest_data[1]) / 100_000_000
            
            # 2. Simulate other assets based on ETH correlation
            # We don't have Chainlink addresses for BTC/SOL in this demo snippet, 
            # so we correlate them to ETH movement for realism.
            
            # Logic: If price override is active (Scenario), use that. Else use Real.
            if market.assets['ETH'].price not in [4200.0, 800.0]:
                market.assets['ETH'].price = eth_price
                
                # Correlate BTC (approx 30x ETH) and SOL (approx 0.05x ETH)
                market.assets['BTC'].price = eth_price * 15.5 + (random.random() * 100)
                market.assets['SOL'].price = eth_price * 0.05 + (random.random() * 0.5)

            # Update History
            timestamp = datetime.now().strftime("%H:%M:%S")
            market.price_history.append({
                "time": timestamp, 
                "assets": {k: v.price for k, v in market.assets.items()}
            })
            if len(market.price_history) > 50:
                market.price_history.pop(0)

            # 3. Check Liquidation
            if position.status == 'ACTIVE':
                current_p = market.assets[position.collateral_asset].price
                threshold = market.assets[position.collateral_asset].liquidation_threshold
                hf = calculate_health_factor(position.collateral_amount, position.loan_amount, current_p, threshold)
                position.health_factor = hf
                
                if hf < 1.0: # Hard liquidation at HF < 1.0
                    print(f"Backend: Liquidation Triggered! HF: {hf}")
                    close_position_logic(current_p, 'LIQUIDATED')
            
            print(f"Backend: Price Update -> ETH: ${market.assets['ETH'].price:.2f}")
                    
        except Exception as e:
            print(f"Backend: Oracle Error: {e}")
            
        await asyncio.sleep(10)

# --- Endpoints ---

@app.get("/api/market", response_model=MarketResponse)
def get_market():
    # Flatten history for the specific chart requirement if needed, 
    # but for now returning full structure
    return {
        "assets": market.assets,
        "priceHistory": market.price_history,
        "positionHistory": market.position_history
    }

@app.get("/api/wallet", response_model=WalletResponse)
def get_wallet():
    return {
        "balances": wallet.balances,
        "network": wallet.network
    }

@app.get("/api/credit-profile", response_model=CreditProfileResponse)
def get_credit_profile():
    # Boost: Low risk gets 5% LTV boost
    boost = 0.05 if wallet.risk_tier == 'LOW' else 0.02 if wallet.risk_tier == 'MEDIUM' else 0.0
    return {
        "score": wallet.reputation_score,
        "riskTier": wallet.risk_tier,
        "maxLtvBoost": boost
    }

@app.get("/api/position", response_model=PositionResponse)
def get_position():
    return {
        "collateralAsset": position.collateral_asset,
        "collateralAmount": position.collateral_amount,
        "loanAmount": position.loan_amount,
        "entryPrice": position.entry_price,
        "liquidationPrice": position.liquidation_price,
        "healthFactor": position.health_factor,
        "status": position.status,
        "realizedPnL": position.realized_pnl
    }

@app.post("/api/deposit")
def deposit(request: DepositRequest):
    asset_sym = request.asset
    amount = request.amount
    
    if asset_sym not in wallet.balances or wallet.balances[asset_sym] < amount:
         raise HTTPException(status_code=400, detail=f"Insufficient {asset_sym} balance")
    
    asset_data = market.assets[asset_sym]
    current_price = asset_data.price
    
    # Lock Collateral
    wallet.balances[asset_sym] -= amount
    
    # Calculate Loan with Credit Boost
    # Calculate Loan with Credit Boost (Max Limit)
    base_max_ltv = asset_data.ltv
    credit_boost = 0.05 if wallet.risk_tier == 'LOW' else 0.0
    max_ltv = base_max_ltv + credit_boost
    
    # Use requested LTV (default 0.50), capped at Max LTV
    final_ltv = min(request.targetLtv, max_ltv)
    
    loan_value = (amount * current_price) * final_ltv
    wallet.balances['USDC'] += loan_value
    
    # Create Position
    position.collateral_asset = asset_sym
    position.collateral_amount = amount
    position.loan_amount = loan_value
    position.entry_price = current_price
    
    # LP = (Loan) / (Collateral * Threshold)
    if amount > 0:
        position.liquidation_price = loan_value / (amount * asset_data.liquidation_threshold)
    else: 
        position.liquidation_price = 0
        
    position.health_factor = 2.0
    position.status = 'ACTIVE'
    position.realized_pnl = 0.0
    
    return {"status": "success", "loanAmount": loan_value}

@app.post("/api/repay")
def repay():
    if position.status != 'ACTIVE':
        raise HTTPException(status_code=400, detail="No position")
    current_price = market.assets[position.collateral_asset].price
    close_position_logic(current_price, 'CLOSED')
    return {"status": "success"}

@app.post("/api/flash-loan")
def flash_loan(request: FlashLoanRequest):
    # Simulate an arbitrage: Borrow -> Trade -> Repay
    # Simple logic: 80% chance of profit, 20% fail
    
    success = random.random() > 0.2
    
    if success:
        profit = request.amount * 0.005 # 0.5% profit
        wallet.balances[request.asset] += profit
        update_credit_score('FLASH_LOAN')
        
        market.position_history.insert(0, {
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "collateral": request.asset,
            "amount": request.amount,
            "pnl": profit,
            "result": "FLASH_LOAN"
        })

        return {
            "status": "success", 
            "profit": profit, 
            "newBalance": wallet.balances[request.asset]
        }
    else:
        # Failure: You lose gas fees (simulated as small amount)
        loss = request.amount * 0.001
        wallet.balances[request.asset] -= loss
        
        market.position_history.insert(0, {
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "collateral": request.asset,
            "amount": request.amount,
            "pnl": -loss,
            "result": "FLASH_LOAN"
        })

        return {
            "status": "failed", 
            "profit": -loss, 
            "newBalance": wallet.balances[request.asset]
        }

@app.post("/api/reset")
def reset():
    wallet.balances = {'ETH': 10.0, 'BTC': 0.5, 'SOL': 100.0, 'USDC': 10000.0}
    wallet.reputation_score = 750
    wallet.risk_tier = 'LOW'
    
    position.collateral_amount = 0.0
    position.loan_amount = 0.0
    position.status = 'NONE'
    position.realized_pnl = 0.0
    
    market.assets['ETH'].price = 2000.0
    
    return {"status": "reset_complete"}

@app.post("/api/scenario")
def trigger_scenario(request: ScenarioRequest):
    scenario = request.scenario
    if scenario == 'DOUBLE_PRICE':
        market.assets['ETH'].price = 4200.0
    elif scenario == 'CRASH_LIQUIDATION':
        market.assets['ETH'].price = 800.0
    elif scenario == 'NORMAL':
        market.assets['ETH'].price = 2000.0
    return {"status": "ok"}

@app.post("/api/simulate-arb")
def simulate_arb(request: SimulateArbRequest):
    # Simulation Logic (Flashbots Style)
    # 50% change of failing (reverting) which saves gas
    # 50% chance of success with profit
    
    success = random.random() > 0.5
    
    if success:
        # Profitable arb
        profit = request.amount * 0.02 # 2% profit
        return {
            "success": True,
            "message": f"✅ Profit: ${profit:,.2f}",
            "profit": profit
        }
    else:
        # Reverted txn
        gas_saved = 45.20 + (random.random() * 10)
        return {
            "success": False,
            "message": f"❌ Reverted (Gas Saved: ${gas_saved:.2f})",
            "gasSaved": gas_saved
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
