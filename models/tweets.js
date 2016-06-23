'use strict';


let https = require('https');
var config = require('../config/config');
var terms = require('../terms');
var Twitter = require('twitter');
var querystring = require("querystring");
var FetchTweets = require('fetch-tweets');

var apiKeys = {
  consumer_key: config.tweet.consumer_key,
  consumer_secret: config.tweet.consumer_secret
};

var fetchTweets = new FetchTweets(apiKeys, false);

function search(queries, callback) {
  var date = new Date();
  //queries = [{query :'humira'}, {query: 'apple'}];
  var results=[];
  terms.queries.forEach(function process(element, index, array){
    console.log("term: " + element.query);
      // fetch({
      //   q: element.query,
      //   lang: 'en',
      //   count: 100,
      //   include_entities: 'FALSE',
      //   until: (date.getFullYear() + '-' + (date.getMonth()+1) +'-'+ date.getDate())
      // }, results, function (err, result) {
      //   if (err) {
      //     return callback(err);
      //   }
      //   else {
      //     console.log('FINISHED')
      //     results.push(result);
      //   }
      // });
  });
  console.log("results callback");
  return callback (null, results);
};

function fetch (options, res, callback) {

  fetchTweets.byTopic(options, function(results){
    var id;
    console.log("length " + results.statuses.length);
    if (results.statuses.length > 0) {
     //console.log("hello!");
     results.statuses.forEach(function process (element, index, array) {
       id = element.id;
       if(element.text.indexOf('RT') === -1) {
         var date2 = new Date(Date.parse(element.created_at.replace(/( \+)/, ' UTC$1')));
         //console.log((date2.getMonth() + 1) + '-' + date2.getDate() + '-' + date2.getFullYear());
         res.push(id);
        }
      });
      if (results.statuses.length===100) {
        return fetch ({
          q: options.q,
          lang: 'en',
          count: 100,
          include_entities: 'FALSE',
          max_id: id
          }, res, callback);
        }
        else {
          return callback (null, res);
        }
      }
      else {
        console.log('Done');
        callback(null, res);
      }
  });
};

exports.search = search;
