/* eslint-disable */
if (typeof vino === "undefined") {
    // If not on a WiiU, emulate the Vino and WiiU Gamepad APIs.
    console.log("Initialize API emulation");
    if (typeof wiiu === "undefined") {
        (window.wiiu = {}), (window.wiiu.gamepad = { update: function () {} });
    }

    $(document).on("keyup", function (event) {
        wiiu.gamepad.hold = 0;
    });

    // fake console data
    var debugConsole = {
        nnid: "prodtest1",
        name: "Vino Debug",
        mii: "AwEAQBs8xqsHR9PC3MXz5YXEaBemLwAAVllEAGEAdgBpAGQAIABKAG8AYQBxAExRABBXAAJoRBgTZEUUgRIZZg4AACkAaGdQYgBpAGcAIABzAGEAbAB0AHkAAAAAAC96",
        pid: 1530610731,
        country: "US",
        language: "EN",

        fl: "1236925795,1166356730,1409518437,1088392656,1090934832,1573645812,1672254576,1746347141,1112166243,1773702389,1541552688,1679086960,1609011959,1371173300,1426703823,1381149235,1338603408,1122156854,1309239659,1427220684,1498872945,1468960081,1029645862,1092713399,1413957266,1106036020,1637587789,1391350154,1672305136,1098860494",
    };

    window.vino = {
        wakeKeyboard: function () {
            console.log("Focus keyboard to: " + document.activeElement);
        },
        requestGarbageCollect: function () {
            console.log("Requested Garbage collection");
        },
        acr_setHostName: function (hostname) {},
        acr_setPort: function (port) {},
        acr_startMatching: function (gain, msec, times, conf, msecxtimes) {},
        acr_stopMatching: function () {},
        acr_getLastResult: function () {},
        acr_getRemainedTime: function () {},
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
            console.log("Stop all sounds");
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
            console.log((show ? "Show" : "Hide") + " blue loading icon");
        },
        lyt_setIsEnableWhiteMask: function (withmask) {
            console.log((withmask ? "With" : "Without") + " white mask");
        },
        lyt_startTouchEffect: function () {
            console.log("Show touch effect");
        },
        lyt_reset: function () {
            console.log("Reset lyt");
        },
        lyt_decideFixedFrame: function () {
            console.log("Decide lyt");
        },
        lyt_drawFixedFrame: function (one, two, three, four) {
            console.log("Drew frame at " + one, two, three, four);
        },
        lyt_startTouchNodeEffect: function (one, two, three, four) {
            console.log("Show touch mouse effect at " + one, two, three, four);
        },
        video_enableOnTV: function (bool) {
            console.log("Enable video on TV is " + bool);
        },
        emulate_touch: function (one, two, three) {
            console.log("Emulate touch at " + one, two, three);
        },
        emulate_inputDelay: function (one) {
            console.log("Emulate input delay in " + one + " seconds");
        },
        exit: function () {
            console.log("Exit app");
        },
        exitForce: function () {
            console.log("Forcing exit app");
        },
        isReturnedFromOtherApplication: function () {
            console.log("App was not returned from other application");
            return false;
        },
        runOliveErrorDialog: function (errorCode) {
            alert("115-" + errorCode + "\n\n" + "An Miiverse error occurred.");
        },
        runErrorDialog: function (errorCode) {
            alert("119-9" + errorCode + "\n\n" + "An Vino error occurred.");
        },
        olv_getErrorCodeOnInitialize: function () {
            alert("115-5004" + "\n\n" + "The Miiverse service has ended.");
        },
        runSingleButtonDialog: function (msg, btnStr) {
            alert(msg + "\n\n[ " + btnStr + " ]");
        },
        runTwoButtonDialog: function (msg, lBtnStr, rBtnStr) {
            if (
                confirm(
                    msg +
                        "\n\n[ " +
                        lBtnStr +
                        " (Cancel) ]  [ " +
                        rBtnStr +
                        " (OK) ]"
                )
            ) {
                return false;
            }
        },
        info_getCountry: function () {
            return debugConsole.country;
        },
        info_getLanguage: function () {
            return debugConsole.language;
        },
        loading_setIconRect: function (one, two, three, four) {
            console.log(
                "Set loading icon position at " + one,
                two,
                three,
                four
            );
        },
        loading_setIconAppear: function (show) {
            console.log((show ? "Show" : "Hide") + " loading icon.");
        },
        loading_setIconVisibility: function (show) {
            console.log(
                (show ? "Instantly show" : "Instantly hide") + " loading icon."
            );
        },
        soundPlay: function (soundLabel) {
            console.log("Played sound effect " + soundLabel);
        },
        soundPlayEx: function (soundLabel, delay) {
            console.log(
                "Played sound effect " + soundLabel + " with delay " + delay
            );
        },
        soundPlayVolume: function (soundLabel, vol) {
            console.log(
                "Played sound effect " + soundLabel + " with volume " + vol
            );
        },
        ir_enableCodeset: function (one) {
            console.log("Enabled IR codeset " + one);
        },
        ir_existsTvCodeset: function () {
            return true;
        },
        ir_existsOtherCodeset: function () {
            return false;
        },
        ir_send: function (one, two) {
            console.log("Sent IR code " + one);
        },
        ir_muteOneShotSound: function (bool) {
            console.log("IR sound is enabled?: " + bool);
        },
        navi_reset: function () {},
        navi_getRect: function () {
            return;
        },
        navi_setMoveMethod: function (one) {
            console.log("Set move method " + one);
        },
        navi_setBaseVisibilityOnKeyEvent: function (bool) {
            console.log("Base visibility is " + bool);
        },
        navi_setBaseVisibility: function (bool) {
            console.log("Base visibility is " + bool);
        },
        navi_set: function (one, two, three, four) {
            console.log("Navi set at " + one, two, three, four);
        },
        navi_decide: function () {},
        act_getCurrentSlotNo: function () {
            console.log('Returned account slot "1"');
            return 1;
        },
        act_getMiiImage: function (slot) {
            console.log("Returned Mii image from " + slot);
            return (
                "https://pretendo-cdn.b-cdn.net/mii/" +
                debugConsole.pid +
                "/normal_face.png"
            );
        },
        act_getMiiImageEx: function (slot, expression) {
            console.log(
                "Returned Mii image from " +
                    slot +
                    " with expression " +
                    expression
            );
            var imageUrl;
            switch (expression) {
                case 7:
                    imageUrl =
                        "https://pretendo-cdn.b-cdn.net/mii/" +
                        debugConsole.pid +
                        "/body.png";
                    break;
                case 2:
                    imageUrl =
                        "https://pretendo-cdn.b-cdn.net/mii/" +
                        debugConsole.pid +
                        "/smile_open_mouth.png";
                    break;
                case 3:
                    imageUrl =
                        "https://pretendo-cdn.b-cdn.net/mii/" +
                        debugConsole.pid +
                        "/wink_left.png";
                    break;
                case 4:
                    imageUrl =
                        "https://pretendo-cdn.b-cdn.net/mii/" +
                        debugConsole.pid +
                        "/surprised_open_mouth.png";
                    break;
                case 5:
                    imageUrl =
                        "https://pretendo-cdn.b-cdn.net/mii/" +
                        debugConsole.pid +
                        "/frustrated.png";
                    break;
                case 6:
                    imageUrl =
                        "https://pretendo-cdn.b-cdn.net/mii/" +
                        debugConsole.pid +
                        "/sorrow.png";
                    break;
                default:
                    imageUrl =
                        "https://pretendo-cdn.b-cdn.net/mii/" +
                        debugConsole.pid +
                        "/normal_face.png";
                    break;
            }
            return imageUrl;
        },
        act_getMiiData: function (slot) {
            console.log("Returned Mii data from " + slot);
            return debugConsole.mii;
        },
        act_getNum: function () {
            console.log("Returned number of accounts");
            return 1;
        },
        act_getName: function (slot) {
            console.log("Returned Mii name from " + slot);
            return debugConsole.name;
        },
        act_getPid: function (slot) {
            console.log("Returned account PID from " + slot);
            return debugConsole.pid;
        },
        act_getAgeDivision: function (slot) {
            console.log("Returned account age division from " + slot);
            return 1;
        },
        apd_isEnabled: function () {
            console.log("APD is enabled on console");
            return true;
        },
        apd_getPeriod: function () {
            console.log("Return APD period");
            return 6200;
        },
        apd_enable: function () {
            console.log("APD has been enabled");
            return true;
        },
        apd_disable: function () {
            console.log("APD has been disabled");
            return false;
        },
        memo_open: function (state) {
            console.log(
                (state ? "Open with reset" : "Open without reset") + " memo UI"
            );
            return true;
        },
        memo_reset: function () {
            console.log("Memo UI was reset");
            return true;
        },
        memo_isFinish: function () {
            console.log("Memo UI finished");
            return true;
        },
        memo_getImagePng: function () {
            console.log("Return memo UI image");
            return "https://i.ibb.co/rwr9J38/descarga.png";
        },
        memo_getImageTgaRaw: function () {
            console.log("Return memo UI raw image");
            return "DARA";
        },
        memo_getImageTgaCompressed: function () {
            console.log("Return memo UI compressed image");
            return "DARA";
        },
        fp_getFriendList: function () {
            console.log("Return friend list");
            return debugConsole.fl;
        },
        fp_getFriendName: function (PID) {
            console.log("Get friend name of " + PID);
            return "David Joaq";
        },
        jumpToTitle: function (TID, bool) {
            console.log("Jump to app " + TID);
        },
        checkTitleExist: function (TID) {
            console.log("TID " + TID + " does exist.");
            return true;
        },
        jumpToMiiverse: function (bool) {
            console.log("Jump to Miiverse is " + bool);
        },
        jumpToMiiversePostId: function (postid, bool) {
            console.log("Jump to post " + postid + " on Miiverse is " + bool);
        },
        jumpToEShop: function (TID, bool) {
            console.log("Jump to eShop page of TID " + TID + " is " + bool);
        },
        jumpToVod: function (url, TID, bool) {
            console.log(
                "Jump to VOD app of TID " +
                    TID +
                    " with URL " +
                    url +
                    " is " +
                    bool
            );
            window.location.href = url;
        },
        jumpToBrowser: function (url, bool) {
            console.log((bool ? "Jump" : "Did not jump") + " to URL " + url);
            window.location.href = url;
        },
        jumpToSettingsTvRemote: function (bool) {
            console.log(
                (bool ? "Jump" : "Did not jump") + " to TV Remote Settings"
            );
        },
        olv_isEnabled: function () {
            console.log("Miiverse is enabled");
            return true;
        },
        olv_getPostingResult: function () {
            console.log("Post was successful");
            return 1;
        },
        olv_getHostName: function () {
            console.log("Miiverse host name " + "https://api.olv.pretendo.cc");
            return "https://api.olv.pretendo.cc";
        },
        olv_getUserAgent: function () {
            console.log("Miiverse user agent " + "WiiU/POLV-5.0.3/353");
            return "WiiU/POLV-5.0.3/305";
        },
        olv_getServiceToken: function () {
            console.log("Return service token");
            return "837vCg+l8rgFmGSHhZXRH22xr7YUxPhQ95FvhWr3JmoYBsWxUfIYZHFF+J6NYy9eUVnEhv8y3YFw2BrZZ3UEunQfHf7omFk0t4kWywIZYQcaZUDx367u7uSwW+34xF4+/IPQFGLtCh6moWe97yHcOMR374iAmzb1uTDM2cRgDco=";
        },
        olv_getParameterPack: function () {
            console.log("Return param pack");
            return "XHRpdGxlX2lkXDE0MDc1ODEzMTA0OTcwMzRcYWNjZXNzX2tleVwzNDczXHBsYXRmb3JtX2lkXDFc cmVnaW9uX2lkXDJcbGFuZ3VhZ2VfaWRcMVxjb3VudHJ5X2lkXDQ5XGFyZWFfaWRcMzZcbmV0d29y a19yZXN0cmljdGlvblwwXGZyaWVuZF9yZXN0cmljdGlvblwwXHJhdGluZ19yZXN0cmljdGlvblwx N1xyYXRpbmdfb3JnYW5pemF0aW9uXDFcdHJhbnNmZXJhYmxlX2lkXDExMDU5OTY0MDc3OTU4MjI1 MzQ3XHR6X25hbWVcQW1lcmljYS9OZXdfWW9ya1x1dGNfb2Zmc2V0XC0xNDQwMFw=";
        },
        olv_postText: function (
            body,
            topicTag,
            feelingID,
            spoiler,
            searchkey1,
            searchkey2,
            searchkey3,
            searchkey4,
            searchkey5
        ) {
            console.log(
                "Post to Miiverse with message " +
                    '"' +
                    body +
                    '"' +
                    " with topic " +
                    topicTag +
                    " with feeling ID " +
                    feelingID +
                    " with spoilers " +
                    spoiler +
                    " with search key " +
                    searchkey1 +
                    " with search key " +
                    searchkey2 +
                    " with search key " +
                    searchkey3 +
                    " with search key " +
                    searchkey4 +
                    " with search key " +
                    searchkey5
            );
        },
        olv_postTextFixedPhrase: function (
            body,
            topicTag,
            feelingID,
            spoiler,
            searchkey1,
            searchkey2,
            searchkey3,
            searchkey4,
            searchkey5
        ) {
            console.log(
                "Post to Miiverse fixed phrase with message " +
                    '"' +
                    body +
                    '"' +
                    " with topic " +
                    topicTag +
                    " with feeling ID " +
                    feelingID +
                    " with spoilers " +
                    spoiler +
                    " with search key " +
                    searchkey1 +
                    " with search key " +
                    searchkey2 +
                    " with search key " +
                    searchkey3 +
                    " with search key " +
                    searchkey4 +
                    " with search key " +
                    searchkey5
            );
        },
        olv_postImage: function (
            painting,
            topicTag,
            feelingID,
            spoiler,
            searchkey1,
            searchkey2,
            searchkey3,
            searchkey4,
            searchkey5
        ) {
            console.log(
                "Post to Miiverse with drawing " +
                    '"' +
                    painting +
                    '"' +
                    " with topic " +
                    topicTag +
                    " with feeling ID " +
                    feelingID +
                    " with spoilers " +
                    spoiler +
                    " with search key " +
                    searchkey1 +
                    " with search key " +
                    searchkey2 +
                    " with search key " +
                    searchkey3 +
                    " with search key " +
                    searchkey4 +
                    " with search key " +
                    searchkey5
            );
        },
        olv_postImageFixedPhrase: function (
            painting,
            topicTag,
            feelingID,
            spoiler,
            searchkey1,
            searchkey2,
            searchkey3,
            searchkey4,
            searchkey5
        ) {
            console.log(
                "Post to Miiverse fixed phrase with drawing " +
                    '"' +
                    painting +
                    '"' +
                    " with topic " +
                    topicTag +
                    " with feeling ID " +
                    feelingID +
                    " with spoilers " +
                    spoiler +
                    " with search key " +
                    searchkey1 +
                    " with search key " +
                    searchkey2 +
                    " with search key " +
                    searchkey3 +
                    " with search key " +
                    searchkey4 +
                    " with search key " +
                    searchkey5
            );
        },
        suggest_isOpening: function () {},
        suggest_set: function (
            sug1,
            sug2,
            sug3,
            sug4,
            sug5,
            sug6,
            sug7,
            sug8,
            sug9,
            sug10
        ) {
            console.log(
                "Set suggestion strings " +
                    '"' +
                    sug1 +
                    '", ' +
                    '"' +
                    sug2 +
                    '", ' +
                    '"' +
                    sug3 +
                    '", ' +
                    '"' +
                    sug4 +
                    '", ' +
                    '"' +
                    sug5 +
                    '", ' +
                    '"' +
                    sug6 +
                    '", ' +
                    '"' +
                    sug7 +
                    '", ' +
                    '"' +
                    sug8 +
                    '", ' +
                    '"' +
                    sug9 +
                    '", ' +
                    '"' +
                    sug10 +
                    '"'
            );
            return true;
        },
        suggest_reset: function () {
            console.log("Reset suggestion strings");
            return true;
        },
        suggest_getString: function () {},
        pc_checkPIN: function () {
            console.log("PIN is true, perentl conrol allowed");
            return true;
        },
        pc_runPINInput: function () {
            console.log("PIN is correcto, perentl conrol allowed");
            return 1;
        },
        pc_isControlled: function () {
            console.log("Parental Controls are disabled");
            return false;
        },
        pc_getMiiverseControlLevel: function () {
            console.log("No Miiverse Control Settings");
            return 0;
        },
        pc_isControlledNetworkCommunication: function () {
            console.log("No Network Communication Settings");
            return false;
        },
        pc_isControlledFriendReg: function () {
            console.log("No Friend Settings");
            return false;
        },
        pc_isControlledBrowser: function () {
            console.log("No Browser Settings");
            return false;
        },
        ng_checkText: function (message) {
            console.log(message + " does not contain any blacklisted words.");
            return true;
        },
        ng_checkWord: function (message) {
            console.log(message + " is not a blacklisted word.");
            return true;
        },
    };
}

