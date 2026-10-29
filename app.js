const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");

const authRoutes = require("./js/routes/authRoutes");
const postRoutes = require("./js/routes/postRoutes");
const commentRoutes = require("./js/routes/commentRoutes");
const chatRoutes = require("./js/routes/chatRoutes");
const followRoutes = require("./js/routes/followRoutes");

const app = express();

// PREVENT BACK/FORWARD CACHE (BFCache) TO RESOLVE SELENIUM IDE / EXTENSION PORT ISSUES
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
});

// MIDDLEWARE
app.use(express.urlencoded({ extended: true }));

// ✅ CORRECT STATIC PATH
app.use(express.static(path.join(__dirname, "public")));

// ✅ CORRECT VIEWS PATH
app.set("views", path.join(__dirname, "views"));
app.engine("html", require("ejs").renderFile);

// ✅ USE HTML VIEW ENGINE
app.set("view engine", "html");

// SESSION
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: true
}));

// AUTHENTICATION & GLOBAL VIEW VARIABLES
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    
    const publicPaths = ["/", "/login", "/register"];
    if (req.session.user || publicPaths.includes(req.path)) {
        next();
    } else {
        res.redirect("/");
    }
});

// INJECT UNLOAD SCRIPT TO DISABLE BFCache FOR SELENIUM IDE
app.use((req, res, next) => {
    const originalRender = res.render;
    res.render = function(view, options, callback) {
        let actualOptions = options || {};
        let actualCallback = callback;
        if (typeof options === "function") {
            actualCallback = options;
            actualOptions = {};
        }
        originalRender.call(this, view, actualOptions, (err, html) => {
            if (err) {
                if (actualCallback) return actualCallback(err);
                return next(err);
            }
            const script = `
<script type="text/javascript">
  window.addEventListener('unload', function() {});
</script>
`;
            let modifiedHtml = html;
            if (html.includes("</body>")) {
                modifiedHtml = html.replace("</body>", `${script}</body>`);
            } else {
                modifiedHtml = html + script;
            }
            if (actualCallback) {
                actualCallback(null, modifiedHtml);
            } else {
                res.send(modifiedHtml);
            }
        });
    };
    next();
});

// DATABASE
mongoose.connect("mongodb://127.0.0.1:27017/gminsta")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ROUTES
app.use("/", authRoutes);
app.use("/", postRoutes);
app.use("/", commentRoutes);
app.use("/", chatRoutes);
app.use("/", followRoutes);

// SERVER
app.listen(3000, () => console.log("http://localhost:3000"));
