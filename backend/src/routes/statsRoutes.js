const express = require("express");
const { protect } = require("../middleware/auth");
const { getDashboardStats } = require("../controllers/statsController");

const router = express.Router();
router.use(protect);
router.get("/dashboard", getDashboardStats);

module.exports = router;