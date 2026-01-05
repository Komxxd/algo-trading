const fs = require("fs");
const path = require("path");

const INSTRUMENT_PATH = path.join(__dirname, "../data/instruments.json");

let instruments = [];
let loaded = false;

function loadInstruments() {
  if (loaded) return;

  const raw = fs.readFileSync(INSTRUMENT_PATH, "utf-8");
  instruments = JSON.parse(raw);
  loaded = true;

  console.log("Instrument file path:", INSTRUMENT_PATH);
  console.log("Total instruments loaded:", instruments.length);
  console.log("Sample instrument:", instruments[0]);
}


function searchInstruments({ query, exchange, type }) {
  loadInstruments();

  return instruments.filter((inst) => {
    // ---- text search (symbol + name) ----
    const text = `${inst.symbol || ""} ${inst.name || ""}`.toLowerCase();
    if (query && !text.includes(query.toLowerCase())) {
      return false;
    }

    // ---- exchange filter ----
    if (exchange && inst.exch_seg !== exchange) {
      return false;
    }

    // ---- type filter ----
    if (type === "EQUITY") {
      return (
        inst.instrumenttype === "AMXSTK" ||
        inst.instrumenttype === "AMXIDX" ||
        inst.instrumenttype === "INDEX" ||
        inst.instrumenttype === ""
      );
    }

    if (type === "FUTURES") {
      return inst.instrumenttype === "FUTSTK" ||
             inst.instrumenttype === "FUTIDX";
    }

    if (type === "OPTIONS") {
      return inst.instrumenttype === "OPTSTK" ||
             inst.instrumenttype === "OPTIDX";
    }

    return true;
  }).slice(0, 50);
}


module.exports = { searchInstruments };
