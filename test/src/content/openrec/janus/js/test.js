'use strict';
// This is a basic test file for use with testling.
// The test script language comes from tape.
var test = require('tape');

var webdriver = require('selenium-webdriver');
var seleniumHelpers = require('webrtc-utilities').seleniumLib;

var openWinMax = 1;      // 测试开启窗口的数量
var loadWaitMax = 5000;  // 页面加载等待超时上限，5秒
var loadWait = 2000;     // 页面加载等待时间，2秒
var printRate = 5000;    // 状态打印频率，5秒

test('Watch the streaming from OPENREC in multi-browser', function(t){
    if (process.env.WIN_COUNT) {
        openWinMax = process.env.WIN_COUNT;
    }
    loadWaitMax = openWinMax * loadWait;
    printRate = loadWaitMax + 5000; 
    console.log('页面加载超时上限：' + loadWaitMax/1000 + '秒');
    console.log('状态打印频率：' + printRate/1000 + '秒/次');
    for (var i = 0; i < openWinMax; i++) {
      var winName = '';
      if (i > 0) {
        winName = 'win' + i;
      }
      var driver = seleniumHelpers.buildDriver(winName);
      open_window(driver, t, winName);
      console.log('The browser ' + i + ' has been opened.');
    }
});

function open_window(driver, t, winName) {
    if (winName !== '') {
        var url = 'file://' + process.cwd() + '/src/content/openrec/janus/index.html';
        driver.executeScript("window.open(arguments[0], arguments[1])", url, winName);
        driver.switchTo().window(winName);
    }
    play_stream_without_action(driver, winName);
}

var startTime = 0;
var firstReceivedFrame = 0;
var firstFramesDecoded = 0;
var duration = 0;

// 打开自动播放页面
function play_stream_without_action(driver, winName){
    if (winName === '') {
       driver.get('file://' + process.cwd() + '/src/content/openrec/janus/index.html');
       winName = 'win0';
    }
    driver.then(function(){
        return driver.manage().timeouts().implicitlyWait(5, 10);
    })
    .then(function(){
        driver.wait(webdriver.until.elementLocated(webdriver.By.id('remotevideo')), loadWaitMax)
        .then(function(){
            return driver.findElement(webdriver.By.id('remotevideo'));
        })
        // .then(function(media){
        //     media.getAttribute('width').then(function(w) {
        //         console.log(winName + ' width: ' + w);
        //     });
        //     media.getAttribute('height').then(function(h) {
        //         console.log(winName + ' height: ' + h);
        //     });
        // })
        .then(function(){
            var winFrameReceived = new Map(Object.entries({}));
            setInterval(function(){
                seleniumHelpers.getStats(driver, 'cpc').then(function(stats){
                    stats.forEach(function(report) {
                        if (report.type === 'track' && report.kind === 'video') {
                            var currentFrameReceived = report.framesReceived;
                            var currentFramesDecoded = report.framesDecoded;
                            var currentTime = report.timestamp;
                            if (startTime == 0) {
                                startTime = currentTime;
                                firstReceivedFrame = currentFrameReceived;
                                firstFramesDecoded = currentFramesDecoded;
                            } else {
                                duration = Math.round((currentTime - startTime) / 1000);
                            }
                            winFrameReceived['framesReceived'] = currentFrameReceived;
                            winFrameReceived['framesDecoded'] = currentFramesDecoded;
                            winFrameReceived['time'] = duration;
                            if (duration > 0) {
                                winFrameReceived['receivedFps'] = Math.round((currentFrameReceived - firstReceivedFrame) / duration);
                                winFrameReceived['decodedFps'] = Math.round((currentFramesDecoded - firstFramesDecoded) / duration);
                            }
                        }
                        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                           winFrameReceived['packetsLost'] = report.packetsLost;
                           winFrameReceived['nackCount'] = report.nackCount;

                        }
                        // console.log(winName + ':' + JSON.stringify(report));
            });
            });
                console.log(winName + ':' + JSON.stringify(winFrameReceived));
                var lastWinName = 'win' + (openWinMax - 1);
                if (winName === lastWinName) {
                    console.log('---------------------------');
                }
            }, printRate);
        });
    });
}