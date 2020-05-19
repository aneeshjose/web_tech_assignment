const admin = require('firebase-admin');
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const formidable = require('formidable');

let serviceAccount = require('./adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(cookieParser());

app.get('/', (req, res) =>{
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.post('/signupcheck', (req, res) =>{
    const name=req.body.name;
    const email=req.body.email;
    const password=req.body.password;
    const usertype=req.body.usertype;
    db.collection(usertype).doc(email).get().then((snapshot)=>{
        if(snapshot.exists){
            res.send({'status':false,'code':'exists'});
        }else{
            db.collection(usertype).doc(email).set({'name':name,'password':password}).then((result)=>{
                res.send({'status':true});
            }).catch((e)=>{
                res.send({'status':false,'code':e});
            });
        }
    }).catch((e)=>{
        console.log(e);
        res.send({'status':false,'code':'error'});
    })
});
    

app.get('/signup',(req,res)=>{
    res.sendFile(path.join(__dirname,'/signup.html'));
});
app.post('/logincheck', (req, res) =>{
    const email=req.body.email;
    const password=req.body.password;
    const usertype=req.body.usertype;
    db.collection(usertype).doc(email).get().then((snapshot)=>{
        console.log(snapshot.data());
        if(!snapshot.exists){
            res.send({'status':false,'code':'noexists'});
        }else if(snapshot.data().password==password){
            res.cookie('user',email);
            res.cookie('type',usertype);
            res.send({'status':true,'code':'exists'});
        }else{
            res.send({'status':false,'code':'nomatch'});
        }
    }).catch((e)=>{
        console.log(e);
        res.send({'status':false,'code':'error'});
    })
});
   
app.get('/login',(req,res)=>{
    res.sendFile(path.join(__dirname,'/login.html'));
});

app.get('/dashboard',(req,res)=>{
    res.sendFile(path.join(__dirname,'/dashboard.html'));
});

app.post('/uploadcheck',(req,res)=>{
    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      
    });
    
});

app.get('/upload',(req,res)=>{
    res.sendFile(path.join(__dirname,'/upload.html'));
});

app.get('/dashboardcheck',(req,res)=>{
    const user=req.cookies.user;
    const type=req.cookies.type;
    if(type=='author'){
        db.collection('papers').where('author','==',user).get().then((value)=>{
            console.log(value.docs);
        }).catch((e)=>{
            res.send({'status':false});
        });
    }
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
