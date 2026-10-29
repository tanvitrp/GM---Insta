const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Post = require("../models/Post");

// ✅ PROFILE PAGE (WITH POSTS)
router.get("/profile/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate("followers")
            .populate("following");

        const posts = await Post.find({ userId: user._id });

        res.render("profile", { user, posts, currentUser: req.session.user });

    } catch (err) {
        console.log(err);
        res.send("Error loading profile");
    }
});


// ✅ FOLLOW / UNFOLLOW
router.get("/follow/:id", async (req, res) => {
    const currentUser = await User.findById(req.session.user._id);
    const targetUser = await User.findById(req.params.id);

    const isFollowing = currentUser.following.includes(targetUser._id);

    if (isFollowing) {
        currentUser.following.pull(targetUser._id);
        targetUser.followers.pull(currentUser._id);
    } else {
        currentUser.following.push(targetUser._id);
        targetUser.followers.push(currentUser._id);
    }

    await currentUser.save();
    await targetUser.save();

    res.redirect("/profile/" + req.params.id);
});


// ✅ FOLLOWERS LIST
router.get("/followers/:id", async (req, res) => {
    const user = await User.findById(req.params.id).populate("followers");
    res.render("followers", { users: user.followers, user: req.session.user });
});


// ✅ EDIT PROFILE
router.post("/edit-profile", async (req, res) => {
    await User.findByIdAndUpdate(req.session.user._id, {
        bio: req.body.bio
    });

    res.redirect("/profile/" + req.session.user._id);
});
router.get("/users", async (req, res) => {
    const User = require("../models/User");
    const users = await User.find({
        _id: { $ne: req.session.user._id } // exclude yourself
    });

    res.render("users", { users, user: req.session.user });
});


module.exports = router;
