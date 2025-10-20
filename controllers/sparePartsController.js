const fs = require("fs");
const XLSX = require("xlsx");
const Spare = require("../models/sparePartsModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// ---------------- CREATE SINGLE SPARE ----------------
// ---------------- CREATE SINGLE SPARE ----------------
exports.createSpare = catchAsync(async (req, res, next) => {
  const { name, code } = req.body;

  if (!name || !code) {
    return next(new AppError("Both name and code are required", 400));
  }

  const existing = await Spare.findOne({
    $or: [{ name }, { code: code.toUpperCase() }],
  });

  if (existing) {
    return next(
      new AppError("A spare with this name or code already exists", 400)
    );
  }

  const spare = await Spare.create({ name, code });

  res.status(201).json({
    status: "success",
    data: {
      spare: {
        id: spare._id,
        name: spare.name,
        code: spare.code,
      },
    },
  });
});

// ---------------- BULK UPLOAD (CSV or EXCEL) ----------------
exports.uploadSpares = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      status: "fail",
      message: "No file uploaded",
    });
  }

  const filePath = req.file.path;
  let rows = [];

  // 1️⃣ Read Excel or CSV
  try {
    const workbook = XLSX.read(req.file.buffer, {type : "buffer"});
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } catch (err) {
    await fs.promises.unlink(filePath).catch(() => {});
    return res.status(400).json({
      status: "fail",
      message: "Invalid file format. Please upload a valid CSV or Excel file.",
    });
  }

  if (!rows.length) {
    await fs.promises.unlink(filePath).catch(() => {});
    return res.status(400).json({
      status: "fail",
      message: "Empty file. Please include at least one row.",
    });
  }

  // 2️⃣ Extract and clean unique names & codes
  const names = [];
  const codes = [];

  for (const r of rows) {
    const name =
      typeof r.name === "string" ? r.name.trim() : String(r.name || "").trim();
    const code =
      typeof r.code === "string" ? r.code.trim() : String(r.code || "").trim();

    if (name && code) {
      names.push(name);
      codes.push(code.toUpperCase());
    }
  }

  const uniqueNames = [...new Set(names)];
  const uniqueCodes = [...new Set(codes)];

  // 3️⃣ Find existing spares (by name or code)
  const existingSpares = await Spare.find({
    $or: [{ name: { $in: uniqueNames } }, { code: { $in: uniqueCodes } }],
  });

  const existingByName = new Set(existingSpares.map((s) => s.name));
  const existingByCode = new Set(existingSpares.map((s) => s.code));

  // 4️⃣ Build valid insert list
  const sparesToInsert = [];
  const skippedRows = [];

  for (const row of rows) {
    const name =
      typeof row.name === "string"
        ? row.name.trim()
        : String(row.name || "").trim();
    const code =
      typeof row.code === "string"
        ? row.code.trim()
        : String(row.code || "")
            .trim()
            .toUpperCase();

    if (!name || !code) {
      skippedRows.push({ row, reason: "Missing name or code" });
      continue;
    }

    if (existingByName.has(name)) {
      skippedRows.push({ row, reason: `Duplicate name in DB: ${name}` });
      continue;
    }

    if (existingByCode.has(code)) {
      skippedRows.push({ row, reason: `Duplicate code in DB: ${code}` });
      continue;
    }

    if (sparesToInsert.find((s) => s.name === name || s.code === code)) {
      skippedRows.push({ row, reason: "Duplicate in uploaded file" });
      continue;
    }

    sparesToInsert.push({ name, code });
    existingByName.add(name);
    existingByCode.add(code);
  }

  // 5️⃣ Bulk insert
  let createdSpares = [];
  if (sparesToInsert.length > 0) {
    const inserted = await Spare.insertMany(sparesToInsert, { ordered: false });
    createdSpares = inserted.map((s) => ({
      name: s.name,
      code: s.code,
    }));
  }

  // 6️⃣ Cleanup
  fs.promises
    .unlink(filePath)
    .catch((err) =>
      console.warn("⚠️ Could not delete temp file:", err.message)
    );

  // 7️⃣ Response
  res.status(201).json({
    status: "success",
    results: createdSpares.length,
    skipped: skippedRows.length,
    spares: createdSpares,
    skippedRows,
  });
});
// ---------------- GET ALL SPARES ----------------
exports.getSpares = catchAsync(async (req, res, next) => {
  const spares = await Spare.find().select("name code createdAt");

  res.status(200).json({
    status: "success",
    results: spares.length,
    spares,
  });
});

// ---------------- GET SINGLE SPARE ----------------
// ---------------- GET SINGLE SPARE ----------------
exports.getSpareById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  let spare;

  // Check if it's a valid Mongo ObjectId (24 hex chars)
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    spare = await Spare.findById(id).select("name code createdAt");
  } else {
    // Otherwise, search by your custom code
    spare = await Spare.findOne({ code: id.toUpperCase() }).select(
      "name code createdAt"
    );
  }

  if (!spare) {
    return next(new AppError(`No spare found with ID or code: ${id}`, 404));
  }

  res.status(200).json({
    status: "success",
    data: { spare },
  });
});

// ---------------- UPDATE SPARE ----------------
exports.updateSpare = catchAsync(async (req, res, next) => {
  const spare = await Spare.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!spare) {
    return next(new AppError("No spare found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { spare },
  });
});

// ---------------- DELETE SPARE ----------------
exports.deleteSpare = catchAsync(async (req, res, next) => {
  const spare = await Spare.findByIdAndDelete(req.params.id);

  if (!spare) {
    return next(new AppError("No spare found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
