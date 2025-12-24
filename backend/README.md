# EdgeLend - Python Backend (Simulated Blockchain)

This is a **Python FastAPI** backend that acts as a "Wizard of Oz" simulation for the EdgeLend dApp. It replaces the client-side simulation logic with a real REST API that mocks blockchain behavior (Oracles, Liquidations, Wallet interaction).

## Prerequisites

- Python 3.8+
- `pip`

## Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```

2.  Create and activate a virtual environment:
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Running the Server

Start the server using `uvicorn`:

```bash
```bash
# Option 1: Run from Root Directory (Recommended)
uvicorn backend.main:app --reload --port 8000

# Option 2: Run from Backend Directory
cd backend
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

## API Endpoints

-   `GET /api/market`: Get current price and history.
-   `GET /api/wallet`: Get mock wallet balance.
-   `GET /api/position`: Get current user position.
-   `POST /api/deposit`: Deposit ETH to open a position.
-   `POST /api/repay`: Repay loan and close position.
-   `POST /api/reset`: Reset simulation state.
-   `POST /api/scenario`: Trigger scenarios (`DOUBLE_PRICE`, `CRASH_LIQUIDATION`).

## Simulation Logic

-   **Oracle**: Uses **Chainlink ETH/USD Feed** (Mainnet) to fetch live real-world prices via a public RPC. Updates every ~10 seconds.
-   **Liquidations**: If `Health Factor < 1.5`, the position is liquidated automatically during the next oracle update.
-   **State**: All state is stored in-memory and resets when the server restarts (or via `/api/reset`).
