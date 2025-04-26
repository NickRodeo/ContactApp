const mongoose = require("mongoose");
const Contact = mongoose.model("Contact", {
  nama: String,
  nohp: String,
  email: String,
});

module.exports = { Contact };
