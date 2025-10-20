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

// 🔍 Middleware: automatically exclude inactive customers
customerSchema.pre(/^find/, function (next) {
  // `this` refers to the current query
  this.find({ isActive: { $ne: false } });
  next();
});

const Customer = mongoose.model("Customer", customerSchema);
module.exports = Customer;
