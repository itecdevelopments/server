const RmaForm = require("./rma.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getAllRmas = catchAsync(async (req, res, next) => {
  const { user } = req;

  const filter = {};
  if (user.role === "BM") {
    filter.region = user.region;
  } else if (!["CM", "VXR"].includes(user.role)) {
    return next(new AppError("Not authorized", 403));
  }

  const rmas = await RmaForm.find(filter)
    .populate("Customer", "name")
    .populate("region", "name")
    .populate("engineer", "username")
    .populate("serviceReport", "SerialReportNumber Date");

  res.status(200).json({
    status: "success",
    count: rmas.length,
    data: rmas,
  });
});

exports.getRma = catchAsync(async (req, res, next) => {
  const { user } = req;

  const r = await RmaForm.findById(req.params.id)
    .populate("Customer", "name")
    .populate("region", "name")
    .populate("engineer", "username name")
    .populate("serviceReport", "SerialReportNumber Date Model SerialNumber");

  if (!r) return next(new AppError("RMA not found", 404));

  if (user.role === "BM" && r.region._id.toString() !== user.region._id.toString()) {
    return next(new AppError("Not allowed", 403));
  }

  res.status(200).json({ status: "success", data: r });
});

exports.updateRma = catchAsync(async (req, res, next) => {
  // BLOCK auto fields from being updated
  const forbidden = ["Customer", "region", "engineer", "serviceReport"];
  forbidden.forEach((f) => delete req.body[f]);

  // VALIDATION FOR REQUIRED FIELDS
  const requiredFields = [
    "RmaNo", "Date", "EngineerName", "AddressLocation",
    "MachineModelNo", "MachineSerialNo", "InkSolvent", "HeadSerialNo",
    "InstallationDate", "JetRunningHours", "Environment",
    "FaultyItemPartNo", "PartDescription", "FaultCode", "ItemSerialOld",
    "ItemSerialNew", "DetailedFaultDescription",
    "ItecInvoiceNo", "WorkOrderNo", "FaultyItemReceivedDate",
    "ApprovedBy", "ApprovedSignature", "ReceivedBy", "ReceivedSignature",
    "EngineerSignature", "status",
  ];

  const missing = requiredFields.filter((f) => {
    const val = req.body[f];
    return !val || String(val).trim() === "";
  });

  if (missing.length > 0) {
    return next(
      new AppError(
        `Missing required fields: ${missing.join(", ")}`,
        400
      )
    );
  }

  const rma = await RmaForm.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    context: "query",
  });

  if (!rma) return next(new AppError("RMA not found", 404));

  res.status(200).json({ status: "success", data: rma });
});


