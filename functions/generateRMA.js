import mongoose from "mongoose";
import ServiceReport from "../service_report/service_report.model.js";
import RmaForm from "../rma/rma.model.js";

import dotenv from "dotenv";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);


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

    try {
      const count = await RmaForm.countDocuments();
      const next = count + 1;
      return `RMA_${String(next).padStart(4, "0")}`;
    } catch (e) {
      return `RMA_${String(Date.now()).slice(-4)}`;
    }
  }
}

console.log("DB connected");


const reports = await ServiceReport.find({
  ServiceType: "WARRANTY",
});

console.log(`Found ${reports.length} WARRANTY reports`);

let created = 0;
let skipped = 0;

for (const report of reports) {

  const exists = await RmaForm.findOne({
    serviceReport: report._id,
  });

  if (exists) {
    skipped++;
    continue;
  }


  const rma = await RmaForm.create({
    RmaNo: await generateNextRmaNo(),
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


  { _id: report._id },
  { $set: { RMA: rma._id } }
);

  created++;
}

console.log(`DONE ✅`);
console.log(`RMA created: ${created}`);
console.log(`Skipped (already existed): ${skipped}`);

await mongoose.disconnect();
process.exit(0);
