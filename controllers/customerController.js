const fs = require("fs");
const XLSX = require("xlsx");
const Customer = require("../models/customerModel");
const Region = require("../models/regionModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// ---------------- CREATE CUSTOMER ----------------
exports.createCustomer = catchAsync(async (req, res, next) => {
  const { name, regionCode } = req.body;
  const region = await Region.findOne({ code: regionCode.toUpperCase() });
  if (!region) return next(new AppError("Invalid region code", 404));

  const customer = await Customer.create({
    name,
    region: region._id,
  });

  res.status(201).json({
    status: "success",
    data: { customer },
  });
});
// ---------------- BULK UPLOAD CUSTOMERS ----------------
exports.uploadCustomers = catchAsync(async (req, res, next) => {
  // 1️⃣ Validate file presence
  if (!req.file) {
    return res.status(400).json({
      status: "fail",
      message: "No file uploaded",
    });
  }

  const filePath = req.file.path;
  let rows = [];

  try {
    // 2️⃣ Parse Excel or CSV file
    const workbook = XLSX.read(req.file.buffer, {type : "buffer"});
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!rows.length) {
      await fs.promises.unlink(filePath).catch(() => {});
      return res.status(400).json({
        status: "fail",
        message: "Empty file. Please include at least one row.",
      });
    }

    // 3️⃣ Extract valid names + regionCodes
    const names = [];
    const regionCodes = [];

    for (const r of rows) {
      const name =
        typeof r.name === "string"
          ? r.name.trim()
          : String(r.name || "").trim();
      const regionCode =
        typeof r.regionCode === "string"
          ? r.regionCode.trim().toUpperCase()
          : String(r.regionCode || "")
              .trim()
              .toUpperCase();

      if (name && regionCode) {
        names.push(name);
        regionCodes.push(regionCode);
      }
    }

    const uniqueNames = [...new Set(names)];
    const uniqueRegionCodes = [...new Set(regionCodes)];

    // 4️⃣ Fetch existing customers
    const existingCustomers = await Customer.find({
      name: { $in: uniqueNames },
    });

    const existingByName = new Set(existingCustomers.map((c) => c.name));

    // 5️⃣ Fetch regions
    const regions = await Region.find({ code: { $in: uniqueRegionCodes } });
    const regionMap = {};
    regions.forEach((r) => (regionMap[r.code] = r._id));

    // 6️⃣ Build insert list
    const customersToInsert = [];
    const skippedRows = [];

    for (const row of rows) {
      const name =
        typeof row.name === "string"
          ? row.name.trim()
          : String(row.name || "").trim();
      const regionCode =
        typeof row.regionCode === "string"
          ? row.regionCode.trim().toUpperCase()
          : String(row.regionCode || "")
              .trim()
              .toUpperCase();

      if (!name || !regionCode) {
        skippedRows.push({ row, reason: "Missing name or regionCode" });
        continue;
      }

      const regionId = regionMap[regionCode];
      if (!regionId) {
        skippedRows.push({
          row,
          reason: `RegionCode not found: ${regionCode}`,
        });
        continue;
      }

      if (existingByName.has(name)) {
        skippedRows.push({ row, reason: `Duplicate name in DB: ${name}` });
        continue;
      }

      if (customersToInsert.find((c) => c.name === name)) {
        skippedRows.push({ row, reason: "Duplicate in uploaded file" });
        continue;
      }

      const customerId = `CUS-${regionCode}-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}-${Math.floor(Math.random() * 9999)
        .toString()
        .padStart(4, "0")}`;

      customersToInsert.push({
        name,
        region: regionId,
        regionCode,
        customerId,
      });

      existingByName.add(name);
    }

    // 7️⃣ Bulk insert
    let createdCustomers = [];
    if (customersToInsert.length > 0) {
      const inserted = await Customer.insertMany(customersToInsert, {
        ordered: false,
      });
      createdCustomers = inserted.map((c) => ({
        name: c.name,
        regionCode: c.regionCode,
        customerId: c.customerId,
      }));
    }

    // 8️⃣ Cleanup
    fs.promises
      .unlink(filePath)
      .catch((err) =>
        console.warn("⚠️ Could not delete temp file:", err.message)
      );

    // ✅ Success response
    return res.status(201).json({
      status: "success",
      results: createdCustomers.length,
      skipped: skippedRows.length,
      customers: createdCustomers,
      skippedRows,
    });
  } catch (err) {
    // 🚨 Add this debug block
    console.error("❌ UploadCustomers Error:", err);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return res.status(500).json({
      status: "error",
      message: "Error uploading CSV file",
      details: err.message,
    });
  }
});

// ---------------- GET ALL CUSTOMERS ----------------
// controllers/customerController.js
exports.getCustomers = catchAsync(async (req, res, next) => {
  const role = req.user?.role;
  const region = req.user?.region?._id || req.user?.region;

  let filter = {};

  // 🔹 Engineers only see their region
  if (role !== "CM" && role !== "VXR") {
    if (!region) {
      return next(new AppError("User does not have an assigned region.", 400));
    }
    filter.region = region;
  }

  const customers = await Customer.find(filter)
    .populate("region", "name code")
    .select("name customerId region");

  res.status(200).json({
    status: "success",
    results: customers.length,
    customers,
  });
});

// ---------------- GET ONE CUSTOMER ----------------
exports.getCustomerById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  let customer;

  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    customer = await Customer.findById(id)
      .populate("region", "name code -_id")
      .select("name customerId region");
  } else {
    customer = await Customer.findOne({ customerId: id })
      .populate("region", "name code -_id")
      .select("name customerId region");
  }

  if (!customer)
    return next(
      new AppError(`No customer found with ID or customerId: ${id}`, 404)
    );

  res.status(200).json({
    status: "success",
    data: {
      customer: {
        customerId: customer.customerId,
        name: customer.name,
        region: customer.region?.name,
        regionCode: customer.region?.code,
      },
    },
  });
});

// ---------------- UPDATE CUSTOMER ----------------
exports.updateCustomer = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  let customer;

  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    customer = await Customer.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
  } else {
    customer = await Customer.findOneAndUpdate({ customerId: id }, req.body, {
      new: true,
      runValidators: true,
    });
  }

  if (!customer)
    return next(
      new AppError(`No customer found with ID or customerId: ${id}`, 404)
    );

  res.status(200).json({
    status: "success",
    data: {
      customer: {
        customerId: customer.customerId,
        name: customer.name,
      },
    },
  });
});

// ---------------- DELETE CUSTOMER ----------------
exports.deleteCustomer = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const customer = await Customer.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!customer) return next(new AppError("No customer found", 404));

  res.status(204).json({ status: "success", data: null });
});

// ---------------- CREATE REGION ----------------
exports.createRegion = catchAsync(async (req, res, next) => {
  const region = await Region.create(req.body);
  res.status(201).json({
    status: "success",
    data: { region },
  });
});

// ---------------- GET ALL REGIONS ----------------
exports.getRegion = catchAsync(async (req, res, next) => {
  const regions = await Region.find();
  res.status(200).json({
    status: "success",
    results: regions.length,
    data: { regions },
  });
});
