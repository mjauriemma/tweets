'use strict';

/**
 * Directory containing useful error objects to provide more expressive error messages.
 * @author Cooper Filby
 * @module assessment/helpers/error
 */

var fs = require('fs');

fs.readdir(__dirname, function(err, files) {
  if (err) {
    console.log(err);
  }

  files.forEach(function(file) {
    file = file.replace('.js', '');
    if (file !== 'index') {
      exports[file] = require('./' + file);
    }
  });
});
