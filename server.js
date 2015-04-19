
// Simple Swarm sync server: picks model classes from a directory,
// starts a WebSocket server at a port. Serves some static content,
// although I'd recomment to shield it with nginx.
var fs = require('fs');
var path = require('path');
var url = require('url');
var http = require('http');

var redis = require('redis');
var ws_lib = require('ws');
var express = require('express');
var compression = require('compression');

var Swarm = require('swarm');
var RestAPI = require('swarm-restapi');
var leveldown = require('leveldown');
var EinarosWSStream = require('swarm/lib/EinarosWSStream');

var args = process.argv.slice(2);
var argv = require('minimist')(args, {
    alias: {
        models: 'm',
        port:  'p',
        debug: 'D',
        store: 's'
    },
    boolean: ['debug'],
    default: {
        models: 'model/',
        store: '.swarm',
        port: 8000,
        debug: false
    }
});

Swarm.env.debug = true;

var app = express();
app.use(compression());
app.use(express.static('./client'));
app.use(express.static('./dist'));

var fileStorage = new Swarm.FileStorage(argv.store);

var redisStorage = new Swarm.RedisStorage('dummy', {
    redis: redis,
    redisConnectParams: {
        port: 6379,
        host: '127.0.0.1',
        options: {}
    }
});

redisStorage.open(function (conn) {
    console.log("Redis connection up");
});

// create Swarm Host
app.swarmHost = new Swarm.Host('swarm~nodejs', 0, fileStorage);
Swarm.env.localhost = app.swarmHost;

var apiHandler = RestAPI.createHandler({
    route: '/api',
    host: app.swarmHost
});

app.get(/^\/api\//, apiHandler);
app.post(/^\/api\//, apiHandler);
app.put(/^\/api\//, apiHandler);

// start the HTTP server
var httpServer = http.createServer(app);

httpServer.listen(argv.port, function (err) {
    if (err) {
        console.warn('Can\'t start server. Error: ', err, err.stack);
        return;
    }
    console.log('Swarm server started port', argv.port);
});

// start WebSocket server
var wsServer = new ws_lib.Server({
    server: httpServer
});

// accept pipes on connection
wsServer.on('connection', function (ws) {
    var params = url.parse(ws.upgradeReq.url, true);
    console.log('incomingWS %s', params.path, ws.upgradeReq.connection.remoteAddress);
    if (!app.swarmHost) {
        return ws.close();
    }
    app.swarmHost.accept(new EinarosWSStream(ws), { delay: 50 });
});

process.on('SIGTERM', onExit);
process.on('SIGINT', onExit);
process.on('SIGQUIT', onExit);

process.on('uncaughtException', function (err) {
    console.error('Uncaught Exception: ', err, err.stack);
    onExit(2);
});

function onExit(exitCode) {
    console.log('shutting down http-server...');
    httpServer.close();

    if (!app.swarmHost) {
        console.log('swarm host not created yet...');
        return process.exit(exitCode);
    }

    console.log('closing swarm host...');
    var forcedExit = setTimeout(function () {
        console.log('swarm host close timeout');
        process.exit(exitCode);
    }, 5000);

    app.swarmHost.close(function () {
        console.log('swarm host closed');
        clearTimeout(forcedExit);
        process.exit(exitCode);
    });
}

// boot model classes
var modelPathList = argv.models;
modelPathList.split(/[:;,]/g).forEach(function (modelPath) {
    modelPath = path.resolve(modelPath);
    console.log('scanning',modelPath);
    var modelClasses = fs.readdirSync(modelPath), modelFile;
    while (modelFile = modelClasses.pop()) {
        if (!/^\w+\.js$/.test(modelFile)) { continue; }
        var modpath = path.join(modelPath, modelFile);
        var fn = require(modpath);
        if (fn.constructor !== Function) { continue; }
        if (fn.extend !== Swarm.Syncable.extend) { continue; }
        console.log('Model loaded', fn.prototype._type, ' at ', modpath);
    }
});
