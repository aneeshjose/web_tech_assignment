const admin = require('firebase-admin');
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const formidable = require('formidable');
const fs=require("fs");
const mv = require('mv');

// Initialize the firebase firestore sdk
let serviceAccount = require('./adminsdk.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
let db = admin.firestore();

// To parse the json data over the app
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

// To parse the cookies in user browser
app.use(cookieParser());

// Initial page
app.get('/', (req, res) =>{
    if(req.cookies.user!=null){
        res.redirect('/dashboard');
    }else{
        res.sendFile(path.join(__dirname + '/ui/index.html'));
    }
});

app.post('/signupcheck', (req, res) =>{
    // fetch the name,email,password and the type of user from the request
    const name=req.body.name;
    const email=req.body.email;
    const password=req.body.password;
    const usertype=req.body.usertype;
    db.collection(usertype).doc(email).get().then((snapshot)=>{
        if(snapshot.exists){
            // Check whether the user already in the db
            res.send({'status':false,'code':'exists'});
        }else{
            // if not save it to the db
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
    res.sendFile(path.join(__dirname,'/ui/signup.html'));
});
app.post('/logincheck', (req, res) =>{
    const email=req.body.email;
    const password=req.body.password;
    const usertype=req.body.usertype;
    db.collection(usertype).doc(email).get().then((snapshot)=>{
        if(!snapshot.exists){
            // Check whether the user is in the db
            res.send({'status':false,'code':'noexists'});
        }
        else if(snapshot.data().password==password){
            // Matching the username and password
            res.cookie('user',email);
            res.cookie('type',usertype);
            res.send({'status':true,'code':'exists'});
        }
        else{
            res.send({'status':false,'code':'nomatch'});
        }
    }).catch((e)=>{
        console.log(e);
        res.send({'status':false,'code':'error'});
    })
});
   
app.get('/login',(req,res)=>{
    res.sendFile(path.join(__dirname,'/ui/login.html'));
});

app.get('/dashboard',(req,res)=>{
    console.log(req.cookies.user);
    if(req.cookies.user==null)  res.redirect('/');
    else  res.sendFile(path.join(__dirname,'/ui/dashboard.html'));
});

app.post('/uploadcheck',(req,res)=>{
    const form = new formidable.IncomingForm();
    //parse incoming form data
    form.parse(req, function (err, fields, files) {
        const oldpath = files.fileuploaded.path;
        // Setting new path to save in the server
        const newpath = path.join(__dirname+'/files/','/'+Date.now().toString()+'.pdf');
        mv(oldpath, newpath, function (err) {
            if (err){
                 res.send({'status':false,'reason':err});
                 console.log(err); //Error while saving to $newpath
            }else{
                // Saving the info to the database
                db.collection('papers').doc(newpath).set({
                    'author':req.cookies.user,
                    'time':new Date().toDateString(),
                    'name':fields.name,
                    'description':fields.desc,
                    'status':'submitted',
                }).then((result)=>{
                    res.send({'status':true});//Redirect to dashboard on successful upload
                }).catch((e)=>{
                    res.send({'status':false,'reason':'db'});//Error from database
                });
            } 
        });
    });
    
});

app.get('/upload',(req,res)=>{
    if(req.cookies.user==null)  res.redirect('/');
    else res.sendFile(path.join(__dirname,'/ui/upload.html'));
});

app.get('/dashboardcheck',(req,res)=>{
    const user=req.cookies.user;
    const type=req.cookies.type;
    if(type=='author'){
        getAuthorPapers(user,res);
    }
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))


function getAuthorPapers(user,res){
    db.collection('papers').where('author','==',user).get().then((value)=>{
        var tableContent="";
        value.docs.forEach((f)=>{
             tableContent+=`<tr>
             <td><a href="${f.id}">${f.data().name}</a></td>
             <td>${f.data().status}</td>
             <td><button type="button" onclick="removeSubmission(${f.id})">Delete</button></td>                    
         </tr>`
        });
        console.log(f.length);
        const uploadbutton=`<button onclick="window.location='/upload'">Upload</button>`;
        if(f.length>0)
        res.send(
            `
                <table>
                    <tr>
                        <th>Paper title</th>
                        <th>status</th>
                        <th>actions</th>
                    </tr>
                </table>
                <br>
                ${uploadbutton} 
            `
        )
        else
        res.send(`No papers submitted<br>${uploadbutton}`);
        console.log(tableContent);
    }).catch((e)=>{
        res.send({'status':false});
    });
}