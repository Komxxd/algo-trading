const express = require("express");
const router = express.Router();
const userService = require("../services/user.service");

router.get("/profile", async (req, res) => {
  try {
    const profile = await userService.getProfile();
    res.json({
      success: true,
      data: profile,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.get("/rms", async (req, res) => {
    try {
        const rms = await userService.getRMS();
        res.json({
            success: true,
            data: rms,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
});

module.exports = router;