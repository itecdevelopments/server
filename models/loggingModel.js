const mongoose = require("mongoose");

const loggingSchema = new mongoose.Schema({
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now() },
  routeDes: { type: String, required: true },
});

const Logging = mongoose.model("Logging", loggingSchema);

model.exports = Logging;
// GET /api/v1/customers 200 224.820 ms - 525
