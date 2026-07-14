const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  createProject, listProjects, getProject, updateProject, deleteProject, updateUnitPrice, bulkAddUnits,
} = require("../controllers/projectController");

const router = express.Router();

router.use(protect);
router.get("/", listProjects);
router.get("/:id", getProject);
router.post("/", authorize("agency"), createProject);
router.patch("/:id", authorize("agency"), updateProject);
router.patch("/:id/units/:unitId", authorize("agency"), updateUnitPrice);
router.post("/:id/units/bulk", authorize("agency"), bulkAddUnits);
router.delete("/:id", authorize("agency"), deleteProject);

module.exports = router;