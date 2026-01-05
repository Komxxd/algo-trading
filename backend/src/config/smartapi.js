const smartapi = require("smartapi-javascript");

const smartApi = new smartapi.SmartAPI({
  api_key: process.env.SMARTAPI_API_KEY,
});


module.exports = smartApi;
