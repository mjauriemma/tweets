'use strict';

/**
 * Middleware responsible for checking if a user's Authorization is valid.
 * @author Cooper Filby
 * @module idology/middleware/authorization
 */

var config = require('./../config/config');

var authorization = require('express-jwt')({
    secret: config.token.key
});

module.exports = authorization;