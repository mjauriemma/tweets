'use strict';

/**
 * Module meant to provide useful functions to reduce overall code bloat for web layer modules.
 * @author Cooper Filby
 * @module apia/controllers/web-util
 */

/**
 * Create and response to the provided Express response object with a JSON formatted error message, using the status
 * code provided.
 * @param {express.Response} res Express response object
 * @param {number} code HTTP Status code
 * @param {string} errorMessage a message detailing what error occurred
 * @param {string} [extra] Kind of a hodgepodge field meant to allow a user to throw in more information or JSON
 */
var processError = function (res, code, errorMessage, extra) {
    res.status(code);
    return res.json({
        type: 'err',
        err: true,
        message: errorMessage,
        extra: extra
    });
};

// Module Exports
exports.processError = processError;