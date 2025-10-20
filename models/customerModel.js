const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer must have a name"],
      trim: true,
    },
    customerId: {
      type: String,
      unique: true,
      index: true,
    },
    region: {
      type: mongoose.Schema.ObjectId,
      ref: "Region",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Customer = mongoose.model("Customer", customerSchema);
module.exports = Customer;
