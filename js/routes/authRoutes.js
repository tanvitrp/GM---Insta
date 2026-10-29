const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const User = require("../models/User");

const router = express.Router();

const storage = multer.diskStorage({
    destination: "public/profile",
    filename: (req, file, cb) => cb(null, Date.now() + file.originalname)
});
const upload = multer({ storage });

router.get("/", (req, res) => res.render("login"));

router.get("/register", (req, res) => res.render("register"));

router.post("/register", upload.single("profilePic"), async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation: Check if fields are provided
        if (!username || !email || !password) {
            return res.send("All fields are required ❌");
        }

        // Validation: Username format (3-20 chars, alphanumeric and underscore only)
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            return res.send("Username must be 3-20 characters with only letters, numbers, and underscore ❌");
        }

        // Validation: Email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.send("Please enter a valid email address ❌");
        }

        // Validation: Password minimum length
        if (password.length < 6) {
            return res.send("Password must be at least 6 characters ❌");
        }

        // Validation: Check if email already exists
        const existingEmail = await User.findOne({ email: email });
        if (existingEmail) {
            return res.send("Email already registered ❌");
        }

        // Validation: Check if username already exists
        const existingUsername = await User.findOne({ username: username });
        if (existingUsername) {
            return res.send("Username already taken ❌");
        }

        const hash = await bcrypt.hash(password, 10);

        const user = new User({
            username: username,
            email: email,
            password: hash,
            profilePic: req.file ? req.file.filename : ""
        });

        await user.save();
        res.redirect("/");
    } catch (err) {
        console.log(err);
        res.send("Registration error ❌");
    }
});
router.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.send("User not found ❌");
        }

        const match = await bcrypt.compare(req.body.password, user.password);

        if (!match) {
            return res.send("Wrong password ❌");
        }

        req.session.user = user;
        res.redirect("/home");

    } catch (err) {
        console.log(err);
        res.send("Login error");
    }
});
module.exports = router;