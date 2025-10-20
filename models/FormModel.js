/**
 * Service Report Model (with defaults)
 * -------------------------------------
 * Adds default "-" for optional string fields.
 */

const mongoose = require("mongoose");

/* ----------------------- Helper: Format Date for KSA ----------------------- */
const getKsaTimeFormatted = () => {
  const now = new Date();
  const options = {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  const formatted = new Intl.DateTimeFormat("en-CA", options).format(now);
  return formatted.replace(",", "");
};

/* ----------------------------- Define Schema ------------------------------- */
const ServiceReportSchema = new mongoose.Schema(
  {
    SerialReportNumber: { type: String, required: true, trim: true },
    Date: { type: String, required: true },

    Customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    timeIn: { type: String, required: true },
    timeOut: { type: String, required: true },
    Quotation: { type: String, required: true },
    PurchaseOrder: { type: String, required: true },
    Inventory: { type: String, required: true },

    MachineType: {
      type: String,
      required: true,
      enum: ["CIJ", "LASER", "TTO", "PALLET", "TAPPING", "SCALE", "OTHER", ""],
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
      type: String,
      default: "-",
      required: function () {
        return this.MachineType === "TTO";
      },
    },

    powerONtime: {
      type: String,
      default: "-",
      required: function () {
        return this.MachineType === "CIJ";
      },
    },

    JetRunningTime: {
      type: String,
      default: "-",
      required: function () {
        return this.MachineType === "CIJ";
      },
    },

    ServiceDueDate: { type: Date, default: null },

    INKtype: {
      type: String,
      default: "-",
      required: function () {
        return this.MachineType === "CIJ";
      },
    },
    SolventType: {
      type: String,
      default: "-",
      required: function () {
        return this.MachineType === "CIJ";
      },
    },

    Model: { type: String, required: true },
    SerialNumber: { type: String, required: true },

    ServiceType: {
      type: String,
      required: true,
      enum: [
        "NEW_INSTALLATION",
        "DEMO",
        "SERVICE_CALL",
        "AMC",
        "WARRANTY",
        "FILTERS_REPLACMENT",
        "OTHER",
        "",
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

    spare: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Spare",
        required: true,
      },
    ],

    customerPhoneNumber: { type: String, required: true },
    customerdesignation: { type: String, required: true },
    concernName: { type: String, required: true },

    serviceReportPicture: { type: String, required: true },
    deliveryNotePicture: { type: String, required: true },

    dateEntered: {
      type: String,
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
