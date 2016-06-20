'use strict';

/**
 * Error type used to indicate that user request object has not been found. Usually causes a 404 error to be returned
 * to the requester.
 * @author Cooper Filby
 * @module apia/helpers/error/DB
 */

var util = require('util');

module.exports = NotFound;

/**
 * NotFound Errors are used to indicate that the error was caused by
 * the user trying to access a resource that doesn't exist.
 * @param {string} message error message
 * @constructor
 */
function NotFound(message) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
    this.message = message;
    this.statusCode = 404;
}

util.inherits(NotFound, Error);
