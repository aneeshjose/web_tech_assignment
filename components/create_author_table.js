const admin = require('firebase-admin');

function getAuthorPapers(user,res,db){
    db.collection('papers').where('author','==',user).get().then((value)=>{
        var tableContent="";
        value.docs.forEach((f)=>{
             tableContent+=`<tr>
             <td><a href="${f.id}">${f.data().name}</a></td>
             <td>${f.data().status}</td>
             <td><button type="button" onclick="removeSubmission(${f.id})">Delete</button></td>                    
         </tr>`
        });
        console.log(tableContent);
    }).catch((e)=>{
        res.send({'status':false});
    });
}