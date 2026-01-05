const { SmartAPI } = require("smartapi-javascript");

const smartApi = new SmartAPI({
  api_key: process.env.SMARTAPI_API_KEY,
});

module.exports = smartApi;
