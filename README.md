# EdgeLend

**EdgeLend is an institutional-grade DeFi terminal that combines live Chainlink data with a high-speed simulation engine to demonstrate complex lending and arbitrage strategies in real-time.**

EdgeLend offers a "Bloomberg-style" experience for monitoring positions, health factors, and liquidations in real-time, bridging the gap between complex on-chain protocols and professional trading workstations.

## 🌟 Key Features

*   **Professional UI**: A dense, data-rich interface built with **React & Tailwind**, modeled after institutional financial terminals (Dark mode, monospaced typography, cryptic aesthetics).
*   **Real-Time Monitoring**: Instant visualization of Loan-to-Value (LTV), Health Factor, and PnL.
*   **"Wizard of Oz" Engine**: A hybrid Python/FastAPI backend that simulates high-frequency blockchain execution events (like liquidations) instantly for demo purposes.
*   **Live Oracle Integration**: Powered by **Chainlink Data Feeds** on Sepolia Testnet, ensuring the market data is real even while execution is simulated.
*   **Flashbots Simulation Mode**: A risk-free environment to simulate arbitrage strategies off-chain, calculating potential profit or loss without spending real gas.

## 🚀 Novelty

EdgeLend solves the "demo problem" in DeFi hackathons. instead of waiting for block confirmations or slow testnet faucets, EdgeLend uses a **simulation layer** driven by **real-world on-chain data**.

This allows us to demonstrate complex scenarios—like a market crash triggering an auto-liquidation—instantly and deterministically, while still proving the integration of live Chainlink Oracles. It provides the **speed of a simulation** with the **integrity of on-chain data**.
