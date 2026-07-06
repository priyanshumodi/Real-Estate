const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  createProject, listProjects, getProject, updateProject, deleteProject,
} = require("../controllers/projectController");

const router = express.Router();

router.use(protect);
router.get("/", listProjects);
router.get("/:id", getProject);
router.post("/", authorize("agency"), createProject);
router.patch("/:id", authorize("agency"), updateProject);
router.delete("/:id", authorize("agency"), deleteProject);

module.exports = router;