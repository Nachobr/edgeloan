import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract, formatUnits, parseUnits } from 'ethers';
import { CONTRACT_ADDRESSES, LOAN_ABI, ERC20_ABI } from '../abis';
import { Position } from '../types';

export const useBlockchain = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  
  const [realPosition, setRealPosition] = useState<Position>({
    collateralAmount: 0,
    loanAmount: 0,
    entryPrice: 0,
    liquidationPrice: 0,
    healthFactor: 0,
    status: 'NONE',
    realizedPnL: 0
  });

  const [isLoading, setIsLoading] = useState(false);

  // Connect Wallet
  const connectWallet = async () => {
    const ethereum = (window as any).ethereum;
    if (ethereum) {
      try {
        const _provider = new BrowserProvider(ethereum);
        const signer = await _provider.getSigner();
        const _account = await signer.getAddress();
        
        const _contract = new Contract(CONTRACT_ADDRESSES.LOAN_CONTRACT, LOAN_ABI, signer);
        
        setProvider(_provider);
        setAccount(_account);
        setContract(_contract);
        return true;
      } catch (e) {
        console.error("Connection error", e);
        return false;
      }
    } else {
      alert("Please install Metamask!");
      return false;
    }
  };

  // Fetch Data from Blockchain
  const fetchData = useCallback(async () => {
    if (!contract || !account) return;

    try {
      // 1. Get User Data
      const data = await contract.userData(account);
      // data.collateral is in Wei (18 decimals), data.debt is in USDC (6 decimals)
      
      const collateralEth = parseFloat(formatUnits(data.collateral, 18));
      const debtUsdc = parseFloat(formatUnits(data.debt, 6));

      // 2. Get Oracle Price
      const priceRaw = await contract.ethPrice();
      const price = parseFloat(formatUnits(priceRaw, 6));

      if (debtUsdc > 0) {
        // Calculate derived stats
        const hfRaw = await contract.getHealthFactor(account);
        const hf = Number(hfRaw) / 100; // Contract returns e.g. 150 for 1.5
        
        // Liquidation Price = Debt * 1.5 / Collateral
        const liqPrice = (debtUsdc * 1.5) / collateralEth;

        setRealPosition({
          collateralAmount: collateralEth,
          loanAmount: debtUsdc,
          entryPrice: price, // Approximate for MVP
          liquidationPrice: liqPrice,
          healthFactor: hf,
          status: hf < 1.5 ? 'LIQUIDATED' : 'ACTIVE',
          realizedPnL: 0
        });
      } else {
        setRealPosition(prev => ({ ...prev, status: 'NONE' }));
      }

    } catch (e) {
      console.error("Fetch data error", e);
    }
  }, [contract, account]);

  // Poll for updates
  useEffect(() => {
    if (contract) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [contract, fetchData]);

  // Actions
  const depositAndBorrowReal = async (collateralEth: number) => {
    if (!contract) return;
    setIsLoading(true);
    try {
      // Calculate borrow amount (50% LTV) based on CURRENT contract price
      // Ideally we fetch price first, but for MVP we assume 50% logic matches
      const priceRaw = await contract.ethPrice();
      const price = parseFloat(formatUnits(priceRaw, 6));
      const borrowAmountUSD = (collateralEth * price) * 0.5;
      
      const tx = await contract.depositAndBorrow(
        parseUnits(borrowAmountUSD.toFixed(6), 6), 
        { value: parseUnits(collateralEth.toString(), 18) }
      );
      await tx.wait();
      await fetchData();
    } catch (e) {
      console.error("Tx Error", e);
      alert("Transaction Failed. Check console.");
    } finally {
      setIsLoading(false);
    }
  };

  const repayReal = async () => {
    if (!contract) return;
    alert("Repay functionality not fully implemented in UI for Realnet MVP. Use block explorer.");
  };

  return {
    account,
    connectWallet,
    realPosition,
    depositAndBorrowReal,
    repayReal,
    isLoading
  };
};