'use strict';

/**
 * BadInput errors are used to denote that a server error was a result of bad user input.
 * Normally at the web layer these will translate to responses with a 400 status code, and the message parameter
 * may be displayed directly on the client.
 * @module assessment/helpers/error/BadInput
 */

var util = require('util');

module.exports = BadInput;

/**
 * Create a new BadInput Error object with the provided message.
 * @param {string} message User friendly error message explaining how the provided input was bad.
 * @constructor
 */
function BadInput(message) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
    this.message = message;
    this.statusCode = 400;
}

util.inherits(BadInput, Error);
