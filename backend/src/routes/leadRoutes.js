const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  createLead, listLeads, getLead, updateStatus, assignAgent, addCommunication, addFollowUp, addVisitStep,
  listFollowUps, performFollowUp, bulkImportLeads, bulkAssignLeads,
} = require("../controllers/leadController");

const router = express.Router();

router.use(protect);
router.get("/followups", listFollowUps);
router.get("/", listLeads);
router.get("/:id", getLead);
router.post("/", authorize("agency"), createLead);
router.post("/bulk-import", authorize("agency"), bulkImportLeads);
router.patch("/bulk-assign", authorize("agency"), bulkAssignLeads);
router.patch("/:id/status", updateStatus);
router.patch("/:id/assign", authorize("agency"), assignAgent);
router.post("/:id/communication", addCommunication);
router.post("/:id/followup", addFollowUp);
router.patch("/:id/followup/:followUpId/perform", performFollowUp);
router.post("/:id/visit", addVisitStep);

module.exports = router;