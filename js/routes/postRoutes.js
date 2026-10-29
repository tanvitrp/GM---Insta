const express = require("express");
const multer = require("multer");
const Post = require("../models/Post");
const Comment = require("../models/Comment");

const router = express.Router();

// FILE UPLOAD
const storage = multer.diskStorage({
    destination: "public/uploads",
    filename: (req, file, cb) => cb(null, Date.now() + file.originalname)
});
const upload = multer({ storage });

// ✅ HOME PAGE
router.get("/home", async (req, res) => {
    const posts = await Post.find().populate("userId");

    for (let post of posts) {
        post.comments = await Comment.find({ postId: post._id });
    }

    res.render("home", { posts, user: req.session.user });
});

// ✅ CREATE POST
router.post("/post", upload.single("image"), async (req, res) => {
    const post = new Post({
        userId: req.session.user._id,
        caption: req.body.caption,
        image: req.file ? req.file.filename : ""
    });

    await post.save();
    res.redirect("/home");
});

// ✅ LIKE / UNLIKE
router.get("/like/:id", async (req, res) => {
    const post = await Post.findById(req.params.id);
    const userId = req.session.user._id;

    if (post.likes.includes(userId)) {
        post.likes.pull(userId);
    } else {
        post.likes.push(userId);
    }

    await post.save();
    res.redirect("/home");
});

// ✅ EXPLORE PAGE
router.get("/explore", async (req, res) => {
    const posts = await Post.find().populate("userId");
    res.render("explore", { posts, user: req.session.user });
});

// ✅ SINGLE POST VIEW
router.get("/post/:id", async (req, res) => {
    const post = await Post.findById(req.params.id).populate("userId");
    res.render("singlePost", { post, user: req.session.user });
});

// ✅ DELETE POST
router.get("/delete/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        // Check if user owns the post
        if (post.userId.toString() !== req.session.user._id.toString()) {
            return res.send("Unauthorized");
        }
        
        await Post.findByIdAndDelete(req.params.id);
        res.redirect("/home");
    } catch (err) {
        console.log(err);
        res.send("Error deleting post");
    }
});

// ✅ EDIT POST PAGE
router.get("/edit/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate("userId");
        
        // Check if user owns the post
        if (post.userId._id.toString() !== req.session.user._id.toString()) {
            return res.send("Unauthorized");
        }
        
        res.render("editPost", { post, user: req.session.user });
    } catch (err) {
        console.log(err);
        res.send("Error loading edit page");
    }
});

// ✅ UPDATE POST
router.post("/edit/:id", upload.single("image"), async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        // Check if user owns the post
        if (post.userId.toString() !== req.session.user._id.toString()) {
            return res.send("Unauthorized");
        }
        
        post.caption = req.body.caption;
        if (req.file) {
            post.image = req.file.filename;
        }
        
        await post.save();
        res.redirect("/home");
    } catch (err) {
        console.log(err);
        res.send("Error updating post");
    }
});

module.exports = router;
