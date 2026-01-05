const smartApi = require("../config/smartapi");

async function getProfile(){
    return await smartApi.getProfile();
}

async function getRMS(){
    return await smartApi.getRMS();
}

module.exports = {
    getProfile,
    getRMS,
};