/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */

'use strict';
var test = require('tape');

// Add all test files here with a short comment.

// Tests basic functionality of the the gum demo.
require('../src/content/openrec/janus/js/test');

// This is run as a test so it is executed after all tests
// have completed.
test('Shutdown', function(t) {
  var driver = require('webrtc-utilities').seleniumLib.buildDriver();
  driver.close()
  .then(function() {
    driver.quit().then(function() {
      t.end();
    });
  });
});
