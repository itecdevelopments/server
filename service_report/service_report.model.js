const mongoose = require("mongoose");
const getKsaTimeFormatted = require("./utils/getKsaTimeFormatted");
/* ----------------------------- Define Schema ------------------------------- */
const ServiceReportSchema = new mongoose.Schema(
  {
    SerialReportNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    Customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    RMA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RmaForm",
      default: null,
    },
    InkSolventType: {
      type: String,
      required: true,
      enum: [
        "1240/1512",
        "1240/1505",
        "1014/1505",
        "3203/3703",
        "1070/1560",
        "1243/1512",
        "1016/1506",
        "1059/1505",
        "1079/1505",
      ],
    },
    timeIn: { type: Date, required: true },
    timeOut:
    {
      type: Date,
      default: getKsaTimeFormatted,
      required: true
    },
    Quotation: { type: String, required: true },
    PurchaseOrder: { type: String, required: true },
    Inventory: { type: String, required: true },
    MachineType: {
      type: String,
      required: true,
      enum: ["CIJ", "LASER", "TTO", "PALLET", "TAPPING", "SCALE", "OTHER"],
      set: (v) => v?.toUpperCase(),
    },
    otherMachineType: {
      type: String,
      default: "-",
      required: function () {
        return this.MachineType === "OTHER";
      },
    },
    headLife: {
      type: Number,
      default: 0,
      required: function () {
        return this.MachineType === "TTO";
      },
    },
    powerONtime: {
      type: Number,
      default: 0,
      required: function () {
        return this.MachineType === "CIJ";
      },
    },
    JetRunningTime: {
      type: Number,
      default: 0,
      required: function () {
        return this.MachineType === "CIJ";
      },
    },
    ServiceDueDate: { type: Date, default: null },
    Model: { type: String, required: true },
    SerialNumber: { type: String, required: true },
    ServiceType: {
      type: String,
      required: true,
      enum: [
        "NEW_INSTALLATION",
        "DEMO",
        "SERVICE_CALL",
        "SERVICE_CALL_NO_SPARES",
        "AMC",
        "WARRANTY",
        "FILTERS_REPLACMENT",
        "OTHER"
      ],
    },
    otherServiceType: {
      type: String,
      default: "-",
      required: function () {
        return this.ServiceType === "OTHER";
      },
    },
    Unicode: {
      type: String,
      default: "-",
      required: function () {
        return this.ServiceType === "NEW_INSTALLATION";
      },
    },
    Configurationcode: {
      type: String,
      default: "-",
      required: function () {
        return this.ServiceType === "NEW_INSTALLATION";
      },
    },
    description: { type: String, trim: true, default: "-" },
    JobCompleted: {
      type: String,
      required: true,
      enum: ["yes", "no"],
    },
    JobcompleteReason: {
      type: String,
      default: "-",
      required: function () {
        return this.JobCompleted === "no";
      },
    },
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
      required: true,
    },
    engineerName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    spare: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Spare",
        }
      ],
      validate: {
        validator: function (arr) {
          if (this.ServiceType === "SERVICE_CALL_NO_SPARES") {
            return arr.length === 0;
          }
          return arr.length > 0;
        },
        message:
          "Spare parts must be empty only for SERVICE_CALL_NO_SPARES, otherwise at least one spare is required.",
      },
    },
    customerPhoneNumber: { type: String, required: true },
    customerdesignation: { type: String, required: true },
    concernName: { type: String, required: true },
    serviceReportPicture: { type: String, required: true },
    deliveryNotePicture: { type: String, required: true },
    dateEntered: {
      type: Date,
      default: getKsaTimeFormatted,
    },
  },
  {
    timestamps: true,
    collection: "ServiceReports",
  }
);
/* ------------------------------- Export Model ------------------------------ */
module.exports = mongoose.model("ServiceReport", ServiceReportSchema);
