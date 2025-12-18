const mongoose = require("mongoose");

const regionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A region must have a name"],
      unique: true,
      trim: true,
      maxlength: [100, "Region name must be less than 100 characters"],
    },
    code: {
      type: String,
      required: [true, "A region must have a unique code"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      default: "Saudi Arabia",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Region = mongoose.model("Region", regionSchema);
module.exports = Region;
