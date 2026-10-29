const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Message = require("../models/Message");

// ✅ CHAT USER LIST (ONLY FOLLOWING)
router.get("/chat", async (req, res) => {
    try {
        const currentUser = await User.findById(req.session.user._id)
            .populate("following");

        res.render("chat", { users: currentUser.following, user: req.session.user });

    } catch (err) {
        console.log(err);
        res.send("Error loading chat");
    }
});


// ✅ OPEN CHAT WITH USER
router.get("/chat/:id", async (req, res) => {
    const messages = await Message.find({
        $or: [
            { senderId: req.session.user._id, receiverId: req.params.id },
            { senderId: req.params.id, receiverId: req.session.user._id }
        ]
    });

    const user = await User.findById(req.params.id);

    res.render("chatbox", { messages, user, currentUser: req.session.user });
});


// ✅ SEND MESSAGE
router.post("/chat", async (req, res) => {
    const msg = new Message({
        senderId: req.session.user._id,
        receiverId: req.body.receiverId,
        messageText: req.body.messageText
    });

    await msg.save();

    res.redirect("/chat/" + req.body.receiverId);
});

module.exports = router;
