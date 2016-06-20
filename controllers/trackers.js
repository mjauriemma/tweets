'use strict';

/**
 * Controller responsible for creating a relationship with the Shimmer service,
 * and requesting data for activity trackers
 * @author Matthew Auriemma
 * @module apia/controllers/trackers
 */

var async = require('async');
var express = require('express');
var router = express.Router();

var config = require('./../config/config');
//var middleware = require('./../middleware');
//var track = require('./../models/activity_trackers');
var webUtil = require('./../helpers/web/util');


router.get('/connect', //middleware.authorization,
    /**
     * Get a list of all education topics. Returns 500 on server error.
     * @param {express.Request} req request
     * @param {express.Response} res response
     *
     * @function get
     */
    function get (req, res) {


        track.connect('fitbit', null, function (err, result) {
            if (err) {
                return webUtil.processError(res, 500, err.message);
            }
            else {
                //console.log("result: " + result);
                return res.json({
                    status: 'success',
                    redirect: result
                });
            }
        })



    });

router.get('/data', //middleware.authorization,
    /**
     * Get data for a user. Returns 500 on server error.
     * @param {express.Request} req request
     * @param {express.Response} res response
     *
     * @function get
     */
        function get (req, res) {


        track.fetch('fitbit', 'steps', 'Matthew', function (err, result) {
            if (err) {
                return webUtil.processError(res, 500, err.message);
            }
            else {
                //console.log("result: " + result);
                return res.json({
                    status: 'success',
                    redirect: result
                });
            }
        })



    });


module.exports = router;
