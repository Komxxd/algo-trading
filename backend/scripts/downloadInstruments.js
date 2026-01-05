const downloadInstrumentMaster = require("../src/utils/downloadInstruments");

(async () => {
  try {
    console.log("Downloading instrument master...");
    await downloadInstrumentMaster();
    console.log("Instrument master downloaded successfully.");
  } catch (err) {
    console.error("Failed to download instrument master:", err.message);
  }
})();
