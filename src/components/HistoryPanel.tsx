import React from 'react';
import { PositionHistoryItem } from '../types';

interface HistoryPanelProps {
    history: PositionHistoryItem[];
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history }) => {
    if (!history || history.length === 0) {
        return (
            <div className="bg-terminal-panel border border-terminal-border p-4 rounded-sm text-center text-xs text-gray-500 font-mono mt-4">
                NO POSITIONS LOGGED
            </div>
        );
    }

    return (
        <div className="bg-terminal-panel border border-terminal-border p-4 rounded-sm font-mono mt-4 max-h-[200px] overflow-y-auto custom-scrollbar">
            <h3 className="text-gray-400 text-[10px] uppercase tracking-widest mb-2 border-b border-terminal-border pb-1">
                Session History
            </h3>
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-[10px] text-gray-500 border-b border-zinc-800">
                        <th className="pb-1 font-normal">TIME</th>
                        <th className="pb-1 font-normal">ASSET</th>
                        <th className="pb-1 font-normal">AMT</th>
                        <th className="pb-1 font-normal text-right">PnL (USDC)</th>
                    </tr>
                </thead>
                <tbody className="text-xs">
                    {history.map((item, idx) => (
                        <tr key={idx} className="border-b border-zinc-900 last:border-0 hover:bg-zinc-900/50 transition-colors">
                            <td className="py-2 text-gray-400">{item.date.split(' ')[1]}</td>
                            <td className="py-2 text-white">
                                {item.result === 'FLASH_LOAN' && <span className="bg-blue-900/50 text-blue-400 text-[9px] px-1 rounded mr-1">FLASH</span>}
                                {item.collateral}
                            </td>
                            <td className="py-2 text-gray-300">{item.amount.toFixed(2)}</td>
                            <td className={`py-2 text-right font-bold ${item.pnl >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                                {item.pnl >= 0 ? '+' : ''}{item.pnl.toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
