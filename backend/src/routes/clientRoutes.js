const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { listClients, getClient, updateClient, addDocument } = require("../controllers/clientController");

const router = express.Router();

router.use(protect);
router.get("/", listClients);
router.get("/:id", getClient);
router.patch("/:id", authorize("agency"), updateClient);
router.post("/:id/documents", addDocument);

module.exports = router;