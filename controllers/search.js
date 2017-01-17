'use strict';

let Promise = require('bluebird');
let express = require('express');
let router = express.Router();

let tweets = Promise.promisifyAll(require('../models/tweets'));
let webUtil = require('../helpers/web/util');
let errors = require('../helpers/error');


router.get('/', (req, res) => {
    tweets.searchAsync()
        .then(response => {
            return res.json(response);
        })
        .catch(err => {
            return webUtil.processError(res, err.message, 500);
        });
});




module.exports = router;
