const asyncHandler = require("../utils/asyncHandler");
const { ApiError, success } = require("../utils/apiResponse");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken.js");
const User = require("../models/User");

/**
 * @route   POST /api/v1/auth/register-agency
 * @desc    Create a new Agency account (top-level tenant)
 * @access  Public (in production this may be gated/invite-only)
 */
const registerAgency = asyncHandler(async (req, res) => {
  const { name, email, password, phone, signupCode } = req.body;

  if (signupCode !== process.env.AGENCY_SIGNUP_SECRET) {
    throw new ApiError(403, "Invalid signup code. Agency accounts are provisioned by Estately onboarding.");
  }

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, "Email already registered");
  }

  const agency = await User.create({
    name,
    email,
    password,
    phone,
    role: "agency",
  });

  const accessToken = generateAccessToken(agency);
  const refreshToken = generateRefreshToken(agency);

  return success(res, 201, "Agency registered successfully", {
    user: sanitizeUser(agency),
    accessToken,
    refreshToken,
  });
});

/**
 * @route   POST /api/v1/auth/agents
 * @desc    Agency creates a new Agent under itself
 * @access  Private (agency only)
 */
const createAgent = asyncHandler(async (req, res) => {
  const { name, email, password, phone, allowedIP, commissionRate } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, "Email already registered");
  }

  const agent = await User.create({
    name,
    email,
    password,
    phone,
    allowedIP,
    role: "agent",
    commissionRate: commissionRate || 0,
    agencyId: req.user._id, // the logged-in Agency
  });

  return success(res, 201, "Agent created successfully", sanitizeUser(agent));
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login for both Agency and Agent
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email, isDeleted: false }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Account is deactivated. Contact your agency admin.");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return success(res, 200, "Login successful", {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  });
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get currently logged-in user
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  return success(res, 200, "Current user fetched", sanitizeUser(req.user));
});

/**
 * @route   GET /api/v1/auth/agents
 * @desc    Agency lists its own agents (for assigning leads)
 * @access  Private (agency only)
 */
const listAgents = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;

  const filter = { role: "agent", agencyId: req.user._id, isDeleted: false };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [agents, total] = await Promise.all([
    User.find(filter)
      .select("name email phone isActive commissionRate")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  return success(res, 200, "Agents fetched", agents, {
    total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) || 1,
  });
});

/**
 * @route   PATCH /api/v1/auth/agents/:id
 * @desc    Agency edits one of its own agents
 * @access  Private (agency only)
 */
const updateAgent = asyncHandler(async (req, res) => {
  const { name, phone, allowedIP, isActive, commissionRate } = req.body;

  const agent = await User.findOneAndUpdate(
    { _id: req.params.id, role: "agent", agencyId: req.user._id, isDeleted: false },
    { name, phone, allowedIP, isActive, commissionRate },
    { new: true, runValidators: true }
  );
  if (!agent) throw new ApiError(404, "Agent not found");

  return success(res, 200, "Agent updated", sanitizeUser(agent));
});

/**
 * @route   DELETE /api/v1/auth/agents/:id
 * @desc    Agency soft-deletes one of its own agents
 * @access  Private (agency only)
 */
const deleteAgent = asyncHandler(async (req, res) => {
  const agent = await User.findOneAndUpdate(
    { _id: req.params.id, role: "agent", agencyId: req.user._id },
    { isDeleted: true, isActive: false },
    { new: true }
  );
  if (!agent) throw new ApiError(404, "Agent not found");

  return success(res, 200, "Agent deleted", null);
});

// Strip sensitive/internal fields before sending to client
const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  agencyId: user.agencyId,
  phone: user.phone,
  isActive: user.isActive,
  commissionRate: user.commissionRate,
});

module.exports = { registerAgency, createAgent, login, getMe, listAgents, updateAgent, deleteAgent };