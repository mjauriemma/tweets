'use strict';

/**
 * Module responsible for handling DB interactions and adding a layer of abstraction between the selected DB Driver.
 * @author Cooper Filby
 * @module apia/models/db
 */

// FIXME: Currently using connection.destroy() instead of connection.release();
// HSIS Environment doesn't seem to play nicely with connection pooling.
// As far as I can tell, the connection gets killed improperly, meaning the
// connection waits 10 seconds for a ping response before closing.
// Cooper Filby - 5/9/16

var config = require('../config/config');
var errors = require('../helpers/error');
var util = require('util');
var async = require('async');
var moment = require('moment');
var mysql = require('mysql');

let dbObj;

/**
 * Create or get a reference to an existing Database Object.
 * Follows a singleton pattern, but allows for unique creation of DbUtil objects
 * for testing purposes.
 * @param {object} config Database Configuration information
 * @param {boolean} newInstance boolean indicating if an independent instance should be created.
 * Primarily intended for testing.
 * @returns {DbUtil}
 */
module.exports = function createDb(config, newInstance) {
    if (newInstance) {
        return new DbUtil(config);
    }

    if (!dbObj) {
        dbObj = new DbUtil(config);
    }

    return dbObj;
};

class DbUtil {
    constructor(config) {
        this.config = config;
        this.pool = mysql.createPool(config);
    }

    executeQuery(query, values, callback) {
        return this.executeOptionsQuery({
            sql: query,
            values: values
        }, callback);
    }

    executeSqlQuery(sqlQueryObj, callback) {
        return this.executeOptionsQuery({
            sql: sqlQueryObj.text,
            values: sqlQueryObj.values
        }, callback);
    }

    getSingleSqlQueryResult(sqlQueryObj, callback) {
        return this.executeSqlQuery(sqlQueryObj, (err, results) => {
            if (err) {
                return callback(err);
            } else if (!results.length) {
                return callback(new errors.NotFound('No matching entry found!'));
            } else {
                return callback(null, results[0]);
            }
        });
    }

