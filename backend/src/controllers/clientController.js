const asyncHandler = require("../utils/asyncHandler");
const { ApiError, success } = require("../utils/apiResponse");
const Client = require("../models/Client");

const scopedAgencyId = (user) => (user.role === "agency" ? user._id : user.agencyId);

const listClients = asyncHandler(async (req, res) => {
  const agencyId = scopedAgencyId(req.user);
  const { search, page = 1, limit = 20 } = req.query;

  const filter = { agencyId, isDeleted: false };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [clients, total] = await Promise.all([
    Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Client.countDocuments(filter),
  ]);

  return success(res, 200, "Clients fetched", clients, {
    total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit),
  });
});

const getClient = asyncHandler(async (req, res) => {
  const agencyId = scopedAgencyId(req.user);
  const client = await Client.findOne({ _id: req.params.id, agencyId, isDeleted: false })
    .populate("lead", "status project")
    .populate("documents.uploadedBy", "name");
  if (!client) throw new ApiError(404, "Client not found");
  return success(res, 200, "Client fetched", client);
});

// Agency only — edit profile fields
const updateClient = asyncHandler(async (req, res) => {
  const { name, email, phone, address } = req.body;
  const client = await Client.findOneAndUpdate(
    { _id: req.params.id, agencyId: req.user._id, isDeleted: false },
    { name, email, phone, address },
    { new: true, runValidators: true }
  );
  if (!client) throw new ApiError(404, "Client not found");
  return success(res, 200, "Client updated", client);
});

// Both roles — attach a document (Cloudinary URL comes from the frontend upload step)
const addDocument = asyncHandler(async (req, res) => {
  const { name, url } = req.body;
  if (!name || !url) throw new ApiError(400, "name and url are required");

  const agencyId = scopedAgencyId(req.user);
  const client = await Client.findOne({ _id: req.params.id, agencyId, isDeleted: false });
  if (!client) throw new ApiError(404, "Client not found");

  client.documents.push({ name, url, uploadedBy: req.user._id });
  await client.save();

  return success(res, 201, "Document added", client);
});

module.exports = { listClients, getClient, updateClient, addDocument };