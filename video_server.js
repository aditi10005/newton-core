var express = require('express')
,	path = require('path')
,	streams = require('./utils/streams.js')();

var favicon = require('serve-favicon')
,	logger = require('morgan')
,	methodOverride = require('method-override')
,	bodyParser = require('body-parser')
,	errorHandler = require('errorhandler');

const config = require('./config');
const videoPort = config.videoPort;

var app = express();

// all environments
app.set('port', videoPort);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}

// routing
require('./utils/routes.js')(app, streams);

var server = app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server);
/**
 * Socket.io event handling
 */
require('./utils/socketHandler.js')(io, streams);