const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "User must have a name"],
    trim: true,
  },
  username: {
    type: String,
    required: [true, "Please tell us your name!"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ["CM", "BM", "ENG", "VXR"],
    default: "ENG",
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
  },
  isActive: {
    type: Boolean,
    default: true,
    select: false,
  },
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Region",
    required: [true, "User must belong to a region"],
  },
}, {timestamps : true});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ isActive: { $ne: false } }).populate("region", "name code createdAt");
  next();
});

userSchema.methods.correctPassword = async function (candidate, stored) {
  return await bcrypt.compare(candidate, stored);
};

userSchema.pre(/^find/, function (next) {
  this.find({ isActive: { $ne: false } });
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
