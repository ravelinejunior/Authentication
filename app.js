//jshint esversion:6
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const encrypt = require('mongoose-encryption')
const md5 = require('md5');

const app = express()

app.use(express.static('public'))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({
    extended:true
}))

console.log(process.env.API_KEY);

mongoose.connect('mongodb://localhost/userDB', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
    email:String,
    password:String
})

const secret = process.env.SECRET

//userSchema.plugin(encrypt,{secret:secret, encryptedFields: ['password']})

const User = new mongoose.model("User",userSchema)


app.get('/',(req,res)=>{
    res.render('home')
})

app.get('/login',(req,res)=>{
    res.render('login')
})

app.get('/register',(req,res)=>{
    res.render('register')
})

app.post('/register',(req,res)=>{
    const newUser = new User({
        email:req.body.username,
        password:md5(req.body.password)
    })

    newUser.save((err)=>{
        if(err){
            console.log(err);
        }else {
            res.render('secrets')
        }
    })
})

app.post('/login',(req,res)=>{
    const userName = req.body.username
    const pass = md5(req.body.password)

    User.findOne({email:userName},(err,findOne)=>{
        if(findOne){
            console.log(findOne);
            if(findOne.password === pass){
                console.log(findOne);
                res.render('secrets')
            }
        
        }else{
            console.log('Error '+err);
            res.render('login')
        }
    })

})



app.listen(3000, ()=>{
    console.log("Server started on port 3000.");
})