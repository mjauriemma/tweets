'use strict';


let https = require('https');
var config = require('../config/config');
var terms = require('../terms');
var Twitter = require('twitter');
var querystring = require("querystring");
var FetchTweets = require('fetch-tweets');
let Promise = require('bluebird');
let fs = require('fs');

var dbFactory = require('./db');
var db = Promise.promisifyAll(dbFactory(config.db));
let schema = require('./schema').tweets;

var apiKeys = {
  consumer_key: config.tweet.consumer_key,
  consumer_secret: config.tweet.consumer_secret
};

var fetchTweets = new FetchTweets(apiKeys, false);

function search(queries, callback) {
  var date = new Date();
  var results=[];

  terms.queries.forEach(function process(element, index, array){
    // console.log("term: " + element.query);

      fetch({
        //q: 'humira',
        q: element.query,
        lang: 'en',
        count: 100,
        include_entities: 'FALSE',
        until: (date.getFullYear() + '-' + (date.getMonth()+1) +'-'+ date.getDate())
      }, results, function (err, result) {
        if (err) {
          return callback(err);
        }
        else {
          console.log('FINISHED')
          results.push(result);
        }
      });
  });
  // console.log("results callback");
  return callback (null, results);
};

function fetch (options, res, callback) {

  fetchTweets.byTopic(options, function(results){
    var term = options.q;
    var id;
    if (results.statuses.length > 0) {
     results.statuses.forEach(function process (element, index, array) {
       id = element.id;
       if(element.text.indexOf('RT') === -1) {
         var date2 = new Date(Date.parse(element.created_at.replace(/( \+)/, ' UTC$1')));
         if (element.place === null) {
           //console.log(options.q);
           create(element.id, (date2.getMonth()+1), date2.getDate(), date2.getFullYear(), element.text, element.user.location, null, null, element.retweet_count, element.favorite_count, date2, term, function (err, result) {
             if (err) {
               console.log(err.message)
               return callback(err);
             }
           })
         } else {
           //console.log("Lat: " +element.place.bounding_box.coordinates[0][0][0] +"Lon: "+ element.place.bounding_box.coordinates[0][0][1])
           //console.log(options.q);
           create(element.id, (date2.getMonth()+1), date2.getDate(), date2.getFullYear(), element.text, element.user.location, element.place.bounding_box.coordinates[0][0][0], element.place.bounding_box.coordinates[0][0][1], element.retweet_count, element.favorite_count, date2, term, function(err, result) {
             if (err) {
               console.log(err.message);
               return callback(err);
             }
           });
         }
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
        callback(null, res);
      }
  });
};


function create(tweetId, month, day, year, text, loc, lat, lon, rt, fav, date, term, callback) {
  // let query = schema.insert({
  //   id: tweetId,
  //   month: month,
  //   day: day,
  //   year: year,
  //   text: text,
  //   location: loc,
  //   lat: lat,
  //   long: lon,
  //   retweet_count: rt,
  //   fav_count: fav,
  //   date: date
  // }).toQuery();
  //console.log(query);
  //return db.executeSqlQueryAsync(query)
  let query = "INSERT INTO `tweets`  (`id`, `month`, `day`, `year`, `text`, `location`, `lat`, `long`, `retweet_count`, `fav_count`, `date`, `query`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
//console.log("Term: " + term);
  return db.executeQueryAsync(query,[tweetId, month, day, year, text, loc, lat, lon, rt, fav, date, term], callback)
    .then(function(result) {
      return result.insertId;
    })
    .nodeify(callback);
}


function exportData (callback) {
  let query = "Select * FROM `tweets` WHERE `export` = 0";
  return db.executeQuery(query,[], callback)
  .then(function(result) {
    return fs.writeFile('~/tweetStorage/tweets.csv', result, function(err) {
      if (err) return console.log(err);
    })
  })
  .nodeify(callback);
}

exports.exportData = exportData;
exports.search = search;
