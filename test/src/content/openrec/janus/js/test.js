'use strict';
// This is a basic test file for use with testling.
// The test script language comes from tape.
var test = require('tape');

var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;
var seleniumHelpers = require('webrtc-utilities').seleniumLib;

var openWinMax = 1;      // 测试开启窗口的数量
var loadWaitMax = 5000;  // 页面加载等待超时上限，5秒
var printRate = 5000;    // 状态打印频率，5秒
var reloadTimes = 1;              // 为使视频在页面上显示进行重新加载回数计数

var PAGE_LOAD_TIME = 2000;        // 页面加载预计耗时，1秒
var RELOAD_WAIT = 5000;           // 为使视频在页面上显示进行重新加载的间隔时间

test('Watch the streaming from OPENREC in multi-browser', function(t){
    if (process.env.WIN_COUNT) {
        openWinMax = process.env.WIN_COUNT;
    }
    loadWaitMax = openWinMax * PAGE_LOAD_TIME;
    printRate = loadWaitMax + 5000; 
    console.log('页面加载超时上限：' + loadWaitMax/1000 + '秒');
    console.log('状态打印频率：' + printRate/1000 + '秒/次');
    console.log('浏览器：' + process.env.BROWSER);

    // 启动浏览器，并打开指定数量的窗口
    for (var i = 0; i < openWinMax; i++) {
      var winName = 'win' + i;
      var driver = seleniumHelpers.buildDriver(winName);

      if (i == 0) {
        console.log('The window 0 has been opened.');
      } else {
        open_new_window(driver, t, winName);
        console.log('The window ' +  i + ' has been opened.');
    }
    }

    // 使所有窗口打开视频播放页面，如视频未自动播放，则每隔5秒刷新一次页面，直至视频显示
    var readyCount = 0;
    driver.wait(function() {
        // console.log('>>> readyCount:' + readyCount + ', openWinMax:' + openWinMax);

        if (readyCount >= openWinMax) { // 如果所有窗口中的视频均已显示
            console.log('### In all pages, the video stream has been displayed.');
            return true;
        } else {
            driver.getAllWindowHandles().then(function(handles) {
                for (var n = 0; n < handles.length; n++) {
                    driver.switchTo().window(handles[n]);
                    driver.manage().timeouts().implicitlyWait(loadWaitMax);
                    driver.get('file://' + process.cwd() + '/src/content/openrec/janus/index.html')
                    .then(function(){
                        return driver.findElement(By.id('video_showing'));
                    })
                    .then(function(){
                        readyCount = readyCount + 1;
                        // console.log('### The video stream has been display in page.');
                    })
                    .then(null, function(err){
                        // console.log('!!! The video stream has not been display in page yet.');
                    });
                }
                console.log('reloadTimes:' + reloadTimes);
                reloadTimes = reloadTimes + 1;
                driver.sleep(RELOAD_WAIT); // 5秒后重新加载页面
            });
            return false;
    }
    }, 3600000).then(function(){
        console.log('### Start print the report ...');
        var wfr = new Map(Object.entries({}));
        setInterval(function(){  // 按指定时间间隔，将各个窗口的流状态打印到控制台
            driver.getAllWindowHandles().then(function(handles) {
            for (var n = 0; n < handles.length; n++) {
                driver.switchTo().window(handles[n]);
                var wn = 'WIN-' + n;
                // console.log('### Print the report from ' + wn);
                printReport(driver, 'cpc', wn, wfr);
            }
        });
        }, printRate);
        
    });
    
});

function open_new_window(driver, t, winName) {
    driver.executeScript("window.open(arguments[0], arguments[1])", '', winName);
}

var startTime = 0;
var firstReceivedFrame = 0;
var duration = 0;

// 判断视频流是否进入
// function hasVideoStream(driver, peerConnection) {
//     var rvs = false;
//     seleniumHelpers.getStats(driver, peerConnection).then(function(stats){
//         stats.forEach(function(report) {
//             if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
//                rvs = true;
//             }
        //     });
        //     });
//     return rvs;
// }

// 输出状态报告
function printReport(driver, peerConnection, winName, winFrameReceived) {
    seleniumHelpers.getStats(driver, peerConnection).then(function(stats){
                    stats.forEach(function(report) {
            if (process.env.BROWSER === 'chrome') {
                        if (report.type === 'track' && report.kind === 'video') {
                            var currentFrameReceived = report.framesReceived;
                            var currentTime = report.timestamp;
                            if (startTime == 0) {
                                startTime = currentTime;
                                firstReceivedFrame = currentFrameReceived;
                            } else {
                                duration = Math.round((currentTime - startTime) / 1000);
                            }
                            winFrameReceived['framesReceived'] = currentFrameReceived;
                            winFrameReceived['time'] = duration;
                            if (duration > 0) {
                                winFrameReceived['receivedFps'] = Math.round((currentFrameReceived - firstReceivedFrame) / duration);
                            }
                        }
                        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                           winFrameReceived['packetsLost'] = report.packetsLost;
                           winFrameReceived['nackCount'] = report.nackCount;
                }
            }
            if (process.env.BROWSER === 'firefox') {
                if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                    var currentTime = report.timestamp;
                    if (startTime == 0) {
                        startTime = currentTime;
                    } else {
                        duration = Math.round((currentTime - startTime) / 1000);
                    }
                   winFrameReceived['packetsLost'] = report.packetsLost;
                   // There is not item named 'nackCount' in Stats information of Firefox
                   // winFrameReceived['nackCount'] = report.nackCount;
                   winFrameReceived['time'] = duration;
                   winFrameReceived['receivedFps'] =  Math.round(report.framerateMean);
                } 
                        }
                        // console.log(winName + ':' + JSON.stringify(report));
            });
            });
                console.log(winName + ':' + JSON.stringify(winFrameReceived));

    var lastWinName = 'WIN-' + (openWinMax - 1);
                if (winName === lastWinName) {
                    console.log('---------------------------');
                }
}