const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  createBooking, listBookings, getBooking, updateBookingStatus, recordInstallmentPayment,
} = require("../controllers/bookingController");

const router = express.Router();

router.use(protect);
router.get("/", listBookings);
router.get("/:id", getBooking);
router.post("/", authorize("agency"), createBooking);
router.patch("/:id/status", authorize("agency"), updateBookingStatus);
router.post("/:id/pay-installment", authorize("agency"), recordInstallmentPayment);

module.exports = router;