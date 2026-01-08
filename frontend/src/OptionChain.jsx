import { useEffect, useState } from "react";
import { getOptionChain } from "./api";

function OptionChain({ symbol }) {
  const [chain, setChain] = useState(null);
  const [expiry, setExpiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol) return;

    async function fetchChain() {
      setLoading(true);
      setError(null);
      try {
        const res = await getOptionChain({
          symbol,
          exchange: "NFO",
          expiry,
        });

        if (res.success) {
          setChain(res.data);
        } else {
          setError("Failed to load option chain");
        }
      } catch (err) {
        setError("Error: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchChain();
  }, [symbol, expiry]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading option chain...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorText}>{error}</div>
      </div>
    );
  }

  if (!chain || !chain.chain || chain.chain.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.errorText}>No option chain data available</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Option Chain</h2>
        <div style={styles.meta}>
          <span style={styles.underlying}>{chain.underlying}</span>
          <span style={styles.expiry}>Expiry: {chain.expiry}</span>
        </div>
      </div>

      <div style={styles.tableWrapper}>
        <table>
          <thead>
            <tr>
              <th style={styles.ceColumn}>Call Options (CE)</th>
              <th style={styles.strikeColumn}>Strike Price</th>
              <th style={styles.peColumn}>Put Options (PE)</th>
            </tr>
          </thead>
          <tbody>
            {chain.chain.map((row) => (
              <tr key={row.strike}>
                <td style={styles.ceColumn}>
                  {row.CE ? (
                    <div style={styles.optionBadge}>
                      <span style={styles.optionType}>CE</span>
                      <span style={styles.optionSymbol}>
                        {row.CE.symbol}
                      </span>
                    </div>
                  ) : (
                    <span style={styles.emptyCell}>-</span>
                  )}
                </td>
                <td style={styles.strikeColumn}>
                  <strong>{row.strike}</strong>
                </td>
                <td style={styles.peColumn}>
                  {row.PE ? (
                    <div style={styles.optionBadge}>
                      <span style={styles.optionType}>PE</span>
                      <span style={styles.optionSymbol}>
                        {row.PE.symbol}
                      </span>
                    </div>
                  ) : (
                    <span style={styles.emptyCell}>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "1.5rem",
    marginTop: "1.5rem",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  header: {
    marginBottom: "1.5rem",
    paddingBottom: "1rem",
    borderBottom: "2px solid #e5e7eb",
  },
  meta: {
    display: "flex",
    gap: "1.5rem",
    marginTop: "0.5rem",
    alignItems: "center",
  },
  underlying: {
    fontSize: "1.125rem",
    fontWeight: "600",
    color: "#1f2937",
  },
  expiry: {
    fontSize: "0.875rem",
    color: "#6b7280",
    padding: "0.25rem 0.75rem",
    backgroundColor: "#f3f4f6",
    borderRadius: "4px",
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "6px",
  },
  ceColumn: {
    width: "40%",
    backgroundColor: "#eff6ff",
  },
  strikeColumn: {
    width: "20%",
    textAlign: "center",
    backgroundColor: "#f9fafb",
    fontWeight: "600",
    color: "#1f2937",
  },
  peColumn: {
    width: "40%",
    backgroundColor: "#fef3c7",
  },
  optionBadge: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  optionType: {
    fontSize: "0.75rem",
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#1f2937",
  },
  optionSymbol: {
    fontSize: "0.8125rem",
    color: "#4b5563",
    fontFamily: "monospace",
  },
  emptyCell: {
    color: "#9ca3af",
    fontStyle: "italic",
  },
  loadingText: {
    textAlign: "center",
    padding: "2rem",
    color: "#6b7280",
  },
  errorText: {
    textAlign: "center",
    padding: "2rem",
    color: "#dc2626",
    backgroundColor: "#fee2e2",
    borderRadius: "6px",
  },
};

export default OptionChain;
