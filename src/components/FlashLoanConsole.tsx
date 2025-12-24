import React, { useState } from 'react';
import { useDemoStore } from '../services/demoStore';
import { Asset, WalletState } from '../types';

interface FlashLoanConsoleProps {
    wallet: WalletState;
    assets: Record<string, Asset>;
}

export const FlashLoanConsole: React.FC<FlashLoanConsoleProps> = ({ wallet, assets }) => {
    const { executeFlashLoan, simulateArbStrategy } = useDemoStore();
    const [selectedAsset, setSelectedAsset] = useState<string>('ETH');
    const [amount, setAmount] = useState<number>(10);
    const [logs, setLogs] = useState<string[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);

    const handleExecute = async () => {
        setIsExecuting(true);
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`[${timestamp}] Initiating Flash Loan request...`, ...prev]);

        const result = await executeFlashLoan(selectedAsset, amount, 'LONG');

        setLogs(prev => [
            `[${timestamp}] Result: ${result.message}`,
            ...prev
        ]);
        setIsExecuting(false);
    };

    const handleSimulate = async () => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`[${timestamp}] Simulating Strat...`, ...prev]);

        const result = await simulateArbStrategy(selectedAsset, amount, 'LONG');

        setLogs(prev => [
            `[${timestamp}] Simulation: ${result.message}`,
            ...prev
        ]);
    };

    return (
        <div className="h-full flex flex-col gap-4 bg-terminal-panel border border-terminal-border p-4 rounded-sm">
            <div className="flex justify-between items-center border-b border-terminal-border pb-2">
                <h3 className="font-mono font-bold text-terminal-accent">FLASH_LOAN_CONSOLE</h3>
                <span className="text-xs text-gray-500">PROTOCOL: AAVE_V3_SIM</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-500 block mb-1">ASSET</label>
                    <select
                        value={selectedAsset}
                        onChange={(e) => setSelectedAsset(e.target.value)}
                        className="w-full bg-black border border-terminal-border p-2 text-sm font-mono focus:border-terminal-accent outline-none"
                    >
                        {Object.keys(assets).map(sym => (
                            <option key={sym} value={sym}>{sym}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-gray-500 block mb-1">AMOUNT</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full bg-black border border-terminal-border p-2 text-sm font-mono focus:border-terminal-accent outline-none"
                    />
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={handleSimulate}
                    disabled={isExecuting}
                    className="flex-1 py-3 font-mono font-bold text-yellow-500 border border-yellow-500/50 hover:bg-yellow-500/10 transition-colors"
                >
                    SIMULATE ARB STRATEGY
                </button>
                <button
                    onClick={handleExecute}
                    disabled={isExecuting}
                    className={`flex-1 py-3 font-mono font-bold text-black transition-colors ${isExecuting ? 'bg-gray-500' : 'bg-terminal-green hover:bg-white'}`}
                >
                    {isExecuting ? 'EXECUTING BLOCK...' : 'EXECUTE REAL TX'}
                </button>
            </div>

            <div className="flex-grow bg-black border border-terminal-border p-2 font-mono text-xs overflow-y-auto">
                {logs.length === 0 ? <span className="text-gray-600">No logs...Ready for execution.</span> : logs.map((log, i) => (
                    <div key={i} className={`mb-1 ${log.includes('Failed') ? 'text-terminal-red' : 'text-terminal-green'}`}>
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
};
