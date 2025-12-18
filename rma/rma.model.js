const mongoose = require("mongoose");
const getKsaTimeFormatted = require("../service_report/utils/getKsaTimeFormatted");

const RmaSchema = new mongoose.Schema(
  {
    RmaNo: { type: String, required: true },
    EngineerName: { type: String, default: "-" },
    Date: { type: Date, required: true, default: getKsaTimeFormatted },
    Customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      immutable: true
    },
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
      required: true,
      immutable: true
    },
    AddressLocation: { type: String, default: "-" },
    MachineModelNo: { type: String, required: true },
    MachineSerialNo: { type: String, required: true },
    InkSolvent: { type: String, default: "-" },
    HeadSerialNo: { type: String, default: "-" },
    InstallationDate: { type: String, default: "-" },
    JetRunningHours: { type: String, default: "-" },
    Environment: { type: String, default: "-" },
    FaultyItemPartNo: { type: String, default: "-" },
    PartDescription: { type: String, default: "-" },
    FaultCode: { type: String, default: "-" },
    ItemSerialOld: { type: String, default: "-" },
    ItemSerialNew: { type: String, default: "-" },
    DetailedFaultDescription: { type: String, default: "-" },
    ItecInvoiceNo: { type: String, default: "-" },
    WorkOrderNo: { type: String, default: "-" },
    engineer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true
    },
    serviceReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceReport",
      required: true,
      unique: true,
      immutable: true
    },
    status: {
      type: String,
      enum: [
        "INCOMPLETE",
        "COMPLETED_WITH_DELIVERY",
        "COMPLETED_WITHOUT_DELIVERY",
      ],
      default: "INCOMPLETE",
    },
    EngineerSignature: { type: String, default: "-" },
    FaultyItemReceivedDate: { type: String, default: "-" },
    ApprovedBy: { type: String, default: "-" },
    ApprovedSignature: { type: String, default: "-" },
    ReceivedBy: { type: String, default: "-" },
    ReceivedSignature: { type: String, default: "-" },
  },
  { timestamps: true, collection: "RMAForms" }
);

module.exports = mongoose.model("RmaForm", RmaSchema);
