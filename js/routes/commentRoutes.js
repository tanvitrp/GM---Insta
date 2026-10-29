const express = require("express");
const Comment = require("../models/Comment");
const router = express.Router();

router.post("/comment", async (req, res) => {
    try {
        await Comment.create({
            postId: req.body.postId,
            userId: req.session.user._id,
            commentText: req.body.commentText
        });
        res.redirect("/home");
    } catch (err) {
        console.log(err);
        res.send("Error adding comment");
    }
});

module.exports = router;
