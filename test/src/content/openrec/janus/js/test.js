'use strict';
// This is a basic test file for use with testling.
// The test script language comes from tape.
var test = require('tape');

var webdriver = require('selenium-webdriver');
var seleniumHelpers = require('webrtc-utilities').seleniumLib;

var open_win_max = 5;

test('Watch the streaming from OPENREC in multi-browser', function(t){
    var driver = seleniumHelpers.buildDriver();
    for (var i = 0; i < open_win_max; i++) {
      if (i == 0) {
        open_window(driver, t, '');
      } else {
        var win_name = 'win' + i;
        open_window(driver, t, win_name);
      }
      console.log('The browser ' + i + ' has been opened.');
    }
});

function open_window(driver, t, win_name) {
    if (win_name != '') {
        driver.executeScript("window.open(arguments[0], arguments[1])", '', win_name);
        driver.switchTo().window(win_name);
    }
    play_stream_without_action(driver);
}

// 打开自动播放页面
function play_stream_without_action(driver){
    driver.get('file://' + process.cwd() + '/src/content/openrec/janus/index.html')
    .then(function(){
        return driver.manage().timeouts().implicitlyWait(5, 10);
    })
    .then(function(){
        driver.wait(webdriver.until.elementLocated(webdriver.By.id('remotevideo')), 5000)
        .then(function(){
            return driver.findElement(webdriver.By.id('remotevideo'));
        })
        .then(function(media){
            media.getAttribute('width').then(function(w) {
                console.log('width: ' + w);
            });
            media.getAttribute('height').then(function(h) {
                console.log('height: ' + h);
            });
        });
    });
}