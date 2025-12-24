import React from 'react';

export const FAQ: React.FC = () => {
    return (
        <div className="h-full bg-terminal-panel border border-terminal-border p-6 rounded-sm overflow-y-auto font-mono text-gray-300">
            <h2 className="text-terminal-accent text-lg font-bold mb-6 border-b border-terminal-border pb-2">
                {'>'} SYSTEM INFORMATION & FAQ
            </h2>

            <div className="space-y-8">

                {/* Section 1 */}
                <section>
                    <h3 className="text-white font-bold mb-2">1. The Concept (Real World)</h3>
                    <p className="text-xs text-gray-400 mb-2">
                        In a real DeFi flash loan (like on Aave or Uniswap):
                    </p>
                    <ul className="list-disc list-inside text-xs space-y-1 ml-2 text-gray-400">
                        <li>You borrow millions of dollars of crypto instantly <span className="text-white">without collateral</span>.</li>
                        <li>You strictly <span className="text-terminal-red">must pay it back within the same transaction block</span>.</li>
                        <li>If you use that money to spot a price difference (arbitrage), you <span className="text-terminal-green">keep the profit</span>.</li>
                        <li>If you fail to pay it back, the entire transaction reverts as if it never happened (you only lose the "gas" fee).</li>
                    </ul>
                </section>

                {/* Section 2 */}
                <section>
                    <h3 className="text-white font-bold mb-2">2. The Simulation (EdgeLend)</h3>
                    <p className="text-xs text-gray-400 mb-4">
                        When you click <span className="text-terminal-green font-bold">EXECUTE ARBITRAGE STRATEGY</span>, On the kitchen we run a probability engine to simulate searching for these arbitrage opportunities.
                    </p>

                    <div className="bg-black/50 p-4 border border-terminal-border rounded text-xs">
                        <h4 className="text-terminal-accent font-bold mb-2">The Logic:</h4>
                        <ul className="space-y-3">
                            <li className="flex gap-2">
                                <span className="text-gray-500 w-24 shrink-0">Success Rate:</span>
                                <span>There is an <span className="text-white">80% chance</span> the AI "finds" a profitable route.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-gray-500 w-24 shrink-0">Profit Calc:</span>
                                <span>If successful, you earn <span className="text-terminal-green">0.5%</span> of the borrowed amount as pure profit.<br />
                                    <span className="text-gray-600 italic">Example: You borrow 10 ETH. Profit = 0.05 ETH.</span></span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-gray-500 w-24 shrink-0">Failure Risk:</span>
                                <span>There is a <span className="text-terminal-red">20% chance</span> the trade fails (e.g., slippage or front-running).</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-gray-500 w-24 shrink-0">Penalty:</span>
                                <span>You lose a small amount (0.1%) to simulate "Gas Fees" for the failed attempt.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-gray-500 w-24 shrink-0">Boost:</span>
                                <span>Every successful Flash Loan increases your <span className="text-terminal-accent">AI Credit Score (+5 points)</span>, helping you unlock higher LTVs for regular lending!</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Section 3 */}
                <section>
                    <h3 className="text-white font-bold mb-2">3. Simulation vs Real Execution</h3>
                    <p className="text-xs text-gray-400 mb-2">
                        We have added a <span className="text-yellow-500 font-bold">SIMULATE ARB STRATEGY</span> button to help you test strategies risk-free.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-black/30 p-3 border border-yellow-500/30 rounded">
                            <h4 className="text-yellow-500 font-bold text-xs mb-2">SIMULATION MODE</h4>
                            <ul className="list-disc list-inside text-[10px] text-gray-400 space-y-1">
                                <li>Runs off-chain simulation (like Flashbots).</li>
                                <li>Checks if the trade is profitable.</li>
                                <li><strong>No Gas Costs:</strong> If it fails, you pay nothing.</li>
                                <li><strong>Safe:</strong> Doesn't execute on-chain.</li>
                            </ul>
                        </div>
                        <div className="bg-black/30 p-3 border border-terminal-green/30 rounded">
                            <h4 className="text-terminal-green font-bold text-xs mb-2">REAL EXECUTION</h4>
                            <ul className="list-disc list-inside text-[10px] text-gray-400 space-y-1">
                                <li>Submits transaction to the blockchain.</li>
                                <li><strong>Real Profit/Loss:</strong> You earn or lose real assets.</li>
                                <li><strong>Gas Risk:</strong> If it reverts, you still pay gas fees.</li>
                                <li>Updates your Credit Score.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <div className="text-[10px] text-gray-500 pt-4 border-t border-terminal-border text-center">
                    TRY EXPERIMENTING WITH LARGER AMOUNTS—SINCE YOU DON'T NEED COLLATERAL FOR FLASH LOANS, YOU CAN THEORETICALLY BORROW AS MUCH AS THE LIQUIDITY POOL ALLOWS!
                </div>

            </div>
        </div>
    );
};
