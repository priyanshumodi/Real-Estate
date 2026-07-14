const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { createDeveloper, listDevelopers } = require("../controllers/developerController");

const router = express.Router();
router.use(protect);
router.get("/", listDevelopers);
router.post("/", authorize("agency"), createDeveloper);

module.exports = router;