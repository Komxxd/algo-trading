import { useEffect, useState, useRef } from "react";
import { getOptionChain, initSocket, subscribeToTokens } from "./api";

function OptionChain({ symbol, spotPrice }) {
  const [chain, setChain] = useState(null);
  const [expiry, setExpiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [optionPrices, setOptionPrices] = useState({});
  const rowRefs = useRef({});

  // Calculate ATM Strike
  const atmStrike = chain && spotPrice ? chain.chain.reduce((prev, curr) => {
    return (Math.abs(curr.strike - spotPrice) < Math.abs(prev.strike - spotPrice) ? curr : prev);
  }).strike : null;

  // Scroll to ATM on load
  useEffect(() => {
    if (atmStrike && rowRefs.current[atmStrike]) {
      rowRefs.current[atmStrike].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [atmStrike, loading]);

  useEffect(() => {
    if (!symbol) return;

    async function fetchChain() {
      setLoading(true);
      setError(null);
      setOptionPrices({}); // Reset prices on new fetch

      try {
        const res = await getOptionChain({
          symbol,
          exchange: "NFO",
          expiry,
        });

        if (res.success) {
          setChain(res.data);

          // Collect tokens to subscribe
          const tokens = [];
          if (res.data.chain) {
            res.data.chain.forEach(row => {
              if (row.CE) tokens.push(row.CE.token);
              if (row.PE) tokens.push(row.PE.token);
            });
          }

          if (tokens.length > 0) {
            // Subscribe to NFO tokens (Exchange Type 2)
            await subscribeToTokens({
              exchangeType: 2, // NFO
              tokens: tokens
            });

            // Add listener
            const socket = initSocket();
            const handleTick = (data) => {
              const token = data.token?.replace(/"/g, '');
              const rawPrice = Number(data.last_traded_price || data.ltp);

              if (token && !isNaN(rawPrice)) {
                setOptionPrices(prev => ({
                  ...prev,
                  [token]: rawPrice / 100 // Convert Paise to Rupees
                }));
              }
            };

            socket.on("tick", handleTick);

            // Cleanup listener when component unmounts or chain changes
            return () => {
              socket.off("tick", handleTick);
            };
          }

        } else {
          setError("Failed to load option chain");
        }
      } catch (err) {
        setError("Error: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    const cleanup = fetchChain();
    return () => {
      // cleanup promise if needed
    };
  }, [symbol, expiry]);

  // Separate effect for listener (double safety for updates)
  useEffect(() => {
    if (!chain) return;

    const socket = initSocket();
    const handleTick = (data) => {
      const token = data.token?.replace(/"/g, '');
      const rawPrice = Number(data.last_traded_price || data.ltp);

      if (token && !isNaN(rawPrice)) {
        setOptionPrices(prev => ({
          ...prev,
          [token]: rawPrice / 100
        }));
      }
    };

    socket.on("tick", handleTick);
    return () => {
      socket.off("tick", handleTick);
    };
  }, [chain]);


  if (loading) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 mt-6 flex justify-center items-center">
        <div className="flex flex-col items-center gap-3 animate-pulse text-zinc-500">
          <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin"></div>
          <span className="font-medium text-sm">Loading option chain...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-8 mt-6 text-center">
        <div className="text-red-400 font-medium mb-1">Failed to load data</div>
        <div className="text-red-500/70 text-sm">{error}</div>
      </div>
    );
  }

  if (!chain || !chain.chain || chain.chain.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 mt-6 text-center">
        <div className="text-zinc-500 italic">No option chain data available for this instrument.</div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-zinc-800 pb-4 mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Option Chain</h3>
          <div className="flex gap-3 items-center text-sm">
            <span className="font-bold text-zinc-300">{chain.underlying}</span>

            {chain.expiries && chain.expiries.length > 0 ? (
              <select
                value={expiry || chain.expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="bg-zinc-800 text-zinc-300 text-xs border border-zinc-700 rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer"
              >
                {chain.expiries.map((exp) => (
                  <option key={exp} value={exp}>{exp}</option>
                ))}
              </select>
            ) : (
              <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs border border-zinc-700 font-mono">
                Exp: {chain.expiry}
              </span>
            )}

            {spotPrice && (
              <span className="ml-2 text-xs text-zinc-500">Spot: <span className="text-white font-mono">{spotPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs text-zinc-500 font-medium uppercase tracking-wide">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Calls
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Puts
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 opacity-50"></span> ATM
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 max-h-[600px] custom-scrollbar relative">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-zinc-900 text-zinc-400 text-xs uppercase tracking-wider font-medium shadow-sm">
              <th className="p-3 text-center border-b border-zinc-800 w-[35%]" colSpan={2}>CALLS (CE)</th>
              <th className="p-3 text-center border-b border-zinc-800 w-[30%] bg-zinc-900 border-x border-zinc-800">STRIKE</th>
              <th className="p-3 text-center border-b border-zinc-800 w-[35%]" colSpan={2}>PUTS (PE)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {chain.chain.map((row) => {
              const isATM = row.strike === atmStrike;

              return (
                <tr
                  key={row.strike}
                  ref={el => rowRefs.current[row.strike] = el}
                  className={`group transition-all ${isATM ? 'bg-blue-500/10 hover:bg-blue-500/20' : 'hover:bg-zinc-900/30'}`}
                >
                  {/* CE Data */}
                  <td className={`p-3 text-center transition-colors ${isATM ? '' : 'bg-emerald-500/[0.02] group-hover:bg-emerald-500/[0.05]'}`}>
                    {row.CE ? (
                      <div className="flex flex-col items-center">
                        <span className={`font-mono font-medium cursor-pointer hover:underline transition-colors ${isATM ? 'text-white' : 'text-emerald-400 hover:text-emerald-300'}`}>
                          {row.CE.symbol.split(chain.underlying)[1] || 'CE'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-700 text-lg select-none">-</span>
                    )}
                  </td>
                  <td className={`p-3 text-right text-emerald-500 w-24 border-r border-zinc-800/50 font-mono font-medium ${isATM ? '' : 'bg-emerald-500/[0.02] group-hover:bg-emerald-500/[0.05]'}`}>
                    {row.CE && optionPrices[row.CE.token] ? (
                      `₹${optionPrices[row.CE.token].toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    ) : (
                      <span className="text-zinc-700 text-xs">---</span>
                    )}
                  </td>

                  {/* Strike */}
                  <td className={`p-3 text-center border-x border-zinc-800 font-mono font-bold text-base transition-colors cursor-pointer select-none relative ${isATM ? 'text-blue-400 bg-blue-500/10' : 'text-zinc-100 bg-zinc-900 group-hover:bg-zinc-800'}`}>
                    {isATM && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r"></div>
                    )}
                    {row.strike}
                    {isATM && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-l"></div>
                    )}
                  </td>

                  {/* PE Data */}
                  <td className={`p-3 text-left w-24 border-l border-zinc-800/50 font-mono font-medium text-red-500 ${isATM ? '' : 'bg-red-500/[0.02] group-hover:bg-red-500/[0.05]'}`}>
                    {row.PE && optionPrices[row.PE.token] ? (
                      `₹${optionPrices[row.PE.token].toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    ) : (
                      <span className="text-zinc-700 text-xs">---</span>
                    )}
                  </td>
                  <td className={`p-3 text-center transition-colors ${isATM ? '' : 'bg-red-500/[0.02] group-hover:bg-red-500/[0.05]'}`}>
                    {row.PE ? (
                      <div className="flex flex-col items-center">
                        <span className={`font-mono font-medium cursor-pointer hover:underline transition-colors ${isATM ? 'text-white' : 'text-red-400 hover:text-red-300'}`}>
                          {row.PE.symbol.split(chain.underlying)[1] || 'PE'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-700 text-lg select-none">-</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OptionChain;
