'use strict';


let https = require('https');
var config = require('../config/config');
var Twitter = require('twitter');
var querystring = require("querystring");
var FetchTweets = require('fetch-tweets'); // Include the module

// Specify Twitter keys (preferably in an external .gitignore'd file)
var apiKeys = {
  consumer_key: config.tweet.consumer_key,
  consumer_secret: config.tweet.consumer_secret
};

var fetchTweets = new FetchTweets(apiKeys, false);

function search(query, callback) {

  var options = {
    q: query,
    lang: 'en',
    count: 1000,
    include_entities: 'FALSE',
    until: '2016-06-19'
  }

 fetchTweets.byTopic(options, function(results){
  //  var count = 0;
  //  var keys = Object.keys(results);
  //  for (var i = 0,length = keys.length; i < length; i++) {
  //    console.log(i);
  //    console.log(results[keys[i]]);
  //  }
  

    return callback(null, results);
  });
};

exports.search = search;
