const ServiceReport = require("./service_report.model");
const RmaForm = require("../rma/rma.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");
const getKsaTimeFormatted = require("./utils/getKsaTimeFormatted");

// Helper: generate next RMA number in format RMA_0001
async function generateNextRmaNo() {
  try {
    const res = await RmaForm.aggregate([
      { $match: { RmaNo: { $regex: '^RMA_\\d+$' } } },
      { $project: { num: { $toInt: { $substr: ["$RmaNo", 4, { $strLenCP: "$RmaNo" }] } } } },
      { $sort: { num: -1 } },
      { $limit: 1 },
    ]);

    const last = res[0]?.num || 0;
    const next = last + 1;
    return `RMA_${String(next).padStart(4, "0")}`;
  } catch (err) {
    // Fallback: use timestamp-based or simple increment from count
    try {
      const count = await RmaForm.countDocuments();
      const next = count + 1;
      return `RMA_${String(next).padStart(4, "0")}`;
    } catch (e) {
      return `RMA_${String(Date.now()).slice(-4)}`;
    }
  }
}
/* ----------------------------- Create Report ----------------------------- */
exports.createServiceReport = catchAsync(async (req, res, next) => {
  const data = req.body;
  // 1) Validate required fields
  if (!data.region || !data.engineerName) {
    return next(new AppError("Missing region or engineerName", 400));
  }
  // 2) Check duplicate SerialReportNumber BEFORE creating
  const existingSR = await ServiceReport.findOne({
    SerialReportNumber: data.SerialReportNumber,
  });
  if (existingSR) {
    return next(
      new AppError(
        `SerialReportNumber '${data.SerialReportNumber}' already exists`,
        400
      )
    );
  }
  // 3) Create service report safely
  const report = await ServiceReport.create(data);
  // console.log("Service Report Object created:", report);
  // 4) If WARRANTY → check RMA duplication first
  if (report.ServiceType === "WARRANTY") {
    const existingRma = await RmaForm.findOne({
      serviceReport: report._id,
    });

    if (existingRma) {
      return next(
        new AppError(
          `RMA already exists for this report (RMA ID: ${existingRma._id})`,
          400
        )
      );
    }
    // 5) Create new RMA from report fields
    const rma = await RmaForm.create({
      RmaNo: await generateNextRmaNo(),
      // Date: getKsaTimeFormatted,
      Customer: report.Customer,
      region: report.region,
      AddressLocation: "-",
      MachineModelNo: report.Model,
      MachineSerialNo: report.SerialNumber,
      InkSolvent: report.InkSolventType || "-",
      JetRunningHours: report.JetRunningTime || "-",
      DetailedFaultDescription: report.description || "-",
      FaultyItemPartNo: "-",
      PartDescription: "-",
      serviceReport: report._id,
      engineer: report.engineerName,
      EngineerName: report.engineerName,
      status: "INCOMPLETE",
    });
    // 6) Attach RMA reference to service report
    report.RMA = rma._id;
    await report.save();

  }
  res.status(201).json({ status: "success", data: { report } });
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
    .populate("region", "name code")
    .populate("engineerName", "username region")
    .populate("Customer", "name")
    .populate("spare", "name")
    .select("-__v");
  res.status(200).json({
    status: "success",
    count: reports.length,
    reports,
  });
});

/* --------------------------- Get Single Report --------------------------- */
exports.getReport = catchAsync(async (req, res, next) => {
  const { user } = req;

  const r = await ServiceReport.findById(req.params.id)
    .populate("region", "name code")
    .populate("engineerName", "username region")
    .populate("Customer", "name")
    .populate("spare", "name")
    .populate("RMA", "_id status RmaNo createdAt");

  if (!r) return next(new AppError("Report not found", 404));
  if (
    user.role === "ENG" &&
    r.engineerName?._id?.toString() !== user._id.toString()
  )
    return next(new AppError("You are not allowed to view this report", 403));
  if (
    user.role === "BM" &&
    r.region?._id?.toString() !== user.region?._id.toString()
  )

    return next(
      new AppError(
        "You are not allowed to view reports outside your region",
        403
      )
    );


  res.status(200).json({ status: "success", data: r });
});

exports.createBulkServiceReports = catchAsync(async (req, res, next) => {
  const payload = req.body;

  if (!Array.isArray(payload) || payload.length === 0) {
    return next(new AppError("Payload must be a non-empty array", 400));
  }

  const createdReports = [];
  const errors = [];

  for (let i = 0; i < payload.length; i++) {
    const data = payload[i];

    try {
      // Validate required keys
      if (!data.region || !data.engineerName) {
        throw new Error(`Item ${i}: Missing region or engineerName`);
      }

      // Check duplicate SR number
      const exists = await ServiceReport.findOne({
        SerialReportNumber: data.SerialReportNumber,
      });

      if (exists) {
        throw new Error(
          `Item ${i}: SerialReportNumber '${data.SerialReportNumber}' already exists`
        );
      }

      // Create the service report
      const report = await ServiceReport.create(data);

      // Handle WARRANTY → attach RMA
      if (report.ServiceType === "WARRANTY") {
        const existingRma = await RmaForm.findOne({
          serviceReport: report._id,
        });

        if (existingRma) {
          throw new Error(
            `Item ${i}: RMA already exists for report '${report.SerialReportNumber}'`
          );
        }

        const rma = await RmaForm.create({
          RmaNo: await generateNextRmaNo(),
          Date: new Date().toISOString().slice(0, 10),
          Customer: report.Customer,
          region: report.region,
          AddressLocation: "-",
          MachineModelNo: report.Model,
          MachineSerialNo: report.SerialNumber,
          InkSolvent: report.InkSolventType || "-",
          JetRunningHours: report.JetRunningTime || "-",
          DetailedFaultDescription: report.description || "-",
          FaultyItemPartNo: "-",
          PartDescription: "-",
          serviceReport: report._id,
          engineer: report.engineerName,
          EngineerName: report.engineerName,
          status: "INCOMPLETE",
        });

        report.RMA = rma._id;
        await report.save();
      }

      createdReports.push(report);
    } catch (err) {
      errors.push(err.message);
    }
  }

  return res.status(201).json({
    status: "success",
    inserted: createdReports.length,
    failed: errors.length,
    errors,
    data: createdReports,
  });
});

