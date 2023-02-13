//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret : process.env.PASSPORT_KEY,
    resave : false,
    saveUninitialized : false,
    cookie : {
        expires : 600000
    }
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.set("strictQuery", false);

mongoose.connect(process.env.MONGO_URI,function(err){
    if(err){
        console.log(err);
    } else {
        console.log("Connection to Database Estabhlished!!!");
    }
});


const adminSchema = new mongoose.Schema({
    username : {type:String, unique:true},
    name : String,
    password : String
});

adminSchema.plugin(passportLocalMongoose);

const Admin = mongoose.model("Admin" , adminSchema);

passport.use(Admin.createStrategy());

passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());

const studentSchema = new mongoose.Schema({
    fname : String,
    lname : String,
    rollNo : {type  : String , unique : true},
    phnNo : String,
    email : String,
    doa : String,
    program : String
});

const Student = mongoose.model("Student" , studentSchema);




app.get("/", function(req,res){
    if(req.isAuthenticated()){
        const name = req.user.name;
        res.render("dashboard",{gotName : name});
    } else {
        res.redirect("/verify");
    }
});

app.get("/verify" , function(req,res){
    res.render("verify");
});

app.get("/badCerror",function(req,res){
    res.render("errors/badCerror");
});

app.get("/adregister" , function(req,res){
    res.render("adregister");
});

app.get("/adlogin" , function(req,res){
    if(req.isAuthenticated()){
        res.redirect("/");
    } else {
        res.render("adlogin");
    }
});

app.get("/profile" , function(req,res){
    if(req.isAuthenticated()){
        const name = req.user.name;
        res.render("profile",{gotName : name});
    } else {
        res.redirect("/verify");
    }
});



app.get("/deladmin" , function(req,res){
    if(req.isAuthenticated()){
        if(req.user.username===process.env.SUPERUSER_ID){
            res.render("deladmin");
        } else {
            res.render("errors/restrict-error")
        }
    } else{
        res.redirect("/verify")
    }
});


app.get("/falladmin" , function(req,res){
    if(req.isAuthenticated()){
        if(req.user.username===process.env.SUPERUSER_ID){
            Admin.find({} , function(err, data){
                res.render("falladmin", {foundData : data});
            });
        } else {
            res.render("errors/restrict-error")
        }
    } else{
        res.redirect("/verify")
    }
});


app.post("/adregister", function(req,res){
    Admin.register({username : req.body.username , name: req.body.name} , req.body.password , function(err,user){
        if(err){
            res.render("errors/uaxerror" , {hue : "User"})
        } else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/");
            });
        }
    });
});

app.post("/adlogin", passport.authenticate("local",{
    successRedirect: "/",
    failureRedirect: "/badCerror"
  }), function(req, res){
  });

app.post("/fdeladmin", function(req,res){
    Admin.findOne({username : req.body.enteredID},function(err,foundUser){
        if (foundUser===null){
            res.render("errors/comerror" , {lol : "Maybe you entered wrong details"});
        } else {
            res.render("fdeladmin",{data : foundUser});
        }
    });
});

app.post("/admindel", function(req,res){
    if (req.isAuthenticated()){
        const GOTSECRETKEY = req.body.adminKEY;
        Admin.findOne({username : req.body.enteredID}, function(err,data){
            if(data===null){
                res.render("errors/comerror" , {lol : "Maybe you entered wrong userID"});
            } else {
                if (process.env.SECRET_KEY === GOTSECRETKEY){
                    Admin.deleteOne({username : req.body.enteredID} , function(err){
                        if(!err){
                            res.redirect("/")
                        } else {
                            console.log(err);
                        }
                    });
                } else {
                    res.render("errors/comerror" , {lol : "You Entered Wrong SecureKEY"});
                }
            }
        });
    } else{
        res.redirect("/verify");
    }
});

app.get("/forgotpass", function(req,res){
    res.render("forgotpass");
});

app.post("/forgotpass",function(req,res){
    Admin.findOne({username: req.body.username}, function(err,foundUser){
        if(foundUser===null){
            res.render("errors/comerror" , {lol : "Maybe you entered wrong UserID"});
        } else {
            res.render("resetpass" , {userData : foundUser});
        }
    });
});

app.post("/resetpass" , function(req,res){
    Admin.findOne({username : req.body.username} , function(err,foundUser){
        if (foundUser!=null){
            if (process.env.PRS_KEY===req.body.prs_KEY){
                foundUser.setPassword(req.body.password, function(){
                    foundUser.save();
                    res.render("errors/success");
                });
            } else {
                res.render("errors/comerror", {lol : "Wrong Admin_KEY"})
            }
        } else {
           res.render("errors/comerror", {lol : "Maybe you entered Wrong UserID"})
        }
    }) ;
});


app.get("/logout" , function(req,res){
    req.logout(function(err){});
    res.redirect("/");
})

///////////////////////////////////////////////////

app.get("/registeration" , function(req,res){
    if(req.isAuthenticated()){
        res.render("registeration");
    } else {
        res.redirect("/verify")
    }
});

app.get("/entries" , function(req,res){
    if(req.isAuthenticated()){
        res.render("entries");
    } else {
        res.redirect("/verify")
    }
});

app.get("/sentries" , function(req,res){
    if(req.isAuthenticated()){
        res.render("sentries");
    } else {
        res.redirect("/verify")
    }
});


app.get("/vallentries", function(req,res){
    if(req.isAuthenticated()){
        Student.find({} , function(err, data){
            res.render("vallentries", {foundData : data});
        });
    } else {
        res.redirect("/verify")
    }
});

app.get("/about" , function(req,res){
    res.render("about");
});
app.get("/contact" , function(req,res){
    res.render("contact");
});

app.get("/viewdelo", function(req,res){
    if(req.isAuthenticated()){
        res.render("viewdelo");
    } else {
        res.redirect("/verify")
    }
});

app.post("/vspecientries", function(req,res){
    Student.findOne({rollNo : req.body.rollNo},function(err,studentSData){
        if(studentSData===null){
            res.render("errors/comerror" , {lol : "Maybe you entered wrong details"});
        } else{
            res.render("vspecientries",{foundSData : studentSData});
        }
    });
});



app.post("/viewdelo", function(req,res,){
    Student.findOne({rollNo : req.body.rollNo},function(err,studentSData){
        if(studentSData===null){
            res.render("errors/comerror" , {lol : "Maybe you entered wrong details"});
        } else{
            res.render("delete",{foundSData : studentSData});
        }
    });
});

app.post("/delete", function(req,res){
    Student.findOne({rollNo :req.body.rollNo},function(err,data){
        if(data===null){
            res.render("errors/comerror" , {lol : "Maybe you entered wrong details"});
        } else{
            Student.deleteOne({rollNo : req.body.rollNo} , function(err){
                if(!err){
                    res.redirect("/");
                } else {
                    console.log(err);
                }
            });
        }
    });
});



app.post("/registeration" , function(req,res){
    const newStudent = new Student({
        fname : req.body.fname,
        lname : req.body.lname,
        rollNo : req.body.rollNo,
        phnNo : req.body.phnNo,
        email : req.body.email,
        doa : req.body.doa,
        program : req.body.program
    });

    newStudent.save(function(err){
        if(!err){
            res.redirect("/");
        } else {
            res.render("errors/uaxerror" , {hue : "Student"});
        }
    });
});

app.listen(3000, function(){
    console.log("<<<<<<-----Server Started on PORT 3000----->>>>>");
});