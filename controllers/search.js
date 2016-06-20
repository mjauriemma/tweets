'use strict';

let Promise = require('bluebird');
let express = require('express');
let router = express.Router();

let tweets = Promise.promisifyAll(require('../models/tweets'));
let webUtil = require('../helpers/web/util');
let errors = require('../helpers/error');


router.get('/', (req, res) => {
    let term = req.query.term;
    console.log("In Controller");
    console.log(term);
    if (!term) {
        return webUtil.processError(res, 400, 'Search query param must be provided', 400);
    }

    tweets.searchAsync(term)
        .then(response => {
          //console.log("Answer: " + JSON.stringify(response));
            return res.json(response);
        })
        .catch(err => {
            return webUtil.processError(res, err.message, 500);
        });
});




module.exports = router;
