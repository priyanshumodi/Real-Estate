const asyncHandler = require("../utils/asyncHandler");
const { ApiError, success } = require("../utils/apiResponse");
const Project = require("../models/Project");

// Agency only. Agents never create/edit projects.
const createProject = asyncHandler(async (req, res) => {
  const { name, developer, location, description, totalUnits, basePrice, purchasePrice } = req.body;
  if (!name) throw new ApiError(400, "Project name is required");
  if (!developer) throw new ApiError(400, "Developer is required — pick an existing one or add a new one");

  const project = await Project.create({
    agencyId: req.user._id,
    name,
    developer,
    location,
    description,
    totalUnits: totalUnits || 0,
    availableUnits: totalUnits || 0,
    basePrice: basePrice || 0,
    purchasePrice: purchasePrice || 0,
  });

  return success(res, 201, "Project created", project);
});

// Both roles can view projects belonging to their agency (agent's agencyId = their agency's own id)
const listProjects = asyncHandler(async (req, res) => {
  const agencyId = req.user.role === "agency" ? req.user._id : req.user.agencyId;
  const { search, status, page = 1, limit = 20 } = req.query;

  const filter = { agencyId, isDeleted: false };
  if (status) filter.status = status;
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  const [projects, total] = await Promise.all([
    Project.find(filter).populate("developer", "name phone email").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Project.countDocuments(filter),
  ]);

  return success(res, 200, "Projects fetched", projects, {
    total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit),
  });
});

const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, isDeleted: false }).populate("developer");
  if (!project) throw new ApiError(404, "Project not found");
  return success(res, 200, "Project fetched", project);
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, agencyId: req.user._id, isDeleted: false },
    req.body,
    { new: true, runValidators: true }
  );
  if (!project) throw new ApiError(404, "Project not found");
  return success(res, 200, "Project updated", project);
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, agencyId: req.user._id },
    { isDeleted: true },
    { new: true }
  );
  if (!project) throw new ApiError(404, "Project not found");
  return success(res, 200, "Project deleted", null);
});

module.exports = { createProject, listProjects, getProject, updateProject, deleteProject };