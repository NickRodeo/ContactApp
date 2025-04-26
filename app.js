//Express
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const app = express();
const port = 3000;
const path = require("path");

//Flash Message
const session = require("express-session");
const flash = require("connect-flash");
//validation
const { body, check, validationResult } = require("express-validator");
//MongoDB
const mongoose = require("mongoose");
//Model
const { Contact } = require("./models/contact");

//Connect Database
const uri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/belajar_mongo";
mongoose.connect(uri).then(() => console.log("Connected to MongoDB!"));

//Middleware
//Built-in
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "views"));
//Third Party
app.use(expressLayouts);
app.set("view engine", "ejs");
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(flash());
app.use((req, res, next) => {
  res.locals.msg = req.flash("msg");
  next();
});

//User-Defined
//Home
app.get("/", (req, res) => {
  res.render("index", {
    layout: "layouts/main",
    title: "Home",
    path: req.path,
  });
});

//About
app.get("/about", (req, res) => {
  res.render("about", {
    layout: "layouts/main",
    title: "About",
    path: req.path,
  });
});

//Contact
app.get("/contact", async (req, res) => {
  const contacts = await Contact.find();
  res.render("contact", {
    layout: "layouts/main",
    title: "Contact",
    contacts,
    path: req.path,
  });
});

//Create Contact
app.get("/contact/create", (req, res) => {
  res.render("create", {
    layout: "layouts/main",
    title: "Create",
    path: "/contact",
    errors: [],
    oldVal: false,
  });
});

//Add Contact
app.post(
  "/contact",
  body("nama").custom(async (value) => {
    const dup = await Contact.findOne({ nama: value });
    if (dup) {
      console.log(value);
      throw new Error("Nama Telah Terdaftar");
    }
    return true;
  }),
  body("email").isEmail().withMessage("Email tidak valid!"),
  body("nohp").isMobilePhone("id-ID").withMessage("No HP tidak valid!"),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("create", {
        layout: "layouts/main",
        title: "Create",
        path: "/contact",
        errors: errors.array(),
        oldVal: req.body,
      });
    }
    const data = new Contact(req.body);
    data.save();
    req.flash("msg", "Contact berhasil ditambahkan!");
    res.redirect("/contact");
  }
);

//Edit Contact
app.get("/contact/edit/:nama", async (req, res) => {
  const contact = await Contact.findOne({ nama: req.params.nama });
  res.render("edit", {
    layout: "layouts/main",
    title: "Edit",
    path: "/contact",
    errors: [],
    contact,
  });
});

//Update Contact
app.post(
  "/contact/edit",
  body("nama").custom(async (value, { req }) => {
    const dup = await Contact.findOne({ nama: value });
    if (dup && req.body.oldNama !== value) {
      throw new Error("Nama Telah Terdaftar");
    }
    return true;
  }),
  body("email").isEmail().withMessage("Email tidak valid!"),
  body("nohp").isMobilePhone("id-ID").withMessage("No HP tidak valid!"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("edit", {
        layout: "layouts/main",
        title: "Edit",
        path: "/contact",
        errors: errors.array(),
        contact: req.body,
      });
    }
    delete req.body.oldNama;
    await Contact.updateOne({ _id: req.body._id }, req.body);
    req.flash("msg", "Contact berhasil diubah!");
    res.redirect("/contact");
  }
);

//Delete Contact
app.post("/contact/delete/:nama", async (req, res) => {
  await Contact.deleteOne({ nama: req.params.nama });
  req.flash("msg", "Contact Berhasil Di Hapus!");
  res.redirect("/contact");
});

//Detail Contact
app.get("/contact/:nama", async (req, res) => {
  const contact = await Contact.findOne({ nama: req.params.nama });
  if (!contact) {
    res.render("error", {
      title: "error",
      layout: "layouts/error",
    });
    return false;
  }
  res.render("detail", {
    layout: "layouts/main",
    title: "Detail",
    contact,
    path: "/contact",
  });
});

//Error URL
app.use("/", (req, res, next) => {
  res.render("error", {
    title: "error",
    layout: "layouts/error",
  });
  next();
});

module.exports = app;