const Runtime = function () {
    (this.clientUrl = location.origin),
        (this.BGMId = null),
        (this.userSlot = vino.act_getCurrentSlotNo()),
        (this.currentXHR = null),
        (this.locFile = null);

    const self = this;

    (this.templates = {
        // list templates for the spa router
        templateList: [
            {
                template_query: "setup", // the query (?page=<template_query>)
                template_file: "setup.html", // the html file to load (/templates/<template_file>)
            },
            {
                template_query: "title",
                template_file: "title.html",
            },
        ],
        requestAll: function () {
            var templateLoadCount = 0;

            for (var i = 0; i < this.templateList.length; i++) {
                (function (temToLoad) {
                    var xhr = new XMLHttpRequest();
                    xhr.open(
                        "GET",
                        self.clientUrl + "/pages/" + temToLoad.template_file
                    );
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState == 4) {
                            if (xhr.status == 200) {
                                var tem = {
                                    template_name: temToLoad.template_query,
                                    template_html: xhr.responseText,
                                };

                                sessionStorage.setItem(
                                    "template_" + tem.template_name,
                                    JSON.stringify(tem)
                                );

                                templateLoadCount++;
                                if (
                                    templateLoadCount >=
                                    self.templates.templateList.length
                                ) {
                                    $(document).trigger(
                                        "vino:templates:loaded"
                                    );
                                    sessionStorage.setItem("temLoaded", "true");
                                }
                            }
                        }
                    };
                    xhr.send();
                })(self.templates.templateList[i]);
            }
        },
        get: function (templateName) {
            var getHTML = JSON.parse(
                sessionStorage.getItem("template_" + templateName)
            ).template_html;
            return getHTML.trim();
        },
        requestJSONLoc: function () {
            var region;
            var locFile;
            switch (vino.info_getCountry()) {
                case "US":
                case "CA":
                case "MX":
                case "BR":
                case "AR":
                case "CL":
                case "CO":
                case "PE":
                case "VE":
                case "UY":
                case "EC":
                case "PY":
                case "CR":
                case "GT":
                case "DO":
                    region = "US";
                    break;

                case "FR":
                case "DE":
                case "IT":
                case "ES":
                case "GB":
                case "PT":
                case "BE":
                case "NL":
                case "LU":
                case "AT":
                case "PL":
                case "DK":
                case "RU":
                case "CH":
                case "ZA":
                case "CZ":
                case "SE":
                case "NO":
                case "FI":
                case "GR":
                case "IE":
                case "AU":
                case "NZ":
                    region = "EU";
                    break;

                case "JP":
                case "KR":
                case "HK":
                case "SG":
                case "TW":
                    region = "JP";
                    break;

                default:
                    region = "US";
                    break;
            }

            var locFile = self.getLang().split("-")[0] + "_" + region + ".json";

            var sendRequest = function (locFile) {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", self.clientUrl + "/loc/" + locFile);
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4) {
                        if (xhr.status == 200) {
                            self.locFile = JSON.parse(xhr.responseText);
                            $(document).trigger(
                                "vino:templates:jsonloc:loaded"
                            );
                        } else {
                            if (locFile !== "en_US.json") {
                                sendRequest("en_US.json");
                            }
                        }
                    }
                };
                xhr.send();
            };

            sendRequest(locFile);
        },
        getLoc: function (locID, arrayReplace) {
            var localizedString = self.locFile[locID];

            if (arrayReplace && typeof arrayReplace === "object") {
                for (var key in arrayReplace) {
                    if (arrayReplace.hasOwnProperty(key)) {
                        var placeholder = new RegExp(key, "g");
                        localizedString = localizedString.replace(
                            placeholder,
                            arrayReplace[key]
                        );
                    }
                }
            }
            return localizedString;
        },
        setUpLocHTML: function () {
            $("body")
                .find("[data-loc]")
                .each(function (index, el) {
                    var els = self.templates.getLoc($(el).attr("data-loc"));
                    $(el).html(els);
                });

            $("body")
                .find("[data-loc-attr]")
                .each(function (index, el) {
                    var a = JSON.parse($(el).attr("data-loc-attr"));

                    for (var key in a) {
                        var value = a[key];
                        $(el).attr(key, self.templates.getLoc(value));
                    }
                });
        },
    }),
        (this.router = {
            routes: [],
            connect: function (regex, handler) {
                this.routes.push({
                    regex: new RegExp(regex),
                    handler: handler,
                });
            },
            checkRoutes: function (url) {
                var matchFound = false;
                for (var i = 0; i < this.routes.length; i++) {
                    var route = this.routes[i];
                    var match = url.match(route.regex);
                    if (match) {
                        matchFound = true;
                        route.handler.apply(null, match.slice(1));
                        break;
                    }
                }
            },
        }),
        (this.getLang = function () {
            var l = vino.info_getLanguage().toLowerCase();
            var c = vino.info_getCountry();
            switch (l) {
                case "sp":
                    l = "es";
                    break;
                case "jp":
                    l = "ja";
                    break;
                default:
                    break;
            }
            return l + "-" + c;
        }),
        (this.getQuery = function (param, isSearch) {
            var queryString;

            if (isSearch) {
                queryString = window.location.search.substring(1);
            } else {
                queryString = param;
                param = param.split("?")[1];
            }

            var params = queryString.split("&");

            for (var i = 0; i < params.length; i++) {
                var pair = params[i].split("=");
                if (pair[0] === param) {
                    return decodeURIComponent(pair[1]);
                }
            }

            return null;
        }),
        (this.changePage = function (pageQuery, replace) {
            //If is returned from app?
            if (pageQuery == 1) {
                pageQuery = location.search;
            }
            if (replace) {
                window.history.replaceState({}, "", pageQuery);
            } else {
                window.history.pushState({}, "", pageQuery);
                console.log("pushed state");
            }
            self.showWrapper(false);
            self.clearWrapper();
            $(document).trigger("vino:pageclear");
            self.replaceWrapper(
                self.templates.get(self.getQuery("page", true))
            );
            self.templates.setUpLocHTML();
            self.initTouchEffect();
            self.showWrapper(true);
            self.router.checkRoutes(location.search);

            $(document).trigger("vino:pagechange");
        }),
        (this.replacePageQuery = function (queryName, queryValue) {
            var queryString = location.search;

            var currentQuery = self.getQuery(queryName, true);

            if (currentQuery == null) {
                if (queryString) {
                    queryString +=
                        "&" +
                        encodeURIComponent(queryName) +
                        "=" +
                        encodeURIComponent(queryValue);
                } else {
                    queryString =
                        "?" +
                        encodeURIComponent(queryName) +
                        "=" +
                        encodeURIComponent(queryValue);
                }
            } else {
                var regex = new RegExp(
                    "([?&])" + encodeURIComponent(queryName) + "=.*?(&|$)",
                    "i"
                );
                queryString = queryString.replace(
                    regex,
                    "$1" +
                        encodeURIComponent(queryName) +
                        "=" +
                        encodeURIComponent(queryValue) +
                        "$2"
                );
            }

            window.history.replaceState({}, "", self.clientUrl + queryString);
        }),
        (this.clearWrapper = function () {
            $(".wrapper").html("");
        }),
        (this.replaceWrapper = function (html) {
            $(".wrapper").html(html);
        }),
        (this.getWrapper = function () {
            return $(".wrapper").html();
        }),
        (this.showWrapper = function (show) {
            if (show) {
                $(".wrapper").removeClass("none");
            } else {
                $(".wrapper").addClass("none");
            }
        }),
        (this.clearEvents = function () {
            $(document).off("mousedown");
            $(document).off("mousemove");
            $(document).off("mouseup");
            $(document).off("scroll");
            $(document).off("click");
            $(document).off("vino:tabchange");
            $(document).off("modalchange:setup");
            $(window).off("click");
            $(window).off("scroll");
            $(window).off("mousemove");
            $(window).off("mousedown");
            $(".container").off("mousedown");
            $(".container").off("mousemove");
            $(".container").off("mouseup");
        }),
        (this.initPageLinks = function () {
            $("a").on("click", function () {
                var link = $(this);
                if (link.attr("data-url") != null) {
                    self.changePage(link.attr("data-url"), false);
                }
            });
        }),
        (this.sendXHR = function (
            type,
            url,
            callbackSuccess,
            callbackError,
            headers,
            formData
        ) {
            self.abortOngoingXHR();

            self.showLoading(true);
            self.currentXHR = new XMLHttpRequest();
            self.currentXHR.open(type, url);

            if (headers) {
                for (var i = 0; i < headers.length; i++) {
                    var headerParts = headers[i].split(":");
                    var headerName = headerParts[0].trim();
                    var headerValue = headerParts[1].trim();
                    self.currentXHR.setRequestHeader(headerName, headerValue);
                }
            }

            self.currentXHR.onreadystatechange = function () {
                if (self.currentXHR.readyState == 4) {
                    self.showLoading(false);
                    if (self.currentXHR.status == 200) {
                        callbackSuccess(
                            self.currentXHR.responseText || "",
                            self.currentXHR
                        );
                    } else {
                        callbackError(self.currentXHR);
                    }
                    self.currentXHR = null;
                }
            };

            if (type === "POST") {
                self.currentXHR.setRequestHeader(
                    "Content-Type",
                    "application/json"
                );
                self.currentXHR.send(formData);
            } else {
                self.currentXHR.send();
            }
        }),
        (this.abortOngoingXHR = function () {
            if (self.currentXHR != null) {
                self.showLoading(false);
                self.currentXHR.abort();
                self.currentXHR = null;
            }
        }),
        (this.makeScrollContainer = function (container, isHorizontal) {
            this.scrCont = container;
            this.isHorizontal = isHorizontal;
            this.isMouseDown = false;
            this.startPosX = 0;
            this.startPosY = 0;
            this.scrollStartX = 0;
            this.scrollStartY = 0;
            this.lastScrollPosX = 0;
            this.lastScrollPosY = 0;
            this.scrollVelocityX = 0;
            this.scrollVelocityY = 0;
            this.friction = 0.9; // Inertia friction factor
            this.inertiaInterval = null;
            this.hasStartedScrolling = false; // To track if scrolling has started

            var self = this;

            // Initialize event listeners
            this.scrCont.on("mousedown", function (e) {
                self.isMouseDown = true;
                self.startPosX = e.pageX;
                self.startPosY = e.pageY;
                self.scrollStartX = self.scrCont.scrollLeft();
                self.scrollStartY = self.scrCont.scrollTop();
                self.lastScrollPosX = self.scrollStartX; // Track the last scroll position for velocity calculation
                self.lastScrollPosY = self.scrollStartY;
                self.scrollVelocityX = 0; // Reset scroll velocity on mousedown
                self.scrollVelocityY = 0;
                self.scrCont.css("cursor", "grabbing");
                clearInterval(self.inertiaInterval); // Stop any previous inertia interval
            });

            $(document).on("mouseup", function () {
                if (self.isMouseDown) {
                    self.isMouseDown = false;
                    self.scrCont.css("cursor", "grab");
                    self.hasStartedScrolling = false; // Reset scroll start flag

                    // Smooth scrolling inertia
                    self.inertiaInterval = setInterval(function () {
                        var continueX = Math.abs(self.scrollVelocityX) > 0.1;
                        var continueY = Math.abs(self.scrollVelocityY) > 0.1;

                        if (continueX || continueY) {
                            if (continueX) {
                                self.scrCont.scrollLeft(
                                    self.scrCont.scrollLeft() +
                                        self.scrollVelocityX
                                );
                                self.scrollVelocityX *= self.friction;
                            }
                            if (continueY) {
                                self.scrCont.scrollTop(
                                    self.scrCont.scrollTop() +
                                        self.scrollVelocityY
                                );
                                self.scrollVelocityY *= self.friction;
                            }

                            // Trigger scrolling event on the container element
                            self.scrCont.trigger("scrolling", {
                                scrollX: self.getScrollX(),
                                scrollY: self.getScrollY(),
                            });
                        } else {
                            clearInterval(self.inertiaInterval); // Stop inertia when velocity is low

                            // Trigger scrollEnd event on the container element
                            self.scrCont.trigger("scrollEnd", {
                                scrollX: self.getScrollX(),
                                scrollY: self.getScrollY(),
                            });
                        }
                    }, 20); // Update every 20ms for smooth scrolling
                }
            });

            this.scrCont.on("mousemove", function (e) {
                if (self.isMouseDown) {
                    if (!self.hasStartedScrolling) {
                        self.hasStartedScrolling = true;

                        // Trigger scrollStart event on the container element
                        self.scrCont.trigger("scrollStart", {
                            scrollX: self.getScrollX(),
                            scrollY: self.getScrollY(),
                        });
                    }

                    var currentPosX = e.pageX;
                    var currentPosY = e.pageY;

                    if (self.isHorizontal === 4) {
                        // Strictly horizontal or vertical scrolling
                        var deltaX = Math.abs(currentPosX - self.startPosX);
                        var deltaY = Math.abs(currentPosY - self.startPosY);

                        // Compare the difference in movement to decide the forced scroll direction
                        if (deltaX > deltaY) {
                            // Horizontal scroll
                            var walkX = (currentPosX - self.startPosX) * 2; // Scroll speed
                            self.scrCont.scrollLeft(self.scrollStartX - walkX);
                            self.scrollVelocityX =
                                self.scrCont.scrollLeft() - self.lastScrollPosX; // Update velocity based on scroll change
                            self.lastScrollPosX = self.scrCont.scrollLeft(); // Update last scroll position
                            self.scrollVelocityY = 0; // Prevent any vertical velocity
                        } else {
                            // Vertical scroll
                            var walkY = (currentPosY - self.startPosY) * 2; // Scroll speed
                            self.scrCont.scrollTop(self.scrollStartY - walkY);
                            self.scrollVelocityY =
                                self.scrCont.scrollTop() - self.lastScrollPosY; // Update velocity based on scroll change
                            self.lastScrollPosY = self.scrCont.scrollTop(); // Update last scroll position
                            self.scrollVelocityX = 0; // Prevent any horizontal velocity
                        }
                    } else {
                        // Normal behavior (not forced to one direction)
                        var walkX = (currentPosX - self.startPosX) * 2; // Scroll speed
                        var walkY = (currentPosY - self.startPosY) * 2;

                        if (
                            self.isHorizontal === true ||
                            self.isHorizontal === 3
                        ) {
                            self.scrCont.scrollLeft(self.scrollStartX - walkX);
                            self.scrollVelocityX =
                                self.scrCont.scrollLeft() - self.lastScrollPosX; // Update velocity based on scroll change
                            self.lastScrollPosX = self.scrCont.scrollLeft(); // Update last scroll position
                        }
                        if (
                            self.isHorizontal === false ||
                            self.isHorizontal === 3
                        ) {
                            self.scrCont.scrollTop(self.scrollStartY - walkY);
                            self.scrollVelocityY =
                                self.scrCont.scrollTop() - self.lastScrollPosY; // Update velocity based on scroll change
                            self.lastScrollPosY = self.scrCont.scrollTop(); // Update last scroll position
                        }
                    }

                    // Trigger scrolling event on the container element
                    self.scrCont.trigger("scrolling", {
                        scrollX: self.getScrollX(),
                        scrollY: self.getScrollY(),
                    });
                }
            });

            // Method to get the horizontal scroll position
            this.getScrollX = function () {
                return this.scrCont.scrollLeft();
            };

            // Method to get the vertical scroll position
            this.getScrollY = function () {
                return this.scrCont.scrollTop();
            };

            this.stop = function () {
                clearInterval(self.inertiaInterval);
                self.scrollVelocityX = 0;
                self.scrollVelocityY = 0;
            };
        }),
        (this.setUpTitleScrollbar = function () {
            var container = document.querySelector(".program-list .content");
            var thumb = document.querySelector(
                ".program-list .scrollbar .thumb"
            );

            var minThumbTop = 20; // Minimum thumb position
            var maxThumbTop = 225; // Maximum thumb position

            function updateThumbPosition() {
                var maxScroll = container.scrollHeight - container.clientHeight;
                var scrollRatio = container.scrollTop / maxScroll;
                var newTop =
                    minThumbTop + scrollRatio * (maxThumbTop - minThumbTop);
                thumb.style.top = newTop + "px";
            }

            function updateContainerScroll(thumbTop) {
                var maxScroll = container.scrollHeight - container.clientHeight;
                var scrollRatio =
                    (thumbTop - minThumbTop) / (maxThumbTop - minThumbTop);
                container.scrollTop = scrollRatio * maxScroll;
            }

            // Drag behavior
            thumb.addEventListener("mousedown", function (e) {
                e.preventDefault();
                var startY = e.clientY;
                var startTop = parseFloat(thumb.style.top) || minThumbTop;

                function onMouseMove(e) {
                    var deltaY = e.clientY - startY;
                    var newTop = Math.max(
                        minThumbTop,
                        Math.min(maxThumbTop, startTop + deltaY)
                    );
                    thumb.style.top = newTop + "px";
                    updateContainerScroll(newTop);
                }

                function onMouseUp() {
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                }

                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
            });

            // Sync scrollbar when container scrolls
            container.addEventListener("scroll", updateThumbPosition);

            // Initialize scrollbar
            updateThumbPosition();
        }),
        (this.setLoadingPos = function (top, left, width, height) {
            vino.loading_setIconRect(top, left, width, height);
        }),
        (this.showLoading = function (show) {
            vino.loading_setIconAppear(show);
        }),
        (this.initTouchEffect = function () {
            //Check if click was real
            $("a:not([no_touch]), label:not([no_touch]), navi_touch").each(
                function () {
                    if (!$.data(this, "tL")) {
                        $(this).on("click", function (evt) {
                            var el = $(this);
                            if (
                                evt.originalEvent &&
                                !vino.navi_getRect() &&
                                !el.attr("disabled") &&
                                !el.hasClass("disabled")
                            ) {
                                vino.lyt_startTouchEffect();
                            }
                        });
                        $.data(this, "tL", true);
                    }
                }
            );
        }),
        (this.initialize = function () {
            self.setLoadingPos(360, 160, 120, 120);
            self.showLoading(true);

            $(document).on("vino:initialized", function () {
                $(document).off("vino:initialized");
                self.showLoading(false);

                if (vino.ls_getItem("vino_initialized") == "true") {
                    if (self.getQuery("page", true)) {
                        self.changePage(1, true);
                    } else {
                        self.changePage("?page=home", true);
                    }
                } else {
                    self.changePage("?page=setup", true);
                }
            });

            $(document).on("vino:templates:loaded", function () {
                $(document).off("vino:templates:loaded");
                self.templates.requestJSONLoc();
            });

            $(document).on("vino:templates:jsonloc:loaded", function () {
                $(document).off("vino:templates:jsonloc:loaded");
                $(document).trigger("vino:initialized");
            });

            self.templates.requestAll();
        });
};

