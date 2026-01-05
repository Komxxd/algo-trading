const { WebSocketV2 } = require("smartapi-javascript");
const authService = require("./auth.service");

let socket = null;
let isConnected = false;

function initMarketSocket() {
  if (socket) return socket;

  const session = authService.getSession();

  socket = new WebSocketV2({
    jwttoken: session.data.jwtToken,
    apikey: process.env.SMARTAPI_API_KEY,
    clientcode: process.env.SMARTAPI_CLIENT_ID,
    feedtype: "market",
  });

  socket.connect().then(() => {
    isConnected = true;
    console.log("Market WebSocket connected");
  });

  socket.on("tick", (data) => {
    // later: broadcast to frontend
    console.log("Tick:", data);
  });

  return socket;
}

function subscribeTokens({ exchangeType, tokens }) {
  if (!socket || !isConnected) {
    throw new Error("Socket not connected");
  }

  const request = {
    correlationID: "live_price",
    action: 1,        // subscribe
    mode: 1,          // LTP
    exchangeType,
    tokens,
  };

  socket.fetchData(request);
}

