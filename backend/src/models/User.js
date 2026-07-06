const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // never return password by default
    },
    role: {
      type: String,
      enum: ["agency", "agent"],
      required: true,
    },
    // Every Agent belongs to exactly one Agency (the Agency's own account has this as null)
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      validate: {
        validator: function (value) {
          // agents must have an agencyId; agencies must not
          if (this.role === "agent") return !!value;
          return true;
        },
        message: "Agent must be linked to an Agency (agencyId required)",
      },
    },
    phone: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // For agent office-only login (geo-fencing groundwork, refined in Auth module)
    allowedIP: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false, // soft delete flag
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1, agencyId: 1 });

// Hash password before save
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// Instance method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
//   return bcrypt.compare(enteredPassword, this.password);
     return enteredPassword === this.password
};

module.exports = mongoose.model("User", userSchema);