const express=require('express')
const {google}=require('googleapis')
const request=require('request')
const cors=require('cors')
const urlParse=require('url-parse')
const queryParse=require('query-string')
const bodyParser=require('body-parser')
const axios=require('axios')
const credentials=require('./credentials.json')
const app=express()
const port=3000

app.use(cors());
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())


app.get('/gmailapi',(req,res)=>{
  
    const {client_secret, client_id, redirect_uris} = credentials.installed;

    //oauth config
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const SCOPES = [ 'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send'];

  //Generating auth URL
  const url = oAuth2Client.generateAuthUrl({
         access_type: 'offline',
         scope: SCOPES,
         state: JSON.stringify({
             callbackUrl:req.body.callbackUrl,
             userID:req.body.userid
         })
 })

request(url,(err,response,body)=>{
       console.log("error ",err);
      console.log("statusCode: ",response && response.statusCode);
      res.send({url});
  })
})

//function to create encoded mail
function makeBody(sender,to,subject,message_text){
  var str = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
  "MIME-Version: 1.0\n",
  "Content-Transfer-Encoding: 7bit\n",
  "from: ",sender ,"\n",

  "to: ",to , "\n",
  "subject: ", subject, "\n\n",
  message_text
].join('');

var encodedMail = new Buffer.from(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
  return encodedMail;
}

app.get('/sendEmail',(req,res,next)=>{
  res.send("Sending Email");
  next();

})

app.post('/sendEmail', async (req, res, next) => {

  //to make a encoded  body message
  function makeBody(to, from, subject, message) {
      let str = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
          "Content-length: 5000\n",
          "Content-Transfer-Encoding: message/rfc822\n",
          "to: ", to,"\n",
          "from: ", from,"\n",
          "subject: ", subject,"\n\n",
          message
      ].join('');
      console.log("String: ", str);
      var encodedMail = new Buffer.from(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
      // let encodedMail = (str).replace(/\+/g, '-').replace(/\//g, '_');
      return encodedMail;
  }
    
let raw = makeBody("Sender email", "Receiver email", "Subject", "Message body")
  
const userId = 'me'; // Please modify this for your situation.
// console.log(req.query)
let option = {
    url: "https://www.googleapis.com/upload/gmail/v1/users/" + userId + "/messages/send",
    method: 'POST',
    headers: {
       'Authorization': "Bearer " + tokens.tokens.access_token,
        'Content-Type': 'message/rfc822',
    },
    body: raw,
};
// console.log(res.apiOk(body))

await request(option).then(body => {
  return res.apiOk(body);
}).catch(err => {
  return res.apiError(err);
})

});

app.listen(port,()=>{
    console.log(`Listening on ${port}`)
})