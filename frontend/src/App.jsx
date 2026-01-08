import { useState } from "react";
import { loginBackend, searchInstruments, getLTP } from "./api";
import OptionChain from "./OptionChain";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searchType, setSearchType] = useState("EQUITY");
  const [ltp, setLtp] = useState(null);
  const [showOptionChain, setShowOptionChain] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function normalizeUnderlying(inst) {
    if (inst.name === "NIFTY") return "NIFTY";
    if (inst.name === "NIFTY BANK") return "BANKNIFTY";
    if (inst.name === "Nifty Bank") return "BANKNIFTY";
    return inst.name;
  }

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      const res = await loginBackend();
      console.log("LOGIN RESPONSE:", res);

      if (res.success) {
        setLoggedIn(true);
        setError(null);
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError("Login error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const exchange =
        searchType === "OPTIONS" || searchType === "FUTURES"
          ? "NFO"
          : "NSE";

      const res = await searchInstruments({
        query,
        exchange,
        type: searchType,
      });

      setResults(res.data || []);
      if ((res.data || []).length === 0) {
        setError("No instruments found");
      }
    } catch (err) {
      setError("Search error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(inst) {
    setSelected(inst);
    setLtp(null);
    setLoading(true);
    setError(null);
    
    try {
      const res = await getLTP({
        exchange: inst.exch_seg,
        tradingsymbol: inst.symbol,
        symboltoken: inst.token,
      });

      const fetched = res.data?.data?.fetched;

      if (fetched && fetched.length > 0) {
        const row = fetched[0];
        if (typeof row.ltp === "number") {
          setLtp(row.ltp);
        } else {
          setError("Unexpected LTP format");
        }
      }
    } catch (err) {
      setError("Failed to fetch LTP: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Algo Trading Platform</h1>
        <div style={styles.loginSection}>
          <button
            onClick={handleLogin}
            disabled={loading || loggedIn}
            style={{
              ...styles.button,
              ...(loggedIn ? styles.buttonSuccess : {}),
            }}
          >
            {loggedIn ? "✓ Connected" : "Login Backend"}
          </button>
          {loggedIn && (
            <span style={styles.statusBadge}>Session Active</span>
          )}
        </div>
      </div>

      {error && (
        <div style={styles.errorBox}>
          {error}
        </div>
      )}

      <div style={styles.searchSection}>
        <div style={styles.searchControls}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search instruments..."
            style={styles.searchInput}
            disabled={loading}
          />
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            style={styles.select}
            disabled={loading}
          >
            <option value="EQUITY">Stocks</option>
            <option value="INDEX">Index</option>
          </select>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            style={styles.button}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {results.length > 0 && (
          <div style={styles.resultsCard}>
            <h3 style={styles.resultsHeader}>
              Results ({results.length})
            </h3>
            <div style={styles.resultsList}>
              {results.map((r) => (
                <div
                  key={r.token}
                  onClick={() => handleSelect(r)}
                  style={{
                    ...styles.resultItem,
                    ...(selected?.token === r.token
                      ? styles.resultItemSelected
                      : {}),
                  }}
                >
                  <div style={styles.resultSymbol}>{r.symbol}</div>
                  <div style={styles.resultMeta}>
                    {r.name && <span>{r.name}</span>}
                    <span style={styles.resultExchange}>{r.exch_seg}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div style={styles.selectedCard}>
          <div style={styles.selectedHeader}>
            <h2>{selected.symbol}</h2>
            {selected.name && (
              <span style={styles.selectedName}>{selected.name}</span>
            )}
          </div>
          {ltp !== null && (
            <div style={styles.ltpDisplay}>
              <span style={styles.ltpLabel}>Last Traded Price</span>
              <span style={styles.ltpValue}>₹{ltp.toLocaleString("en-IN")}</span>
            </div>
          )}
          {loading && ltp === null && (
            <div style={styles.loadingText}>Loading price...</div>
          )}
          <button
            onClick={() => setShowOptionChain(!showOptionChain)}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            {showOptionChain ? "Hide" : "View"} Option Chain
          </button>
        </div>
      )}

      {showOptionChain && selected && (
        <OptionChain symbol={normalizeUnderlying(selected)} />
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
    paddingBottom: "1.5rem",
    borderBottom: "2px solid #e5e7eb",
  },
  loginSection: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  statusBadge: {
    padding: "0.375rem 0.75rem",
    backgroundColor: "#d1fae5",
    color: "#065f46",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: "500",
  },
  errorBox: {
    padding: "0.875rem 1rem",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    borderRadius: "6px",
    marginBottom: "1.5rem",
    border: "1px solid #fecaca",
  },
  searchSection: {
    marginBottom: "2rem",
  },
  searchControls: {
    display: "flex",
    gap: "0.75rem",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
  },
  searchInput: {
    flex: "1",
    minWidth: "200px",
  },
  select: {
    minWidth: "120px",
  },
  button: {
    padding: "0.625rem 1.25rem",
  },
  buttonSuccess: {
    backgroundColor: "#10b981",
    cursor: "default",
  },
  buttonSuccessHover: {
    backgroundColor: "#10b981",
  },
  secondaryButton: {
    backgroundColor: "#6b7280",
    marginTop: "1rem",
  },
  resultsCard: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "1.5rem",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  resultsHeader: {
    marginBottom: "1rem",
    fontSize: "1.125rem",
    color: "#374151",
  },
  resultsList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    maxHeight: "400px",
    overflowY: "auto",
  },
  resultItem: {
    padding: "0.875rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "1px solid #e5e7eb",
  },
  resultItemSelected: {
    backgroundColor: "#eef2ff",
    borderColor: "#4f46e5",
  },
  resultSymbol: {
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "0.25rem",
  },
  resultMeta: {
    display: "flex",
    gap: "0.75rem",
    fontSize: "0.875rem",
    color: "#6b7280",
  },
  resultExchange: {
    padding: "0.125rem 0.5rem",
    backgroundColor: "#f3f4f6",
    borderRadius: "4px",
    fontWeight: "500",
  },
  selectedCard: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  selectedHeader: {
    marginBottom: "1rem",
  },
  selectedName: {
    display: "block",
    fontSize: "0.875rem",
    color: "#6b7280",
    marginTop: "0.25rem",
  },
  ltpDisplay: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    padding: "1rem",
    backgroundColor: "#f9fafb",
    borderRadius: "6px",
    marginBottom: "1rem",
  },
  ltpLabel: {
    fontSize: "0.875rem",
    color: "#6b7280",
    fontWeight: "500",
  },
  ltpValue: {
    fontSize: "1.75rem",
    fontWeight: "700",
    color: "#059669",
  },
  loadingText: {
    color: "#6b7280",
    fontStyle: "italic",
    marginBottom: "1rem",
  },
};

export default App;
