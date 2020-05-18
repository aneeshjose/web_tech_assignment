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
    res.sendFile(path.join(__dirname + '/index.html'));
});
app.post('/signupcheck', (req, res) =>{

    res.send("{'status':'done'}");
});
    

app.get('/signup',(req,res)=>{
    res.sendFile(path.join(__dirname,'/signup.html'))
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
