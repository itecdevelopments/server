const ServiceReport = require("../models/FormModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
/* ----------------------------- Create Report ----------------------------- */
exports.createServiceReport = catchAsync(async (req, res, next) => {
  const data = req.body;

  if (!data.region || !data.engineerName) {
    return next(new AppError("Missing region or engineerName", 400));
  }

  const report = await ServiceReport.create(data);

  res.status(201).json({
    status: "success",
    data: { report },
  });
});

/* ---------------------------- Get All Reports ---------------------------- */
exports.getAllServiceReports = catchAsync(async (req, res, next) => {
  const { user } = req;
  const filter = {};

  // Role-based filter
  if (user.role === "ENG") {
    filter.engineerName = user._id;
  } else if (user.role === "BM") {
    filter.region = user.region;
  } else if (!["CM", "VXR"].includes(user.role)) {
    return next(new AppError("Not authorized to view reports", 403));
  }

  // Query with population
  const reports = await ServiceReport.find(filter)
    .populate("region", "name")
    .populate("Customer", "name")
    .populate("engineerName", "username")
    .populate("spare", "name")
    .select("-__v"); // remove internal Mongoose version key

  // Transform populated fields into plain text
  const data = reports.map((r) => {
    const doc = r.toObject({ versionKey: false }); // remove __v

    return {
      ...doc,
      Customer: r.Customer?.name || "-",
      region: r.region?.name || "-",
      engineerName: r.engineerName?.username || "-",
      spare:
        Array.isArray(r.spare) && r.spare.length > 0
          ? r.spare.map((s) => s.name)
          : ["-"],
    };
  });

  res.status(200).json({
    status: "success",
    count: data.length,
    data,
  });
});

/* --------------------------- Get Single Report --------------------------- */
exports.getReport = catchAsync(async (req, res, next) => {
  const { user } = req;
  const r = await ServiceReport.findById(req.params.id)
    .populate("region", "name")
    .populate("Customer", "name")
    .populate("engineerName", "username")
    .populate("spare", "name");
  if (!r) return next(new AppError("Report not found", 404));
  if (
    user.role === "ENG" &&
    r.engineerName?._id?.toString() !== user._id.toString()
  )
    return next(new AppError("You are not allowed to view this report", 403));
  if (
    user.role === "BM" &&
    r.region?._id?.toString() !== user.region?.toString()
  )
    return next(
      new AppError(
        "You are not allowed to view reports outside your region",
        403
      )
    );
  const report = {
    id: r._id,
    SerialReportNumber: r.SerialReportNumber,
    Date: r.Date,
    Customer: r.Customer?.name,
    region: r.region?.name,
    engineer: r.engineerName?.username,
    spareParts: r.spare?.map((s) => s.name),
    Quotation: r.Quotation,
    PurchaseOrder: r.PurchaseOrder,
    Inventory: r.Inventory,
    MachineType: r.MachineType,
    Model: r.Model,
    SerialNumber: r.SerialNumber,
    ServiceType: r.ServiceType,
    JobCompleted: r.JobCompleted,
    description: r.description,
    dateEntered: r.dateEntered,
  };
  res.status(200).json({ status: "success", data: report });
});
