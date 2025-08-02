if (typeof vino === 'undefined') { // If not on a WiiU, emulate the Vino and WiiU Gamepad APIs.
    console.log('Initialize API emulation');
    if (typeof wiiu === 'undefined') { window.wiiu = {}, window.wiiu.gamepad = { update: function () { } }; }

    // fake console data
    var debugConsole = {
        nnid: "prodtest1",
        name: "Vino Debug",
        mii: "AwEAQBs8xqsHR9PC3MXz5YXEaBemLwAAVllEAGEAdgBpAGQAIABKAG8AYQBxAExRABBXAAJoRBgTZEUUgRIZZg4AACkAaGdQYgBpAGcAIABzAGEAbAB0AHkAAAAAAC96",
        pid: 1788259488,
        country: "US",
        language: "EN",

        fl: "1236925795,1166356730,1409518437,1088392656,1090934832,1573645812,1672254576,1746347141,1112166243,1773702389,1541552688,1679086960,1609011959,1371173300,1426703823,1381149235,1338603408,1122156854,1309239659,1427220684,1498872945,1468960081,1029645862,1092713399,1413957266,1106036020,1637587789,1391350154,1672305136,1098860494"
    };

    window.vino = {
        wakeKeyboard: function () {
            console.log("Focus keyboard to: " + document.activeElement);
        },
        requestGarbageCollect: function () {
            console.log('Requested Garbage collection');
        },
        acr_setHostName: function (hostname) {
        },
        acr_setPort: function (port) {
        },
        acr_startMatching: function (gain, msec, times, conf, msecxtimes) {
        },
        acr_stopMatching: function () {
        },
        acr_getLastResult: function () {
        },
        acr_getRemainedTime: function () {
        },
        acr_getHostName: function () {
            return "acr-test.i.tv";
        },
        acr_getPort: function () {
            return "8443";
        },
        title_getImageCount: function () {
            return 0;
        },
        title_hasImage: function (img) {
            return false;
        },
        title_setFixedImage: function (url, id, n1, n2, n3, type) {
            return true;
        },
        soundStopAll: function () {
            console.log("Stop all sounds")
        },
        ls_getItem: function (key) {
            return localStorage.getItem(key);
        },
        ls_setItem: function (key, value) {
            localStorage.setItem(key, value);
            return true;
        },
        ls_removeItem: function (key) {
            localStorage.removeItem(key);
        },
        ls_clear: function () {
            localStorage.clear();
        },
        ls_key: function (index) {
            return localStorage.key(index);
        },
        ls_length: function () {
            return localStorage.length;
        },
        lyt_setIsEnableClientLoadingIcon: function (show) {
            console.log((show ? 'Show' : 'Hide') + ' blue loading icon');
        },
        lyt_setIsEnableWhiteMask: function (withmask) {
            console.log((withmask ? 'With' : 'Without') + ' white mask');
        },
        lyt_startTouchEffect: function () {
            console.log('Show touch effect');
        },
        lyt_setFixedFrameSemitransparency: function(set) {
        },
        lyt_startTouchEffectToFocused: function () {
            console.log('Show touch effect to focused');
        },
        lyt_reset: function () {
            if (document.querySelector(".lyt_draw")) {
                document.querySelector(".lyt_draw").remove()
            }
            console.log('Reset lyt');
        },
        lyt_decideFixedFrame: function () {
            if (document.querySelector(".lyt_draw")) {
                document.querySelector(".lyt_draw").remove()
            }
            console.log('Decide lyt');
        },
        lyt_drawFixedFrame: function (one, two, three, four) {
            if (document.querySelector(".lyt_draw")) {
                document.querySelector(".lyt_draw").remove()
            }
            function drawBox() {
                document.removeEventListener("DOMContentLoaded", drawBox);
                var div = document.createElement("div");
                div.classList.add("lyt_draw");
                div.style.position = "absolute";
                div.style.left = one + "px";
                div.style.top = two + "px";
                div.style.width = three + "px";
                div.style.height = four + "px";
                div.style.border = "4px solid red";
                div.style.backgroundColor = "rgb(255 0 0 / 10%)";
                div.style.boxSizing = "border-box";
                div.style.pointerEvents = "none"; // optional: so it doesn't block interaction
                div.style.zIndex = "9999"; // ensure it's on top

                document.body.appendChild(div);

                console.log('Drew frame at ' + one, two, three, four);
            }

            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", drawBox);
            } else {
                drawBox();
            }
        },
        lyt_startTouchNodeEffect: function (one, two, three, four) {
            console.log('Show touch mouse effect at ' + one, two, three, four);
        },
        video_enableOnTV: function (bool) {
            console.log('Enable video on TV is ' + bool);
        },
        emulate_touch: function (one, two, three) {
            console.log('Emulate touch at ' + one, two, three);
        },
        emulate_inputDelay: function (one) {
            console.log('Emulate input delay in ' + one + ' seconds');
        },
        exit: function () {
            console.log('Exit app');
        },
        exitForce: function () {
            console.log('Forcing exit app');
        },
        isReturnedFromOtherApplication: function () {
            console.log('App was not returned from other application');
            return false;
        },
        runOliveErrorDialog: function (errorCode) {
            alert('115-' + errorCode + '\n\n' + 'An Miiverse error occurred.');
        },
        runErrorDialog: function (errorCode) {
            alert('119-9' + errorCode + '\n\n' + 'An Vino error occurred.');
        },
        olv_getErrorCodeOnInitialize: function () {
            alert('115-5004' + '\n\n' + 'The Miiverse service has ended.');
        },
        runSingleButtonDialog: function (msg, btnStr) {
            alert(msg + "\n\n[ " + (btnStr ? btnStr : "OK") + " ]");
        },
        runTwoButtonDialog: function (msg, lBtnStr, rBtnStr) {
            return !confirm(
                msg + "\n\n[ " + (lBtnStr ? lBtnStr : "Cancel") + " ]  [ " + (rBtnStr ? rBtnStr : "OK") + " ]"
            );
        },
        info_getCountry: function () {
            return debugConsole.country;
        },
        info_getLanguage: function () {
            return debugConsole.language;
        },
        loading_setIconRect: function (one, two, three, four) {
            console.log('Set loading icon position at ' + one, two, three, four);
        },
        loading_setIconAppear: function (show) {
            console.log((show ? 'Show' : 'Hide') + ' loading icon.');
        },
        loading_setIconVisibility: function (show) {
            console.log((show ? 'Instantly show' : 'Instantly hide') + ' loading icon.');
        },
        soundPlay: function (soundLabel) {
            console.log('Played sound effect ' + soundLabel);
            return 1;
        },
        soundPlayEx: function (soundLabel, delay) {
            console.log('Played sound effect ' + soundLabel + " with delay " + delay);
            return 1;
        },
        soundPlayVolume: function (soundLabel, vol) {
            console.log('Played sound effect ' + soundLabel + ' with volume ' + vol);
            return 1;
        },
        soundStop: function (soundId) {
        },
        ir_enableCodeset: function (one) {
            console.log('Enabled IR codeset ' + one);
        },
        ir_existsTvCodeset: function () {
            return true;
        },
        ir_existsOtherCodeset: function () {
            return false;
        },
        ir_send: function (one, two) {
            console.log('Sent IR code ' + one);
        },
        ir_muteOneShotSound: function (bool) {
            console.log('IR sound is enabled?: ' + bool);
        },
        navi_reset: function () {
        },
        navi_setToFocused: function (set) {
        },
        navi_getRect: function () {
            return;
        },
        navi_setMoveMethod: function (one) {
            console.log('Set move method ' + one);
        },
        navi_setBaseVisibilityOnKeyEvent: function (bool) {
            console.log('Base visibility is ' + bool);
        },
        navi_setBaseVisibility: function (bool) {
            console.log('Base visibility is ' + bool);
        },
        navi_set: function (one, two, three, four) {
            console.log('Navi set at ' + one, two, three, four);
        },
        navi_decide: function () {
        },
        act_getCurrentSlotNo: function () {
            console.log('Returned account slot "1"');
            return 1;
        },
        act_getMiiImage: function (slot) {
            console.log('Returned Mii image from ' + slot);
            return "https://pretendo-cdn.b-cdn.net/mii/" + debugConsole.pid + "/normal_face.png";
        },
        act_getMiiImageEx: function (slot, expression) {
            console.log('Returned Mii image from ' + slot + ' with expression ' + expression);
            var imageUrl;
            switch (expression) {
                case 7:
                    imageUrl = "https://pretendo-cdn.b-cdn.net/mii/" + debugConsole.pid + "/body.png";
                    break;
                case 2:
                    imageUrl = "https://pretendo-cdn.b-cdn.net/mii/" + debugConsole.pid + "/smile_open_mouth.png";
                    break;
                case 3:
                    imageUrl = "https://pretendo-cdn.b-cdn.net/mii/" + debugConsole.pid + "/wink_left.png";
                    break;
                case 4:
                    imageUrl = "https://pretendo-cdn.b-cdn.net/mii/" + debugConsole.pid + "/surprised_open_mouth.png";
                    break;
                case 5:
                    imageUrl = "https://pretendo-cdn.b-cdn.net/mii/" + debugConsole.pid + "/frustrated.png";
                    break;
                case 6:
                    imageUrl = "https://pretendo-cdn.b-cdn.net/mii/" + debugConsole.pid + "/sorrow.png";
                    break;
                default:
                    imageUrl = "https://pretendo-cdn.b-cdn.net/mii/" + debugConsole.pid + "/normal_face.png";
                    break;
            }
            return imageUrl;
        },
        act_getMiiData: function (slot) {
            console.log('Returned Mii data from ' + slot);
            return debugConsole.mii;
        },
        act_getNum: function () {
            console.log('Returned number of accounts');
            return 1;
        },
        act_getName: function (slot) {
            console.log('Returned Mii name from ' + slot);
            return debugConsole.name;
        },
        act_getPid: function (slot) {
            console.log('Returned account PID from ' + slot);
            return debugConsole.pid;
        },
        act_getAgeDivision: function (slot) {
            console.log('Returned account age division from ' + slot);
            return 1;
        },
        apd_isEnabled: function () {
            console.log('APD is enabled on console');
            return true;
        },
        apd_getPeriod: function () {
            console.log('Return APD period');
            return 6200;
        },
        apd_enable: function () {
            console.log('APD has been enabled');
            return true;
        },
        apd_disable: function () {
            console.log('APD has been disabled');
            return false;
        },
        memo_open: function (state) {
            console.log((state ? 'Open with reset' : 'Open without reset') + ' memo UI');
            return true;
        },
        memo_reset: function () {
            console.log('Memo UI was reset');
            return true;
        },
        memo_isFinish: function () {
            console.log('Memo UI finished');
            return true;
        },
        memo_getImagePng: function () {
            console.log('Return memo UI image');
            return 'https://i.ibb.co/rwr9J38/descarga.png';
        },
        memo_getImageTgaRaw: function () {
            console.log('Return memo UI raw image');
            return 'DARA';
        },
        memo_getImageTgaCompressed: function () {
            console.log('Return memo UI compressed image');
            return 'DARA';
        },
        fp_getFriendList: function () {
            console.log('Return friend list');
            return debugConsole.fl;
        },
        fp_getFriendName: function (PID) {
            console.log('Get friend name of ' + PID);
            return 'David Joaq';
        },
        jumpToTitle: function (TID, bool) {
            console.log('Jump to app ' + TID);
        },
        checkTitleExist: function (TID) {
            console.log("TID " + TID + " does exist.")
            return true;
        },
        jumpToMiiverse: function (bool) {
            console.log('Jump to Miiverse is ' + bool);
        },
        jumpToMiiversePostId: function (postid, bool) {
            console.log('Jump to post ' + postid + ' on Miiverse is ' + bool);
        },
        jumpToEShop: function (TID, bool) {
            console.log('Jump to eShop page of TID ' + TID + ' is ' + bool);
        },
        jumpToVod: function (url, TID, bool) {
            console.log('Jump to VOD app of TID ' + TID + ' with URL ' + url + ' is ' + bool);
            window.location.href = url;
        },
        jumpToBrowser: function (url, bool) {
            console.log((bool ? 'Jump' : 'Did not jump') + ' to URL ' + url);
            window.location.href = url;
        },
        jumpToSettingsTvRemote: function (bool) {
            console.log((bool ? 'Jump' : 'Did not jump') + ' to TV Remote Settings');
        },
        olv_isEnabled: function () {
            console.log('Miiverse is enabled');
            return true;
        },
        olv_getPostingResult: function () {
            console.log('Post was successful');
            return 1;
        },
        olv_getHostName: function () {
            console.log('Miiverse host name ' + 'https://api.olv.pretendo.cc');
            return 'https://api.olv.pretendo.cc';
        },
        olv_getUserAgent: function () {
            console.log('Miiverse user agent ' + 'WiiU/POLV-5.0.3/353');
            return 'WiiU/POLV-5.0.3/305';
        },
        olv_getServiceToken: function () {
            console.log('Return service token');
            return '837vCg+l8rgFmGSHhZXRH22xr7YUxPhQ95FvhWr3JmoYBsWxUfIYZHFF+J6NYy9eUVnEhv8y3YFw2BrZZ3UEunQfHf7omFk0t4kWywIZYQcaZUDx367u7uSwW+34xF4+/IPQFGLtCh6moWe97yHcOMR374iAmzb1uTDM2cRgDco=';
        },
        olv_getParameterPack: function () {
            console.log('Return param pack');
            return 'XHRpdGxlX2lkXDE0MDc1ODEzMTA0OTcwMzRcYWNjZXNzX2tleVwzNDczXHBsYXRmb3JtX2lkXDFc cmVnaW9uX2lkXDJcbGFuZ3VhZ2VfaWRcMVxjb3VudHJ5X2lkXDQ5XGFyZWFfaWRcMzZcbmV0d29y a19yZXN0cmljdGlvblwwXGZyaWVuZF9yZXN0cmljdGlvblwwXHJhdGluZ19yZXN0cmljdGlvblwx N1xyYXRpbmdfb3JnYW5pemF0aW9uXDFcdHJhbnNmZXJhYmxlX2lkXDExMDU5OTY0MDc3OTU4MjI1 MzQ3XHR6X25hbWVcQW1lcmljYS9OZXdfWW9ya1x1dGNfb2Zmc2V0XC0xNDQwMFw=';
        },
        olv_postText: function (body, topicTag, feelingID, spoiler, searchkey1, searchkey2, searchkey3, searchkey4, searchkey5) {
            console.log('Post to Miiverse with message ' + '"' + body + '"' + ' with topic ' + topicTag + ' with feeling ID ' + feelingID + ' with spoilers ' + spoiler + ' with search key ' + searchkey1 + ' with search key ' + searchkey2 + ' with search key ' + searchkey3 + ' with search key ' + searchkey4 + ' with search key ' + searchkey5);
        },
        olv_postTextFixedPhrase: function (body, topicTag, feelingID, spoiler, searchkey1, searchkey2, searchkey3, searchkey4, searchkey5) {
            console.log('Post to Miiverse fixed phrase with message ' + '"' + body + '"' + ' with topic ' + topicTag + ' with feeling ID ' + feelingID + ' with spoilers ' + spoiler + ' with search key ' + searchkey1 + ' with search key ' + searchkey2 + ' with search key ' + searchkey3 + ' with search key ' + searchkey4 + ' with search key ' + searchkey5);
        },
        olv_postImage: function (painting, topicTag, feelingID, spoiler, searchkey1, searchkey2, searchkey3, searchkey4, searchkey5) {
            console.log('Post to Miiverse with drawing ' + '"' + painting + '"' + ' with topic ' + topicTag + ' with feeling ID ' + feelingID + ' with spoilers ' + spoiler + ' with search key ' + searchkey1 + ' with search key ' + searchkey2 + ' with search key ' + searchkey3 + ' with search key ' + searchkey4 + ' with search key ' + searchkey5);
        },
        olv_postImageFixedPhrase: function (painting, topicTag, feelingID, spoiler, searchkey1, searchkey2, searchkey3, searchkey4, searchkey5) {
            console.log('Post to Miiverse fixed phrase with drawing ' + '"' + painting + '"' + ' with topic ' + topicTag + ' with feeling ID ' + feelingID + ' with spoilers ' + spoiler + ' with search key ' + searchkey1 + ' with search key ' + searchkey2 + ' with search key ' + searchkey3 + ' with search key ' + searchkey4 + ' with search key ' + searchkey5);
        },
        suggest_isOpening: function () {
        },
        suggest_set: function (sug1, sug2, sug3, sug4, sug5, sug6, sug7, sug8, sug9, sug10) {
            console.log('Set suggestion strings ' + '"' + sug1 + '", ' + '"' + sug2 + '", ' + '"' + sug3 + '", ' + '"' + sug4 + '", ' + '"' + sug5 + '", ' + '"' + sug6 + '", ' + '"' + sug7 + '", ' + '"' + sug8 + '", ' + '"' + sug9 + '", ' + '"' + sug10 + '"');
            return true;
        },
        suggest_reset: function () {
            console.log('Reset suggestion strings');
            return true;
        },
        suggest_getString: function () {
        },
        pc_checkPIN: function () {
            console.log('PIN is true, perentl conrol allowed');
            return true;
        },
        pc_runPINInput: function () {
            console.log('PIN is correcto, perentl conrol allowed');
            return 1;
        },
        pc_isControlled: function () {
            console.log('Parental Controls are disabled');
            return false;
        },
        pc_getMiiverseControlLevel: function () {
            console.log('No Miiverse Control Settings');
            return 0;
        },
        pc_isControlledNetworkCommunication: function () {
            console.log('No Network Communication Settings');
            return false;
        },
        pc_isControlledFriendReg: function () {
            console.log('No Friend Settings');
            return false;
        },
        pc_isControlledBrowser: function () {
            console.log('No Browser Settings');
            return false;
        },
        ng_checkText: function (message) {
            console.log(message + ' does not contain any blacklisted words.');
            return true;
        },
        ng_checkWord: function (message) {
            console.log(message + ' is not a blacklisted word.');
            return true;
        }

    };
}