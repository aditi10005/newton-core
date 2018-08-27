var http = require('http'),
    faye = require('faye');
var fs = require('fs');
var server = http.createServer(),
    bayeux = new faye.NodeAdapter({ mount: '/newton', timeout: 45 });
var serveStatic = require('serve-static');
var finalhandler = require('finalhandler')
;
const config = require('./config');
const imPort = config.imPort;

// Serve client file
var serve = serveStatic('js', {'index': ['imclient.js']});

// Handle non-Bayeux requests
var server = http.createServer(function(request, response) {
    if (request.url === "/")
    {
        serve(request, response, finalhandler(request, response));
        return;
    }
    else {
        response.writeHead(200, { 'Content-Type': 'text/plain' });
        response.end('Hello, non-Bayeux request');
    }
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
        var token = registry["/app/2310h7"];
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
server.listen(imPort);