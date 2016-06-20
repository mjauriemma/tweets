'use strict';

/**
 * Driver program for the RheumPRO APIA service.
 * @author Cooper Filby
 * @module idology/server
 */

var fs = require('fs');
var https = require('http');
//var https = require('http');


var config = require('./config/config');
var app = require('./config/app')();

//try {
//    var options = {
//        key: fs.readFileSync(config.https.key_path),
//        cert: fs.radFileSync(config.https.cert_path)
//    };
//} catch (e) {
//    console.log('ERROR: Unable to read SSL Certs, check your config settings.');
//    process.exit(1);
//}

// Start the server
var server = https.createServer(app);
server.listen('8080', function () {
    console.log("%s listening on port %s.", config.app.name, 8080);
});