const tvii = new Runtime();

document.addEventListener("DOMContentLoaded", function () {
    tvii.initialize();
});

$(document).on("vino:pageclear", function () {
    tvii.abortOngoingXHR();
    tvii.clearEvents();
    vino.requestGarbageCollect();
});

$(document).on("vino:pagechange", function () {
    tvii.initPageLinks();
});

$(window).on("popstate", function () {
    tvii.changePage(location.search, true);
});

tvii.router.connect("^[?&]page=setup(?:&|$)", function () {
    tvii.BGMId = vino.soundPlayVolume("SE_APP_START_SUB", 30);

    var savedCode;
    var setupCont = new tvii.makeScrollContainer(
        $(".setup-modal-container"),
        false
    );

    function setActualClickForElement($elements, onRealClick) {
        var dragThreshold = 5;

        $elements.on("mousedown", function (e) {
            $(this).data("isDragging", false);
            $(this).data("startX", e.pageX);
            $(this).data("startY", e.pageY);
        });

        $elements.on("mousemove", function (e) {
            var $el = $(this);
            var startX = $el.data("startX") || 0;
            var startY = $el.data("startY") || 0;

            if (
                Math.abs(e.pageX - startX) > dragThreshold ||
                Math.abs(e.pageY - startY) > dragThreshold
            ) {
                $el.data("isDragging", true);
            }
        });

        $elements.on("click", function (e) {
            var $el = $(this);
            if ($el.data("isDragging")) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            }
            onRealClick.call(this, e); // call with 'this' as the clicked element
        });
    }

    var usZipCodeInput = $(".zipcode-input .zip-usa");
    var caZipCodeContainer = $(".zipcode-input .zip-canada");

    function changeSetupModal(show, hide) {
        if (hide) {
            hide.addClass("none");
        }
        show.removeClass("none");
        if (show.attr("id") === "x-login") {
            console.log("set x interval");
        } else if (show.attr("id") === "setup-modal-4") {
            console.log("clear all social media intervals");
        }
    }

    function XOauthLogic() {}

    function generateXCodeAuth() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", tvii.clientUrl + "/apid/generateXCode.json");
        xhr.onload = function () {
            if (xhr.status === 200) {
            }
        };
    }

    function setXCodeInterval() {
        setInterval(function () {
            var xhr = new XMLHttpRequest();
            xhr.open("POST");
        }, 2090);
    }

    function checkZipCodeProviders() {
        var code = usZipCodeInput.val();

        if ($(".tvproviders .providertypes>a").length && savedCode === code) {
            return;
        } else {
            $(".tvproviders>a").remove();
        }

        savedCode = code;

        tvii.sendXHR(
            "GET",
            tvii.clientUrl + "/zipcode.json?zipcode=" + code,
            function (responseText) {
                var providers = JSON.parse(responseText).data.items;
                for (var i = 0; i < providers.length; i++) {
                    var provider = providers[i];
                    var providerA = $("<a>");
                    providerA.addClass("none");
                    providerA.attr("data-provider-id", provider.id);
                    providerA.attr("data-provider-type", provider.type);

                    var providerN = $("<p>");
                    providerN.html(provider.name);

                    var providerC = $("<span>");
                    providerC.html(provider.city);

                    providerA.append(providerN);
                    providerA.append(providerC);

                    $(".tvproviders").append(providerA);
                }

                $(".tvproviders .providertypes>a").removeClass("selected");
                $(".tvproviders .providertypes>a:first-child").addClass(
                    "selected"
                );

                setActualClickForElement($(".tvproviders>a"), function () {
                    $(".tvproviders>a").removeClass("selected");
                    $(this).addClass("selected");
                });

                $(".tvproviders>a").addClass("none");
                $('.tvproviders>a[data-provider-type="cable"]').removeClass(
                    "none"
                );

                $('.tvproviders>a[data-provider-type="cable"]')
                    .last()
                    .addClass("last");
                $('.tvproviders>a[data-provider-type="broadcast"]')
                    .last()
                    .addClass("last");
                $('.tvproviders>a[data-provider-type="satellite"]')
                    .last()
                    .addClass("last");

                $(".tvproviders").removeClass("none");
            },
            function () {
                $(".tvproviders").addClass("none");
            }
        );
    }

    $("a[data-show][data-hide]").on("click", function () {
        vino.soundPlayVolume("SE_DECIDE", 30);
        var a = $(this);
        changeSetupModal($(a.attr("data-show")), $(a.attr("data-hide")));
    });

    changeSetupModal($("#setup-modal-1"), null);

    //Check if its US or Canada

    if (vino.info_getCountry() === "US") {
        usZipCodeInput.removeClass("none");
    } else if (vino.info_getCountry() === "CA") {
        caZipCodeContainer.removeClass("none");
    }

    usZipCodeInput.on("input change", function () {
        if ($(this).val().length === 5) {
            $(".zipcode-checkconfirm").removeClass("disabled");
        } else {
            $(".zipcode-checkconfirm").addClass("disabled");
        }
    });

    $(".zipcode-checkconfirm").on("click", function () {
        if ($(this).hasClass("disabled")) {
            return;
        }
        changeSetupModal($("#setup-modal-3"), $("#setup-modal-2"));

        checkZipCodeProviders();
    });

    $(".provider-checkconfirm").on("click", function () {
        if ($(".tvproviders>a.selected").length) {
            changeSetupModal($("#setup-modal-4"), $("#setup-modal-3"));
        } else {
            alert("Please choose a TV provider to continue with setup.");
        }
    });

    $(".tvproviders .providertypes>a").on("click", function () {
        $(".tvproviders .providertypes>a").removeClass("selected");
        $(this).addClass("selected");

        $(".tvproviders>a").addClass("none");
        $(
            '.tvproviders>a[data-provider-type="' +
                $(this).attr("data-provider-filter") +
                '"]'
        ).removeClass("none");
    });
});
