'use strict';
/**
 * Error type used to indicate that user is attempt to access a resource they lack permissions for. Usually causes a 403 error to be returned
 * to the requester.
 * @author Cooper Filby
 * @module apia/helpers/error/NotScoreable
 */

var util = require('util');

module.exports = NotScoreable;

/**
 * Permission Errors are used to indicate that the error was caused by
 * the user trying to access a resource they do not have permissions to.
 * @param {string} message error message
 * @constructor
 */
function NotScoreable(message) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
    this.message = message;
    this.statusCode = 400;
}

util.inherits(NotScoreable, Error);
