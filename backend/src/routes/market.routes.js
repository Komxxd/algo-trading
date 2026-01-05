const express = require("express");
const router = express.Router();
const marketService = require("../services/market.service");

router.get("/ltp", async (req, res) => {
  try {
    const { exchange, tradingsymbol, symboltoken } = req.query;

    if (!exchange || !symboltoken) {
      return res.status(400).json({
        success: false,
        message: "exchange, tradingsymbol and symboltoken are required",
      });
    }

    const ltp = await marketService.getLTP({
      exchange,
      symboltoken,
    });

    res.json({ success: true, data: ltp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
