const mongoose = require("mongoose");

const spareSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A spare must have a name"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "A spare must have a code"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    isActive : {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const Spare = mongoose.model("Spare", spareSchema);
module.exports = Spare;
