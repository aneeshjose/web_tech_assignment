const admin = require('firebase-admin');
const express = require('express');
const app = express();
const port = 3000;
var path = require('path');
var bodyParser = require("body-parser");


let serviceAccount = require('./adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

app.get('/', (req, res) =>{
//     db.collection('authors').listDocuments().then(re) get()
//   .then((snapshot) => {
//     snapshot.forEach((doc) => {
//       console.log(doc.id, '=>', doc.data());
//     });
//   })
//   .catch((err) => {
//     console.log('Error getting documents', err);
//   });

    res.sendFile(path.join(__dirname + '/index.html'));
});
app.post('/signupcheck', (req, res) =>{
    var name=req.body.name;
    var email=req.body.email;
    var password=req.body.password;
    var usertype=req.body.usertype;
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
    var email=req.body.email;
    var password=req.body.password;
    var usertype=req.body.usertype;
    db.collection(usertype).doc(email).get().then((snapshot)=>{
        console.log(snapshot.data());
        if(!snapshot.exists){
            res.send({'status':false,'code':'noexists'});
        }else if(snapshot.data().password==password){
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

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
