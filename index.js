const admin = require('firebase-admin');
const express = require('express');
const app = express();
const port = 3000;
var path = require('path');

let serviceAccount = require('./adminsdk.json');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();

    // let docRef = db.collection('users').doc('alovelace');

    // let setAda = docRef.set({
    //   first: 'Ada',
    //   last: 'Lovelace',
    //   born: 1815
    // });
    // res.send('Done!');

app.get('/', (req, res) =>{
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/signup',(req,res)=>{
    res.sendFile(path.join(__dirname,'/signup.html'))
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
