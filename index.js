var http = require('http'),
    faye = require('faye');
var fs = require('fs');

var server = http.createServer(),
    bayeux = new faye.NodeAdapter({ mount: '/newton', timeout: 45 });

var express = require("express");           // web framework external module
var serveStatic = require('serve-static');  // serve static files
var socketIo = require("socket.io");        // web socket external module
var easyrtc = require("easyrtc");               // EasyRTC external module


const config = require('./config');
const port = config.port;

// Set process name
process.title = "node-easyrtc";

// Handle non-Bayeux requests
var app = express();
app.use(serveStatic('static', {'index': ['index.html']}));
app.use(serveStatic('static', {'newtonjs': ['newtonjs.js','js/socket.io.js','js/easyrtc.js','js/rates.js','js/low_bw.js','js/faye.js','test']}));

var server = http.createServer(app);

// Start Socket.io so it attaches itself to Express server
var socketServer = socketIo.listen(server, {"log level":1});

easyrtc.setOption("logLevel", "debug");

// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on("easyrtcAuth", function(socket, easyrtcid, msg, socketCallback, callback) {
    easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, function(err, connectionObj){
        if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
            callback(err, connectionObj);
            return;
        }

        connectionObj.setField("credential", msg.msgData.credential, {"isShared":false});

        console.log("["+easyrtcid+"] Credential saved!", connectionObj.getFieldValueSync("credential"));

        callback(err, connectionObj);
    });
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on("roomJoin", function(connectionObj, roomName, roomParameter, callback) {
    console.log("["+connectionObj.getEasyrtcid()+"] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
    easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});

// Start EasyRTC server
var rtc = easyrtc.listen(app, socketServer, null, function(err, rtcRef) {
    console.log("Initiated");

    rtcRef.events.on("roomCreate", function(appObj, creatorConnectionObj, roomName, roomOptions, callback) {
        console.log("roomCreate fired! Trying to create: " + roomName);

        appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
    });
});

var serverAuth = {
    incoming: function(message, callback) {
        // Let non-subscribe messages through
        if (message.channel !== '/meta/subscribe') 
             return callback(message);

        // Get subscribed channel and auth token
        var subscription = message.subscription;
        var msgToken = message.ext  && message.ext.authToken;

        // Find the right token for the channel
        this._fileContent = this._fileContent || fs.readFileSync('./tokens.json');

        var registry = JSON.parse(this._fileContent.toString());
        var token = registry["rebound_2313"];
        console.log("Saved Token, " + token);
        console.log("USER Token, " + msgToken);
        console.log("Message" + JSON.stringify(message));
        console.log("subscription, " + subscription);
        // Add an error if the tokens don't match
        if (token !== msgToken)
            message.error = 'Invalid subscription auth token';

        // Call the server back now we're done
        callback(message);
    }
};

bayeux.addExtension(serverAuth);
bayeux.attach(server);
server.listen(port);