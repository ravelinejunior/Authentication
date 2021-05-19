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
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose')
const session = require('express-session')
const LocalStrategy = require('passport-local')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const googleAuth = require('passport-google-oauth20')
const findOrCreate = require('mongoose-findorcreate')


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

mongoose.set('useCreateIndex',true)

//conexão com cookie session iniciada
app.use(session({
    secret:"Secret Cookie",
    resave:false,
    saveUninitialized:true,
    cookie:{}
}))

app.use(passport.initialize())
app.use(passport.session())



const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId:String
});

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const secret = process.env.SECRET;

//userSchema.plugin(encrypt,{secret:secret, encryptedFields: ['password']})

const User = new mongoose.model("User", userSchema);

passport.use(new LocalStrategy(User.authenticate()))

/* passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser()) */

passport.serializeUser((user,done)=>{
  done(null,user.id)
})

passport.deserializeUser((id,done)=>{
  User.findById(id,(err,user)=>{
    done(err, user);
  })
})


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL:'https://www.googleapis.com/oauth2/v3/userinfo'
},
(accessToken, refreshToken, profile, cb)=> {
  console.log(profile);
  User.findOrCreate({ googleId: profile.id },  (err, user) =>{
    return cb(err, user);
  });
}
));

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get('/secrets',(req,res)=>{
  //verificar se usuario está autenticado
  if(req.isAuthenticated){
    res.render('secrets')
  }else{
    res.redirect('/login')
  }
})

app.get('/logout',(req,res)=>{
  req.logout();
  res.redirect('/')
})

app.get('/auth/google',
  passport.authenticate('google',{scope:['profile']})
)

app.get('/auth/google/secrets',
  passport.authenticate('google',{failureRedirect:'/login'}),
  (req,res)=>{
    res.redirect('/secrets')
  }
)

app.post('/register',(req,res)=>{
  User.register({username:req.body.username},req.body.password,(err,user)=>{
    if(err){
      console.log(err);
      res.redirect('/register')
      alert(err)
    }else{
      //autenticar o usuario com o passport
      passport.authenticate('local')(req,res,()=>{
        res.redirect('secrets')
      })
      
    }
  })
})

app.post('/login',(req,res)=>{
  const user = new User({
    username:req.body.username,
    password:req.body.password
  })

  req.login(user,(err)=>{
    if(err){
      alert(err)
    }else{
      passport.authenticate('local')(req,res,()=>{
        if(req.isAuthenticated){
          res.render('secrets')
        }else{
          alert('User not logged.')
          res.redirect('/login')
        }
      })
    }
  })

})



// register using the bcrypt
/* app.post("/register", (req, res) => {
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
 */

// login using the bcrypt

/* app.post("/login", (req, res) => {
  const userName = req.body.username;
  const password = req.body.password;

  const pass = md5(req.body.password);

  User.findOne({ email: userName }, (err, findOne) => {
    if (findOne) {
      /*  if(findOne.password === pass){
                console.log(findOne);
                res.render('secrets')
            } 

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
}); */

app.listen(3000, () => {
  console.log("Server started on port 3000.");
});
