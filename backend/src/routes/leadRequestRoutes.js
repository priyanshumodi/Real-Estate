const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  createLeadRequest, listMyRequests, listRequests, acceptRequest, rejectRequest, cancelRequest,
} = require("../controllers/leadRequestController");

const router = express.Router();

router.use(protect);
router.post("/", authorize("agent"), createLeadRequest);
router.get("/mine", authorize("agent"), listMyRequests);
router.delete("/:id", authorize("agent"), cancelRequest);
router.get("/", authorize("agency"), listRequests);
router.patch("/:id/accept", authorize("agency"), acceptRequest);
router.patch("/:id/reject", authorize("agency"), rejectRequest);

module.exports = router;