const express = require("express");
const { registerAgency, createAgent, login, getMe, listAgents, updateAgent, deleteAgent } = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/register-agency", registerAgency);
router.post("/login", login);
router.get("/me", protect, getMe);

// Only a logged-in Agency can manage Agents under itself
router.post("/agents", protect, authorize("agency"), createAgent);
router.get("/agents", protect, authorize("agency"), listAgents);
router.patch("/agents/:id", protect, authorize("agency"), updateAgent);
router.delete("/agents/:id", protect, authorize("agency"), deleteAgent);

module.exports = router;