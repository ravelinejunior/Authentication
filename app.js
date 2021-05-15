//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const md5 = require("md5");
const bcrypt = require("bcrypt");
const alert = require("alert");
const dialog = require("dialog");
const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

mongoose.connect("mongodb://localhost/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const secret = process.env.SECRET;

//userSchema.plugin(encrypt,{secret:secret, encryptedFields: ['password']})

const User = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const hash = bcrypt.hashSync(req.body.password, saltRounds);

  const newUser = new User({
    email: req.body.username,
    password: hash,
  });

  newUser.save((err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("password is " + hash);
      res.render("secrets");
    }
  });
});

app.post("/login", (req, res) => {
  const userName = req.body.username;
  const password = req.body.password;

  const pass = md5(req.body.password);

  User.findOne({ email: userName }, (err, findOne) => {
    if (findOne) {
      /*  if(findOne.password === pass){
                console.log(findOne);
                res.render('secrets')
            } */

      bcrypt.compare(password, findOne.password, (err, response) => {
        if (response === true) {
          alert(findOne);
          res.render("secrets");
        } else {
          alert("Password or email is not correct. Try again!");

          res.render("login");
        }
      });
    } else {
      console.log("Error " + err);
      res.render("login");
    }
  });
});

app.listen(3000, () => {
  console.log("Server started on port 3000.");
});
