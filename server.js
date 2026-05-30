const express = require("express");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const Application = require("./models/Application");

require("dotenv").config();

const app = express();

// ==============================
// ✅ Middleware
// ==============================
app.use(cors());
app.use(express.json());


// ==============================
// 🧪 Test Route
// ==============================
app.get("/", (req, res) => {
res.send("Server is running 🚀");
});

// ==============================
// 👤 USER MODEL
// ==============================
const userSchema = new mongoose.Schema({
email: String,
password: String,
});

const User = mongoose.model("User", userSchema);

// ==============================
// 💼 JOB MODEL
// ==============================
const Job = require("./models/Job");

// ==============================
// 🔐 SIGNUP
// ==============================
app.post("/signup", async (req, res) => {
try {
const { email, password } = req.body;

const hashedPassword = await bcrypt.hash(password, 10);

const newUser = new User({
email,
password: hashedPassword,
});

await newUser.save();

res.json({ message: "User registered successfully ✅" });

} catch (error) {
res.status(500).json({ error: error.message });
}
});

// ==============================
// 🔑 LOGIN
// ==============================
app.post("/login", async (req, res) => {
try {
const { email, password } = req.body;

const user = await User.findOne({ email });

if (!user) {
return res.status(400).json({ message: "User not found ❌" });
}

const isMatch = await bcrypt.compare(password, user.password);

if (!isMatch) {
return res.status(400).json({ message: "Wrong password ❌" });
}

const token = jwt.sign(
{ userId: user._id },
process.env.JWT_SECRET,
{ expiresIn: "1h" }
);

res.json({
message: "Login successful ✅",
token,
});

} catch (error) {
res.status(500).json({ error: error.message });
}
});

// ==============================
// 🔐 VERIFY TOKEN
// ==============================
const verifyToken = (req, res, next) => {
const token = req.headers["authorization"];

if (!token) {
return res.status(401).json({ message: "Login required ❌" });
}

try {
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.userId = decoded.userId;
next();
} catch (error) {
return res.status(401).json({ message: "Invalid token ❌" });
}
};
// ==============================
// 🔒 PROTECTED ROUTE
// ==============================
app.get("/profile", verifyToken, (req, res) => {
res.json({
message: "Protected route accessed ✅",
userId: req.userId,
});
});

// ==============================
// 💼 ADD JOB
// ==============================
app.post("/jobs", async (req, res) => {
try {
const newJob = new Job(req.body);

await newJob.save();

res.json({ message: "Job added successfully ✅" });

} catch (error) {
res.status(500).json({ error: error.message });
}
});

// ==============================
// 📄 GET JOBS
// ==============================
app.get("/jobs", async (req, res) => {
try {
const jobs = await Job.find();

res.json(jobs);

} catch (error) {
res.status(500).json({ error: error.message });
}
});

//apply route
app.post("/apply", verifyToken, async (req, res) => {
try {
const userId = req.userId.toString();
const jobId = req.body.jobId.toString();

// ✅ Check duplicate FIRST
const alreadyApplied = await Application.findOne({
userId,
jobId,
});

if (alreadyApplied) {
return res.json({ message: "Already applied ❌" });
}

// ✅ Save new application
const newApplication = new Application({ userId, jobId });
await newApplication.save();

res.json({ message: "Applied successfully ✅" });

} catch (error) {
res.status(500).json({ error: error.message });
}
});

//My applications route
app.get("/my-applications", verifyToken, async (req, res) => {
try {
const applications = await Application.find({
userId: req.userId.toString(),
});

// 🔥 IMPORTANT FIX
const jobs = await Promise.all(
applications.map(async (app) => {
return await Job.findById(app.jobId);
})
);

res.json(jobs);

} catch (error) {
res.status(500).json({ error: error.message });
}
});
// ==============================
// 🌐 CONNECT DB
// ==============================
mongoose
.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected ✅"))
.catch((err) => console.log(err));

// ==============================
// 🚀 START SERVER
// ==============================
app.listen(5000, () => {
console.log("Server started on port 5000 🚀");
});