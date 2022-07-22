const qrcode = require('qrcode-terminal');
const express = require('express');
const path = require('path');
const { Client } = require('whatsapp-web.js');
const client = new Client({
    qrTimeoutMs: 0,
    puppeteer: {
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--unhandled-rejections=strict"
        ]
    }
});
// var ip = require("ip");
var local_app = express();
var public_app = express();

let curr_qr;
let ready;
client.initialize();
client.on('qr', (qr) => {
    curr_qr = qr;
    qrcode.generate(qr, {small: true}, function (qrcode) {
        console.log(qrcode)
    });
});

// var mysql = require('mysql');

// var con = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: ""
// });

// con.connect(function(err) {
//   if (err) throw err;
//   console.log("MySQL Connected!");
// });

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


local_app.use(express.json())
local_app.set("port", 3001);
local_app.listen(local_app.get("port"), '127.0.0.1', () =>{
  console.info("Application listening on port http://127.0.0.1:"+ local_app.get("port"));
});

public_app.use(express.json())
public_app.set("port", 3000);
public_app.listen(local_app.get("port"), () =>{
  console.info("Application listening on port http://127.0.0.1:"+ local_app.get("port"));
});
public_app.get('/',function(req,res){
    res.sendFile(path.join(__dirname+(ready ? '/index.html' : '/auth.html')));
});
public_app.get('/qrcode.js',function(req,res){
    res.sendFile(path.join(__dirname+'/node_modules/@keeex/qrcodejs-kx/qrcode.min.js'));
});
public_app.get('/getStatus',function(req,res){
    res.send(curr_qr);
});
public_app.get('/getMe',function(req,res){
    // client.getProfilePicUrl(client.info.wid.user).then((value)=>{
    //     res.send({info : client.info, pict : value});
    // });
});
local_app.post('/sendMessage',function(req,res){
    const body = req.body;
    res.statusCode = 400;
    let err_msg = null;
    try {
        const pnumber = body.pnumber ? body.pnumber : '6281234560515';
        if (!pnumber && pnumber.length < 5 || pnumber[0] != '6' || !isNumeric(pnumber))
            res.end(throwError(err_msg = `Isi nomor telepon yang valid! Terisi (+${pnumber})`));
        if (body.message.length < 5)
            res.end(throwError(err_msg = `Pesan tidak boleh kosong!`));
        if (err_msg == null)
            client.sendMessage(`${pnumber}@c.us`, body.message).then(
                (value)=>{
                    res.statusCode = 200;
                    res.end(`<div><pre class="inline text-black mr-2">${getTime()}</pre>Send Message to +${req.body.pnumber}<br><div class="py-1 px-2 bg-chat">${req.body.message}</div></div>`);
                    // con.query("SELECT * FROM db_wa_api.user WHERE pnumber = "+con.escape(pnumber), function(err, result){
                        // if (err){
                        //     console.log("Error (86) " + err);
                        // }
                        // console.log("Result : " + result)
                        // let user_id = "null";
                        // if (result.length > 0){
                        //     user_id = `'${result[0].id}'`;
                            // con.query("INSERT INTO db_wa_api.message (user_id, message, send_at) VALUES ("+user_id+", "+con.escape(body.message)+", NOW());", function (err, result) {
                            //     if (err)
                            //         console.log("Error (108) " + err);
                            // });
                        // } else
                            // con.query("INSERT INTO db_wa_api.user (pnumber, created_at) VALUES ("+con.escape(body.pnumber)+", NOW());", function (err, result) {
                            //     if (err)
                            //         console.log("Error (95) " + err);
                            //     con.query("SELECT * FROM db_wa_api.user WHERE pnumber = "+con.escape(body.pnumber), function(err, result){
                            //         if (err){
                            //             console.log("Error (98) " + err);
                            //         }
                            //         if (result.length > 0)
                            //             user_id = `'${result[0].id}'`;
                                        
                            //         con.query("INSERT INTO db_wa_api.message (user_id, message, send_at) VALUES ("+user_id+", "+con.escape(body.message)+", NOW());", function (err, result) {
                            //             if (err)
                            //                 console.log("Error (108) " + err);
                            //         });
                            //     });
                            // });
                    // })
                    // return updateRequest(body, err_msg);
                }
            ).catch(
                (reason)=>{
                    res.end(throwError(err_msg = reason));
                    return updateRequest(body, err_msg);
                }
            );
        else {
            return updateRequest(body, err_msg);
        }
    }catch(err) {
        res.end(throwError(err_msg = err));
    }
});
public_app.post('/logout',function(req,res){
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

function updateRequest(body, err_msg){
    // try {
    //     const query = "INSERT INTO db_wa_api.request (param, message, error, created_at) VALUES ("+con.escape(JSON.stringify(body))+", "+con.escape(err_msg ? err_msg : "")+" ,"+(err_msg ? '1' : '0')+", NOW());";
    //     con.query(query , function (err, result) {
    //         if (err)
    //             console.log("Error (116) " + err);
    //     });
    //     return;
    // }catch(err) {
    //     return res.end(throwError(err));
    // }
    return;
}
