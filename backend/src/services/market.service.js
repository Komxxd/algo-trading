const smartApi = require("../config/smartapi");

async function getLTP({ exchange, symboltoken }) {
  return await smartApi.marketData({
    mode: "LTP",
    exchangeTokens: {
      [exchange]: [symboltoken],
    },
  });
}

module.exports = {
  getLTP,
};
