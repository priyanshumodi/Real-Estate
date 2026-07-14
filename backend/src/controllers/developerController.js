const asyncHandler = require("../utils/asyncHandler");
const { ApiError, success } = require("../utils/apiResponse");
const Developer = require("../models/Developer");

const scopedAgencyId = (user) => (user.role === "agency" ? user._id : user.agencyId);

const createDeveloper = asyncHandler(async (req, res) => {
  const { name, contactPerson, phone, email } = req.body;
  if (!name) throw new ApiError(400, "Developer name is required");

  const existing = await Developer.findOne({ agencyId: req.user._id, name, isDeleted: false })
    .collation({ locale: "en", strength: 2 });
  if (existing) throw new ApiError(409, "A developer with this name already exists — use that one instead");

  const developer = await Developer.create({ agencyId: req.user._id, name, contactPerson, phone, email });
  return success(res, 201, "Developer added", developer);
});

const listDevelopers = asyncHandler(async (req, res) => {
  const agencyId = scopedAgencyId(req.user);
  const developers = await Developer.find({ agencyId, isDeleted: false }).sort({ name: 1 });
  return success(res, 200, "Developers fetched", developers);
});

module.exports = { createDeveloper, listDevelopers };