    executeOptionsQuery(queryObj, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) {
                return callback(err);
            }
            connection.query(queryObj, (err, result) => {
                this.closeConnection(connection);

                if (err) {
                    return callback(err);
                }

                return callback(null, result);
            });
        });
    }

    executeParallelTransaction(queries, resultCb) {
        var that = this;
        var connection;

        async.series([
                function(callback) {
                    that.pool.getConnection(function(err, con) {
                        if (err) {
                            return callback(err);
                        }
                        connection = con;
                        return callback(null);
                    });
                },

                function(callback) {
                    return connection.beginTransaction(callback);
                },

                function(callback) {
                    async.each(queries, function(query, eachCb) {
                        connection.query(query, eachCb);
                    }, callback);
                },

                function(callback) {
                    return connection.commit(callback);
                }

            ],
            function(err) {
                if (err) {
                    if (connection) {
                        connection.rollback(function(err) {
                            that.closeConnection(connection);
                            if (err) {
                                console.log(err);
                            }
                        });
                    }

                    return resultCb(err);
                }
                that.closeConnection(connection);

                return resultCb(null);
            });
    }


    /**
     * Execute a series of interdependent SQL Insertion Queries in a generic manner. Returns all of the saved object keys.
     * Query Object Keys:
     *  - sql - string - SQL Query to execute
     *  - values - array - Array containing SQL query values
     *  - save - string - Optional key that allows you to specify what to save the insertId as for another query to use
     *  - inject - array of strings - Optional array that specifies what keys to inject into the value string. When
     *      injecting into an array object, the values will be appended to the front of the array in the order specified.
     *
     *  Example Dependent Query Objects:
     *  [{
     *      sql: 'INSERT INTO person SET ?',
     *      values: [{ name: 'Sterling Archer'}],
     *      save: 'person_id'
     *  }, {
     *      sql: 'INSERT INTO possible_father (`son_id`, `father_name`) VALUES ?',
     *      values: [[['Nikolai Jakov'], ['Len Drexler'], ['Buddy Rich']]],
     *      inject: ['person_id']
     *  }]
     *
     *  The first query would be executed, and the insertId for SterlingArcher would be saved as person_id.
     *  Upon running the second query, the person_id would be injected onto the front of each nested value array,
     *  so values would look like: [[[1, 'Nikolai Jakov'], [1, 'Len Drexler'], [1, 'Buddy Rich']]], before insertion.
     *
     * This is mostly intended to be used for the RheumPRO Registration Query, as there are 5-6 inserts that must be
     * completed as part of a transaction, including:
     *  - Insert Patient
     *  - Create Encounter
     *  - Insert Conditions
     *  - Insert Medications - Optional
     *  - Insert Cohort Registration
     *  - Insert Consent Signature
     *  - Insert Signed Consent Items
     *
     * @param {Array.<{sql: string, values: string[], save: string, inject: string[]}>} queries array of SQL query objects
     * @param {function} resultCb err/result callback that returns any errors or the saved insertIds
     */
    executeSerialInsertTransaction(queries, resultCb) {
        var that = this;
        var saved = {};
        var connection;

        async.series([
                function(callback) {
                    that.pool.getConnection(function(err, con) {
                        if (err) {
                            return callback(err);
                        }
                        connection = con;
                        return callback(null);
                    });
                },

                function(callback) {
                    return connection.beginTransaction(callback);
                },

                function(callback) {
                    async.eachSeries(queries, function(query, eachCb) {
                        if (query.inject) {
                            that.injectValues(saved, query);
                        }

                        connection.query(query, function(err, result) {
                            if (err) {
                                return eachCb(err);
                            }

                            if (query.save) {
                                saved[query.save] = result.insertId;
                            }

                            return eachCb(null);
                        });
                    }, callback);
                },

                function(callback) {
                    return connection.commit(callback);
                }

            ],
            function(err) {
                if (err) {
                    if (connection) {
                        connection.rollback(function(err) {
                            that.closeConnection(connection);
                            if (err) {
                                console.log(err);
                            }
                        });
                    }

                    return resultCb(err);
                }
                that.closeConnection(connection);

                return resultCb(null, saved);
            });
    }

    /**
     * Function responsible for injecting keys specified into the 'inject' key of the query object into the values array
     * for database insertion.
     *
     * Handles four specific cases for the values array:
     *      1) Array of Objects - values = [{}, {}, ...]
     *      2) Array of Arrays - values = [[], [], ...]
     *      3) Array of Nested Arrays - values = [[[], [], ...]]
     *      4) Array of Args - values = [1, 2, ...]
     *
     *  The function is really only meant for formatting simple insertion cases, such as:
     *      INSERT INTO example SET ? - values = [{arg1: value, arg2: value, ...}]
     *      INSERT INTO example (`a`,`b`,`c`) VALUES ? - [[a, b, c]]
     *      INSERT INTO example (`a`,`b`,`c`) VALUES ? - [[[a, b, c], [d, e, f], ...]]
     *
     *
     * @param {object} saved contains saved result ids
     * @param {{sql: string, values: string[], save: string, inject: string[]}} query
     */
    injectValues(saved, query) {
        var j;

        if (query.values.length === 0) {
            for (j = query.inject.length - 1; j >= 0; j--) {
                query.values.unshift(saved[query.inject[j]]);
            }
            return;
        }

        for (var i = 0; i < query.values.length; i++) {
            // Check if values is an Array of Arrays or a Doubly Nested Array of Arrays
            if (query.values[i] instanceof Array) {
                if (!(query.values[i][0] instanceof Array)) {
                    for (j = query.inject.length - 1; j >= 0; j--) {
                        query.values[i].unshift(saved[query.inject[j]]);
                    }
                } else {
                    for (var k = 0; k < query.values[i].length; k++) {
                        for (j = query.inject.length - 1; j >= 0; j--) {
                            query.values[i][k].unshift(saved[query.inject[j]]);
                        }
                    }
                }
            }

            // Check if Values is an Array of Objects
            else if (query.values[i] instanceof Object) {
                for (j = 0; j < query.inject.length; j++) {
                    query.values[i][query.inject[j]] = saved[query.inject[j]];
                }
            }

            // Push injected
            else {
                for (j = query.inject.length - 1; j >= 0; j--) {
                    query.values.unshift(saved[query.inject[j]]);
                }
                break;
            }
        }
    }

    /**
     * Create an SQL Query Object for use in serial insert transactions
     * @param {string} sql
     * @param {array} values
     * @param {string} [save]
     * @param {array} [inject]
     * @returns {{sql: *, values: *, save: *, inject: *}}
     */
    createQueryObject(sql, values, save, inject) {
        return {
            sql: sql,
            values: values,
            save: save,
            inject: inject
        };
    }

    buildQueryValueObject(keys, object) {
        var newObject = {};
        for (var i = 0; i < keys.length; i++) {
            if (object[keys[i]]) {
                newObject[keys[i]] = object[keys[i]];
            }
        }
        return newObject;
    }

    closeConnection(connection) {
        if (this.config.killConnection) {
            connection.destroy();
        } else {
            connection.release();
        }
    }

    close() {
        this.pool.end(function(err) {
            if (err) {
                console.log(err);
            }
        });
    }
}
