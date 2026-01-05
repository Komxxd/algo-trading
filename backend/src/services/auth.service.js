const smartApi = require("../config/smartapi");
const speakeasy = require("speakeasy");

let sessionData = null;



async function login() {
    const totp = speakeasy.totp({
    secret: process.env.SMARTAPI_TOTP_SECRET,
    encoding: 'base32'
  });

  sessionData = await smartApi.generateSession(
    process.env.SMARTAPI_CLIENT_ID,
    process.env.SMARTAPI_PASSWORD,
    totp
  );

  return sessionData;
}

function getSession() {
  return sessionData;
}

module.exports = {
  login,
  getSession,
};
