import React from 'react';
import { CreditProfile } from '../types';

interface CreditScorePanelProps {
    profile: CreditProfile;
}

export const CreditScorePanel: React.FC<CreditScorePanelProps> = ({ profile }) => {
    const { score, riskTier, maxLtvBoost } = profile;

    // Calculate gauge rotation (300 to 900 score range)
    // 300 -> -90deg, 900 -> 90deg
    const percentage = Math.min(100, Math.max(0, (score - 300) / (900 - 300) * 100));

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'LOW': return 'text-terminal-green';
            case 'MEDIUM': return 'text-terminal-accent';
            case 'HIGH': return 'text-terminal-red';
            default: return 'text-gray-500';
        }
    };

    return (
        <div className="h-full bg-terminal-panel border border-terminal-border p-4 rounded-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-2 left-2 text-xs text-gray-500 font-mono">
                AI_CREDIT_ENGINE_V2
            </div>

            {/* Hexagon / Gauge Visual */}
            <div className="relative w-48 h-24 mb-4 overflow-hidden">
                <div className="absolute bottom-0 w-full h-full border-t-[20px] border-terminal-border rounded-t-full"></div>
                <div
                    className="absolute bottom-0 w-full h-full border-t-[20px] border-terminal-green rounded-t-full origin-bottom transition-all duration-1000 ease-out"
                    style={{ transform: `rotate(${(percentage * 1.8) - 180}deg)` }}
                ></div>
                <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 text-4xl font-mono font-bold text-white">
                    {score}
                </div>
            </div>

            <div className="text-center space-y-2">
                <div className="text-sm text-gray-400">RISK TIER</div>
                <div className={`text-2xl font-bold font-mono tracking-widest ${getTierColor(riskTier)}`}>
                    {riskTier}_RISK
                </div>
                <div className="mt-4 p-2 border border-terminal-border bg-black/50 text-xs text-gray-300">
                    LTV BOOST ACTIVE: <span className="text-terminal-accent">+{(maxLtvBoost * 100).toFixed(0)}%</span>
                </div>
            </div>

            <div className="absolute bottom-2 w-full px-4 flex justify-between text-[10px] text-gray-600 font-mono">
                <span>300 (REKT)</span>
                <span>900 (WHALE)</span>
            </div>
        </div>
    );
};
