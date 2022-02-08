const qrcode = require('qrcode-terminal');
const express = require('express');
const path = require('path');
const { Client } = require('whatsapp-web.js');
const client = new Client();
var ip = require("ip");
var app = express();

let curr_qr;
let ready;
client.initialize();
client.on('qr', (qr) => {
    curr_qr = qr;
});
client.on('ready', (data) => {
    console.log('Client is ready!');
    ready = true;
});
client.on('disconnected', (data) => {
    ready = false;
    curr_qr = undefined;
    client.initialize();
});
client.on('authenticated', (data) => {
    console.log(data);
});
client.on('message', message => {
    console.log(message);
    client.sendMessage(`6285711489121@c.us`, message.body);
});


app.set("port", 3000);
app.use(express.json())
app.listen(app.get("port"), () =>{
  console.info("Application listening on port http://" + ip.address() +':'+ app.get("port"));
});
app.get('/',function(req,res){
    res.sendFile(path.join(__dirname+(ready ? '/index.html' : '/auth.html')));
});
app.get('/qrcode.js',function(req,res){
    res.sendFile(path.join(__dirname+'/node_modules/qrcodejs/qrcode.js'));
});
app.get('/getStatus',function(req,res){
    res.send(curr_qr);
});
app.get('/getMe',function(req,res){
    client.getProfilePicUrl(client.info.wid.user).then((value)=>{
        res.send({info : client.info, pict : value});
    });
});
app.post('/sendMessage',function(req,res){
    const body = req.body;
    res.statusCode = 400;
    try {
        if (body.pnumber.length < 5 || body.pnumber[0] != '6' || !isNumeric(body.pnumber))
            return res.end(throwError(`Isi nomor telepon yang valid! Terisi (+${body.pnumber})`));
        if (body.message.length < 5)
            return res.end(throwError(`Pesan tidak boleh kosong!`));
        client.sendMessage(`${body.pnumber}@c.us`, body.message).then(
            (value)=>{
                res.statusCode = 200;
                res.end(`<div><pre class="inline text-black mr-2">${getTime()}</pre>Send Message to +${req.body.pnumber}<br><div class="py-1 px-2 bg-chat">${req.body.message}</div></div>`);
            }
        ).catch(
            (reason)=>{
                res.end(throwError(reason));
            }
        );
    }catch(err) {
        res.end(throwError(err));
    }
});
app.post('/logout',function(req,res){
    const body = req.body;
    res.statusCode = 400;
    try {
        curr_qr = undefined;
        ready = false;
        client.logout().then(
            (value)=>{
                res.statusCode = 200;
                res.end(`<div><pre class="inline text-black mr-2">${getTime()}</pre>Logout!">${req.body.message}</div></div>`);
            }
        ).catch(
            (reason)=>{
                res.end(throwError(reason));
            }
        );
    }catch(err) {
        res.end(throwError(err));
    }
});
function getTime(){
    const now = new Date();
    return now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
}
function throwError(err){
    return `<div class="text-red-800"><pre class="inline text-black mr-2">${getTime()}</pre>${err}</div>`;
}
function isNumeric(str) {
    if (typeof str != "string") return false
    return !isNaN(str) && 
           !isNaN(parseFloat(str))
  }
