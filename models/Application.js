const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
    userId: String,
    jobId: String,
});

applicationSchema.index({userId:1, jobId:1},{unique: true});
module.exports = mongoose.model("Application", applicationSchema);