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
            db.collection(usertype).doc(email).set({'name':name,'password':password,'assigned':true}).then((result)=>{
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
            res.send({'status':true});
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

app.get('/logout',(req,res)=>{
    res.cookie("user", null, { expires: new Date(0)});
    res.cookie("type", null, { expires: new Date(0)});
    res.redirect('/');
})

app.get('/dashboard',(req,res)=>{
    if(req.cookies.user==null)  res.redirect('/');
    else  res.sendFile(path.join(__dirname,'/ui/dashboard.html'));
});

app.post('/uploadcheck',(req,res)=>{
    const form = new formidable.IncomingForm();
    //parse incoming form data
    form.parse(req, function (err, fields, files) {
        const oldpath = files.fileuploaded.path;
        const datenow=Date.now().toString();
        // Setting new path to save in the server
        const newpath = path.join(__dirname+'/files/','/'+datenow+'.pdf');
        mv(oldpath, newpath, function (err) {
            if (err){
                 res.send({'status':false,'reason':err});
                 console.log(err); //Error while saving to $newpath
            }else{
                // Saving the info to the database
                db.collection('papers').doc(datenow).set({
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
    }else if(type=='admin'){
        giveAdminPapers(res);
    }
});
const style=`
    <style>
        table,th,td{
            border: 1px solid black;;
            /* border-color: black; */
        }
    </style>
`;
app.get('/assignpaper',(req,res)=>{
    if(!req.cookies.user=="admin"){
        res.redirect('/dashboard')
    }else{
        res.setHeader('ContentType','text/html');

        const head=`
        <head>
            <title>Assign paper</title>
            ${style}
        </head>`;

        const greeting=`<h3>Welcome</h3><br>Assign ${req.query.file} of ${req.query.user}<br>`;
        var tableContent="";
        db.collection('reviewers').where('assigned','==',false).get().then((value)=>{
            value.docs.forEach((f)=>{
                tableContent+=`
                <tr>
                        <td>${f.data().name}</td>
                        <td>${f.id}</td>
                    <td><button onclick="javascript:window.location=/assign?file=${req.query.file}&&reviewer=${f.id}">Assign</button></td>
                `
            });
            const body=`
                ${greeting}
                <body>
                <table>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Action</th>
                    </tr>
                ${tableContent}
                </table>
                </body>
            `;
           
            if(value.docs.length>0){
            res.send(`
                <!DOOCTYPE>
                <html>
                    ${head}
                    ${body}
                </html>
                
            `);
            }else{
                res.send(`
                <!DOOCTYPE>
                <html>
                    ${head}
                    <body>
                    No reviewers available
                    </body>
                </html>
                
            `);
            }
        }).catch((e)=>{
            console.log(e);
            res.send('Something went wrong');
        });
    }
});

app.get('/download',(req,res)=>{
    res.sendFile(path.join(__dirname,'/files/'+req.query.file));
});

app.get('/deletesubmission',(req,res)=>{
    const user=req.cookies.user;
    const file=req.query.file;
    db.collection('papers').doc(file).delete().then((fulFil)=>{
        fs.unlink(path.join(__dirname,'/files/'+file+'.pdf'),(err)=>{ 
            if(err){
                console.log(err);
            }    
        res.redirect('/dashboard');
        });
    });
});



app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))


function getAuthorPapers(user,res){
    db.collection('papers').where('author','==',user).get().then((value)=>{
        var tableContent="";
        value.docs.forEach((f)=>{
             tableContent+=`<tr>
                <td><a href="javascript:void(0);" target=_"blank" onclick="javascript:window.open('/download?file='+${f.id}+'.pdf');" class="popup">${f.data().name}</a></td>
                <td>${f.data().status}</td>
                <td><button type="button" onclick="removeSubmission('${f.id}')">Delete</button></td>                    
            </tr>`
        });
        console.log(value.docs.length);
        const uploadbutton=`<button onclick="window.location='/upload'">Upload</button>`;
        const welcomeMessage=`
        <b>Welcome</b> ${user}<br><br>`;
        if(value.docs.length>0)
        res.send(
            `
            ${welcomeMessage}
                <table>
                    <tr>
                        <th>Paper title</th>
                        <th>status</th>
                        <th>actions</th>
                    </tr>
                    ${tableContent}
                </table>
                <br>
                Upload new ${uploadbutton} 
            `
        )
        else
        res.send(`
        ${welcomeMessage}
        No papers submitted<br>
        Upload new ${uploadbutton}`);
    }).catch((e)=>{
        console.log(e);
        res.send({'status':false,'e':e});
    });
}

function giveAdminPapers(res){
    const greeting="<b>Welcome</b> Admin<br>"
    const tablehead=`<tr>
        <th>Paper title</th>
        <th>status</th>
        <th>Author</th>
        <th>actions</th>
    </tr>`;
    db.collection('papers').get().then((values)=>{
        var tableContent=""
        values.docs.forEach((f)=>{
            tableContent+=`
                <tr>
                    <td><a href="javascript:void(0);" target=_"blank" onclick="javascript:window.open('/download?file='+${f.id}+'.pdf');" class="popup">${f.data().name}</a></td>
                    <td>${f.data().status}</td>
                    <td>${f.data().author}</td>
                    <td><button type="button" onclick="javascript:window.location='/assignpaper?file=${f.id}&&user=${f.data().author}'">${f.data().status=='submitted'?'Re assign':'Assign'}</button></td>                    
                </tr>`
        });
        if(values.docs.length>0){
            res.send(`
                <table>
                    ${tablehead}
                    ${tableContent}
                </table>
            `);
        }else{
            res.send(`
                <b color="red">No papers</b>
            `);
        }
    })
}