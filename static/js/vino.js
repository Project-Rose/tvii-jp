/* eslint-disable no-undef */
var tvii = {
    clientUrl: location.origin,
    BGMId: null,
    userSlot: vino.act_getCurrentSlotNo(),
    currentXHR: null,
    locFile: null,
    profile: {
        user_id: null,
        tv_provider_id: null,
        UTCOffset: null,
    },
    tvgAirGenre: {
        ALL: 5,
        FAVORITES: 0,
        MOVIES: 1,
        SPORTS: 2,
        FAMILY: 3,
        NEWS: 4
    },
    tvgAirFlags: {
        ANY: 0,
        LIVE: 1,
        REPEAT: 2,
        NEW: 4,
        CC: 8,
        STEREO: 16,
        HDTV: 32,
        ADULT: 128,
        FAMILY: 25,
        OSCAR: 512,
        STARRATING1: 8192,
        STARRATING2: 16384,
        STARRATING3: 32768,
        STARRATING4: 65536,
        STARRATING5: 131072
    },
    templates: {
        // list templates for dynamic use
        templateList: [
            {
                template_query: "home",
                template_file: "title.html"
            },
            {
                template_query: "setup",
                template_file: "setup.html"
            },
        ],
        requestAll: function () {
            var templateLoadCount = 0;

            for (var i = 0; i < this.templateList.length; i++) {
                (function (temToLoad) {
                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", tvii.clientUrl + "/pages/" + temToLoad.template_file);
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState == 4) {
                            if (xhr.status == 200) {
                                var tem = {
                                    template_name: temToLoad.template_query,
                                    template_html: xhr.responseText
                                }

                                sessionStorage.setItem("template_" + tem.template_name, JSON.stringify(tem))

                                templateLoadCount++;
                                if (templateLoadCount >= tvii.templates.templateList.length) {
                                    sessionStorage.setItem("temLoaded", "true");
                                    tvii.templates.requestJSONLoc();
                                }
                            }
                        }
                    };
                    xhr.send();
                })(tvii.templates.templateList[i]);
            }

        },
        get: function (templateName) {
            var getHTML = JSON.parse(sessionStorage.getItem("template_" + templateName)).template_html;
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


            locFile = tvii.getLang().split('-')[0] + "_" + region + ".json";

            var sendRequest = function (locFile) {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", tvii.clientUrl + "/loc/" + locFile);
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4) {
                        if (xhr.status == 200) {
                            tvii.locFile = JSON.parse(xhr.responseText);
                            $(document).trigger("vino:loaded");
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
            var localizedString = tvii.locFile[locID];

            if (arrayReplace && typeof arrayReplace === 'object') {
                for (var key in arrayReplace) {
                    if (Object.prototype.hasOwnProperty.call(arrayReplace, key)) {
                        var placeholder = new RegExp(key, 'g');
                        localizedString = localizedString.replace(placeholder, arrayReplace[key]);
                    }
                }
            }
            return localizedString;
        },
        setUpLocHTML: function () {
            $("body").find("[data-loc]").each(function (index, el) {
                var $el = $(el);
                var els = tvii.templates.getLoc($el.attr("data-loc"));
                $el.html(els);
                $el.removeAttr("data-loc");
            });

            $("body").find("[data-loc-attr]").each(function (index, el) {
                var a = JSON.parse($(el).attr("data-loc-attr"));

                for (var key in a) {
                    var value = a[key];
                    $(el).attr(key, tvii.templates.getLoc(value))
                }

            });
        }
    },
    olv: {
        requestPosts: function (limit, searchKeys, callbackSuccess, callbackError) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", tvii.clientUrl + "/api/v1/olvapi/posts?limit" + String(limit))
            xhr.onreadystatechange = function () {
                if (xhr.status === 4) {
                    if (xhr.status === 200) {
                        var response = JSON.parse(xhr.responseText)
                        callbackSuccess(response);
                    }
                }
            }
        }
    },
    getLoc: function () {
        return this.templates.getLoc.apply(this.templates, arguments);
    },
    setClassHoverToEls: function (els) {
        var sel = null;
        els.each(function () {
            if (!$.data(this, "hoverLSTNR")) {
                $(this).on("mousedown", function () {
                    sel = $(this);
                    vino.soundPlay('SE_CMN_TOUCH_ON');
                    $(this).data("soundPlayed", true);

                    $(this).addClass("hover");
                });
                $(this).on("mouseout", function (evt) {
                    if (sel && sel.length && !sel.is($(this))) {
                        return;
                    };

                    if (sel == null) {
                        $(this).removeClass("hover");
                        return;
                    }

                    $(this).removeClass("hover");
                    $(this).data("soundPlayed", false);

                    vino.soundPlay('SE_CMN_TOUCH_CANCEL');
                    sel = null;
                });
                $(this).on("mouseup", function () {
                    sel = null;
                    $(this).data("soundPlayed", false);
                    $(this).removeClass("hover");
                });
                $.data(this, "hoverLSTNR", true);
            }
        });
    },
    setActualClickListener: function ($elements, onRealClick) {
        var dragThreshold = 5;

        $elements.each(function () {
            var $el = $(this);

            // Remove any previously set handlers to avoid duplicates
            $el.off('.actualClick');

            $el.on('mousedown.actualClick', function (e) {
                $el.data('isDragging', false);
                $el.data('startX', e.pageX);
                $el.data('startY', e.pageY);
            });

            $el.on('mousemove.actualClick', function (e) {
                var startX = $el.data('startX') || 0;
                var startY = $el.data('startY') || 0;

                if (Math.abs(e.pageX - startX) > dragThreshold || Math.abs(e.pageY - startY) > dragThreshold) {
                    $el.data('isDragging', true);
                }
            });

            $el.on('click.actualClick', function (e) {
                if ($el.data('isDragging')) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    return false;
                }
                onRealClick.call(this, e);
            });
        });
    },
    getLang: function () {
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
    },
    getQuery: function (param, isSearch) {
        var queryString;

        if (isSearch) {
            queryString = window.location.search.substring(1);
        } else {
            queryString = param;
            param = param.split('?')[1];
        }

        var params = queryString.split('&');

        for (var i = 0; i < params.length; i++) {
            var pair = params[i].split('=');
            if (pair[0] === param) {
                return decodeURIComponent(pair[1]);
            }
        }

        return null;
    },
    pushStateWithQuery: function (queryName, queryValue, isPush, pushData) {
        var queryString = location.search;
        var currentQuery = tvii.getQuery(queryName, true);

        if (currentQuery == null) {
            queryString += queryString
                ? '&' + encodeURIComponent(queryName) + '=' + encodeURIComponent(queryValue)
                : '?' + encodeURIComponent(queryName) + '=' + encodeURIComponent(queryValue);
        } else {
            var regex = new RegExp('([?&])' + encodeURIComponent(queryName) + '=.*?(&|$)', 'i');
            queryString = queryString.replace(
                regex,
                '$1' + encodeURIComponent(queryName) + '=' + encodeURIComponent(queryValue) + '$2'
            );
        }

        const stateData = pushData || { __internal__: true };

        if (isPush) {
            window.history.pushState(stateData, '', tvii.clientUrl + queryString);
        } else {
            window.history.replaceState(stateData, '', tvii.clientUrl + queryString);
        }
    },
    clearWrapper: function () {
        $(".wrapper").html("");
    },
    replaceWrapper: function (html) {
        $(".wrapper").html(html)
    },
    getWrapper: function () {
        return $(".wrapper").html();
    },
    confirm: function (string, button1, button2) {
        return !vino.runTwoButtonDialog(string, button1 ? button1 : null, button2 ? button2 : null)
    },
    alert: function (dialog, button) {
        return vino.runSingleButtonDialog(dialog, button ? button : null)
    },
    showWrapper: function (show) {
        if (show) {
            $(".wrapper").removeClass("none");
        } else {
            $(".wrapper").addClass("none");
        }
    },
    clearEvents: function () {
        $(document).off("mousedown");
        $(document).off("mousemove");
        $(document).off("mouseup");
        $(document).off("scroll");
        $(document).off("click");
        $(window).off("click");
        $(window).off("scroll");
        $(window).off("mousemove");
        $(window).off("mousedown");
        $(".container").off("mousedown");
        $(".container").off("mousemove");
        $(".container").off("mouseup");
        clearInterval(window.infoUpdInterval);
        clearInterval(window.clockInterval);
        clearTimeout(window.clockTimeout);
    },
    setButtonActions: function () {
        function escapeForClassSelector(str) {
            return str.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
        }

        var inputCheck = setInterval(function () {
            wiiu.gamepad.update();
            var c = $('.l-stick-scroll:visible').first();
            var maxSpeed = 40; // Increased for faster max scrolling

            var dx = wiiu.gamepad.lStickX;
            var dy = wiiu.gamepad.lStickY;

            if (dx !== 0 && dy !== 0) {
                vino.navi_reset();
            }

            // Stick dead zone threshold
            if (Math.abs(dx) > 0.05) {
                c.scrollLeft(c.scrollLeft() + dx * maxSpeed); // X axis is fine
            }
            if (Math.abs(dy) > 0.05) {
                // Invert Y scrolling: pushing stick UP should scroll UP
                c.scrollTop(c.scrollTop() - dy * maxSpeed);
            }
        }, 16); // ~60fps


        document.onkeydown = function (evt) {
            var kc;
            if (evt) {
                kc = evt.keyCode;
            } else {
                kc = event.keyCode;
            }

            switch (kc) {
                case 37:
                case 39:
                case 38:
                case 40:
                    var rect = vino.navi_getRect();
                    if (rect) {
                        var parts = rect.split(',').map(function (v) {
                            return parseFloat(v.trim());
                        });

                        if (parts.length === 4) {
                            var top = parts[1];
                            var height = parts[3];

                            var c = $('.l-stick-scroll:visible').first().get(0);
                            const GP_HEIGHT = 480;

                            if (c) {
                                if ((top > GP_HEIGHT || top < 0) && (kc === 38 || kc === 40)) {
                                    c.scrollTop = c.scrollTop + top;
                                } else if ((top === 0 && c.scrollTop < GP_HEIGHT) && (kc === 38 || kc === 40)) {
                                    c.scrollTop = 0;
                                }
                            }
                        }
                    }

                    break;
                case 36:
                    //HBM
                    break;
                default:
                    break;
            }
            var chr = String.fromCharCode(kc).toLowerCase();
            var safeChr = escapeForClassSelector(chr);
            var els = $(".accesskey-" + safeChr + ":visible, .hidden-" + safeChr);

            if (els.length) {
                var el = els.first(); // target the first visible matching element
                if (el.is("input, textarea, select")) {
                    el.focus();
                    vino.wakeKeyboard();
                } else {
                    el.trigger("click");
                }
            }
        }
    },
    sendXHR: function (type, url, callbackSuccess, callbackError, headers, formData, dontLoadIcon) {
        tvii.abortOngoingXHR(dontLoadIcon);

        if (!dontLoadIcon) {
            vino.loading_setIconAppear(true);
        }

        tvii.currentXHR = new XMLHttpRequest();
        tvii.currentXHR.open(type, url);

        if (headers) {
            for (var i = 0; i < headers.length; i++) {
                var headerParts = headers[i].split(":");
                var headerName = headerParts[0].trim();
                var headerValue = headerParts[1].trim();
                tvii.currentXHR.setRequestHeader(headerName, headerValue);
            }
        }

        tvii.currentXHR.onreadystatechange = function () {
            if (tvii.currentXHR.readyState == 4) {
                if (!dontLoadIcon) {
                    vino.loading_setIconAppear(false);
                }
                if (tvii.currentXHR.status == 200) {
                    callbackSuccess(tvii.currentXHR.responseText || "", tvii.currentXHR);
                } else {
                    callbackError(tvii.currentXHR);
                }
                tvii.currentXHR = null;
            }
        }

        if (type === "POST" && formData) {
            tvii.currentXHR.send(formData);
        } else {
            tvii.currentXHR.send();
        }
    },
    requestProgramGuide: function (timestamp, lineup, duration, limit, offset, callbackSuccess, callbackFailure) {
        duration = duration === 120 ? 120 : 180;
        var xhr = new XMLHttpRequest();
        xhr.open("GET", tvii.clientUrl + "/api/v1/providers/lineup/" + lineup + "?start=" + String(timestamp) + "&duration=" + String(duration) + "&limit=" + String(limit) + "&offset=" + String(offset));
        xhr.onload = function () {
            if (xhr.status === 200) {
                var data;
                try {
                    data = JSON.parse(xhr.responseText);
                } catch (e) {
                    data = xhr.responseText;
                }
                callbackSuccess(data)
            } else {
                callbackFailure(xhr);
            }
        }
        xhr.send();
    },
    getAiringFlags: function (airingAttribute) {
        return {
            isLive: (airingAttribute & tvii.tvgAirFlags.LIVE) === tvii.tvgAirFlags.LIVE,
            isNew: (airingAttribute & tvii.tvgAirFlags.NEW) === tvii.tvgAirFlags.NEW,
            isAdult: (airingAttribute & tvii.tvgAirFlags.ADULT) === tvii.tvgAirFlags.ADULT,
        };
    },
    requestProgramDetails: function (id, type, callbackSuccess, callbackFailure) {
        type = type === "episode" ? "episode" : "program";
        tvii.sendXHR("GET", tvii.clientUrl + "/api/v1/providers/program/" + id + "/details" + "?type=" + type,
            function (responseText) {
                var details = JSON.parse(responseText).result.item;
                callbackSuccess(details)
            }, callbackFailure, null, null, true);
    },
    abortOngoingXHR: function (dontLoadIcon) {
        if (tvii.currentXHR != null) {
            if (!dontLoadIcon) {
                vino.loading_setIconAppear(false);
            }
            tvii.currentXHR.abort();
            console.warn("xhr aborted")
            tvii.currentXHR = null;
        }
    },
    makeScrollContainer: function (container, isHorizontal) {
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
        this.friction = 0.90; // Inertia friction factor
        this.inertiaInterval = null;
        this.hasStartedScrolling = false; // To track if scrolling has started

        var self = this;

        // Initialize event listeners
        this.scrCont.on('mousedown', function (e) {
            self.isMouseDown = true;
            self.startPosX = e.pageX;
            self.startPosY = e.pageY;
            self.scrollStartX = self.scrCont.scrollLeft();
            self.scrollStartY = self.scrCont.scrollTop();
            self.lastScrollPosX = self.scrollStartX; // Track the last scroll position for velocity calculation
            self.lastScrollPosY = self.scrollStartY;
            self.scrollVelocityX = 0; // Reset scroll velocity on mousedown
            self.scrollVelocityY = 0;
            self.scrCont.css('cursor', 'grabbing');
            clearInterval(self.inertiaInterval); // Stop any previous inertia interval
        });

        $(document).on('mouseup', function () {
            if (self.isMouseDown) {
                self.isMouseDown = false;
                self.scrCont.css('cursor', 'grab');
                self.hasStartedScrolling = false; // Reset scroll start flag

                // Smooth scrolling inertia
                self.inertiaInterval = setInterval(function () {
                    var continueX = Math.abs(self.scrollVelocityX) > 0.1;
                    var continueY = Math.abs(self.scrollVelocityY) > 0.1;

                    if (continueX || continueY) {
                        if (continueX) {
                            self.scrCont.scrollLeft(self.scrCont.scrollLeft() + self.scrollVelocityX);
                            self.scrollVelocityX *= self.friction;
                        }
                        if (continueY) {
                            self.scrCont.scrollTop(self.scrCont.scrollTop() + self.scrollVelocityY);
                            self.scrollVelocityY *= self.friction;
                        }

                        // Trigger scrolling event on the container element
                        self.scrCont.trigger('scrolling', {
                            scrollX: self.scrCont.scrollLeft(),
                            scrollY: self.scrCont.scrollTop()
                        });
                    } else {
                        clearInterval(self.inertiaInterval); // Stop inertia when velocity is low

                        // Trigger scrollEnd event on the container element
                        /*self.scrCont.trigger('scrollEnd', {
                            scrollX: self.getScrollX(),
                            scrollY: self.getScrollY()
                        });*/
                    }
                }, 20); // Update every 20ms for smooth scrolling
            }
        });

        this.scrCont.on('mousemove', function (e) {
            if (self.isMouseDown) {
                if (!self.hasStartedScrolling) {
                    self.hasStartedScrolling = true;

                    // Trigger scrollStart event on the container element
                    /*self.scrCont.trigger('scrollStart', {
                        scrollX: self.getScrollX(),
                        scrollY: self.getScrollY()
                    });*/
                }

                var currentPosX = e.pageX;
                var currentPosY = e.pageY;

                var walkX;
                var walkY;

                if (self.isHorizontal === 4) {
                    // Strictly horizontal or vertical scrolling
                    var deltaX = Math.abs(currentPosX - self.startPosX);
                    var deltaY = Math.abs(currentPosY - self.startPosY);

                    // Compare the difference in movement to decide the forced scroll direction
                    if (deltaX > deltaY) {
                        // Horizontal scroll
                        walkX = (currentPosX - self.startPosX) * 2; // Scroll speed
                        self.scrCont.scrollLeft(self.scrollStartX - walkX);
                        self.scrollVelocityX = self.scrCont.scrollLeft() - self.lastScrollPosX; // Update velocity based on scroll change
                        self.lastScrollPosX = self.scrCont.scrollLeft(); // Update last scroll position
                        self.scrollVelocityY = 0; // Prevent any vertical velocity
                    } else {
                        // Vertical scroll
                        walkY = (currentPosY - self.startPosY) * 2; // Scroll speed
                        self.scrCont.scrollTop(self.scrollStartY - walkY);
                        self.scrollVelocityY = self.scrCont.scrollTop() - self.lastScrollPosY; // Update velocity based on scroll change
                        self.lastScrollPosY = self.scrCont.scrollTop(); // Update last scroll position
                        self.scrollVelocityX = 0; // Prevent any horizontal velocity
                    }
                } else {
                    // Normal behavior (not forced to one direction)
                    walkX = (currentPosX - self.startPosX) * 2; // Scroll speed
                    walkY = (currentPosY - self.startPosY) * 2;

                    if (self.isHorizontal === true || self.isHorizontal === 3) {
                        self.scrCont.scrollLeft(self.scrollStartX - walkX);
                        self.scrollVelocityX = self.scrCont.scrollLeft() - self.lastScrollPosX; // Update velocity based on scroll change
                        self.lastScrollPosX = self.scrCont.scrollLeft(); // Update last scroll position
                    }
                    if (self.isHorizontal === false || self.isHorizontal === 3) {
                        self.scrCont.scrollTop(self.scrollStartY - walkY);
                        self.scrollVelocityY = self.scrCont.scrollTop() - self.lastScrollPosY; // Update velocity based on scroll change
                        self.lastScrollPosY = self.scrCont.scrollTop(); // Update last scroll position
                    }
                }

                // Trigger scrolling event on the container element
                self.scrCont.trigger('scrolling', {
                    scrollX: self.scrCont.scrollLeft(),
                    scrollY: self.scrCont.scrollTop()
                });
            }
        });

        this.stop = function () {
            clearInterval(self.inertiaInterval);
            self.scrollVelocityX = 0;
            self.scrollVelocityY = 0;
        };
    },
    getLockedHourTimestamp: function () {
        // Get current UTC timestamp in milliseconds
        var now = new Date();
        var utcTimestamp = now.getTime(); // already in UTC

        // Apply your custom offset (e.g., -18000 seconds = -5 hours)
        var offsetMillis = tvii.profile.UTCOffset * 1000;
        var localTimestamp = utcTimestamp + offsetMillis;

        // Get local time with offset
        var localDate = new Date(localTimestamp);
        var minutes = localDate.getUTCMinutes();

        // Decide if we round to :00 or :30
        if (minutes < 30) {
            localDate.setUTCMinutes(0, 0, 0);
        } else {
            localDate.setUTCMinutes(30, 0, 0);
        }

        // Convert back to UTC
        var lockedUtcTimestamp = localDate.getTime() - offsetMillis;

        return Math.floor(lockedUtcTimestamp / 1000); // return in seconds
    },
    getCurrentTimestamp: function () {
        // Get current UTC timestamp in milliseconds
        var now = new Date();
        var utcTimestamp = now.getTime(); // already in UTC

        // Apply your custom offset (e.g., -18000 seconds = -5 hours)
        var offsetMillis = tvii.profile.UTCOffset * 1000;
        var localTimestamp = utcTimestamp + offsetMillis;

        // Truncate to the start of the hour in that offset time
        var localDate = new Date(localTimestamp);

        // Convert it back to UTC timestamp by subtracting the offset
        var lockedUtcTimestamp = localDate.getTime() - offsetMillis;

        return Math.floor(lockedUtcTimestamp / 1000); // final result in seconds
    },
    getDateWithOffset: function () {
        var now = new Date();
        var utc = now.getTime() + (now.getTimezoneOffset() * 60000); // always gives real UTC
        return new Date(utc + (tvii.profile.UTCOffset * 1000)); // offset from UTC
    },
    setUpPageTip: function () {
        var span = document.querySelector(".program-list .content .tips span:nth-of-type(2)");
        if (!span) return;

        var tipIndex = Math.floor(Math.random() * 12) + 1; // 1 to 12
        var key = "vino.home.tips.tip" + tipIndex;
        var tipText = tvii.getLoc(key);

        span.innerHTML = tipText;
    },
    initialize: function () {
        vino.lyt_setIsEnableWhiteMask(true);
        vino.lyt_setIsEnableClientLoadingIcon(true);

        vino.ir_enableCodeset(2);

        vino.ir_muteOneShotSound(true);
        vino.loading_setIconRect(360, 160, 120, 120);

        const statuses = {
            SERVER_UNAVAILABLE: 1,
            ACCOUNT_EXISTS: 2,
            ACCOUNT_DOESNT_EXIST_YET: 3
        }

        $(document).on("vino:loaded", function () {
            $(document).off("vino:loaded");
            tvii.setButtonActions();
            initLoginCheck();

            function initLoginCheck() {
                var xhr = new XMLHttpRequest();
                xhr.open("POST", tvii.clientUrl + "/api/v1/act/checkLogIn");
                xhr.onload = function () {
                    if (!xhr || !xhr.responseText || !xhr.status) {
                        tvii.alert(tvii.getLoc("vino.error.account_creation_unavailable"));
                        vino.exitForce();
                    }

                    try {
                        var res = JSON.parse(xhr.responseText);
                        if (res.status === "verified") {
                            tvii.profile.UTCOffset = res.profile.utc_offset;
                            tvii.profile.tv_provider_id = res.profile.tv_provider_id;
                            tvii.profile.user_id = res.profile.user_id;
                            initVinoHome();
                        } else {
                            initVinoSetup();
                        }
                    } catch (e) {
                        tvii.alert(tvii.getLoc("vino.error.account_creation_unavailable"));
                        vino.exitForce();
                    }
                };
                xhr.send();
            }
        });

        tvii.templates.requestAll();
    }
}

function initVinoSetup() {
    tvii.pushStateWithQuery("page", "setup", false);
    tvii.replaceWrapper(tvii.templates.get(tvii.getQuery("page", true)));
    tvii.templates.setUpLocHTML();
    tvii.BGMId = vino.soundPlayVolume("SE_APP_START_SUB", 30);

    var savedCode;
    var savedRegionCA;
    var savedCityCA;
    var XInterval;
    var XAfterLogInReturnTimeout;
    var BAfterLogInReturnTimeout;
    var setupCont = new tvii.makeScrollContainer($(".setup-modal-container"), false);

    var isUS = vino.info_getCountry() === "US";
    var isCA = vino.info_getCountry() === "CA";
    var usZipCodeInput = $(".zipcode-input .zip-usa");
    var caZipCodeContainer = $(".zipcode-input .zip-canada");
    var miiImg = $("#setup-modal-6 .mii img");
    var xModal = $("#x-login");
    var bModal = $("#bsky-login");

    if (!isUS && !isCA) {
        tvii.alert(tvii.getLoc("vino.error.not_supported_error"));
        vino.exitForce();
    }

    $("a, input").on("click", function () {
        vino.lyt_startTouchEffect();
    })

    $("a.btn-1:not(.black)").on("click", function () {
        if ($(this).hasClass("disabled")) return;
        vino.soundPlayVolume("SE_CLOSE", 30);
    });

    $("a.btn-2, .social-buttons a").on("click", function () {
        if ($(this).hasClass("disabled")) return;
        vino.soundPlayVolume("SE_DECIDE", 30);
    });

    var miiData = encodeURIComponent(vino.act_getMiiData(tvii.userSlot));

    var baseUrl = tvii.clientUrl + "/api/v1/miis?api_id=1&texResolution=128&width=128&data=" + miiData;
    var smileUrl = tvii.clientUrl + "/api/v1/miis?api_id=1&texResolution=128&width=128&expression=smile&data=" + miiData;

    var noMii = "/img/noMii.png";
    // Preload both
    //GC will free them from memory...
    var preload1 = new Image();
    preload1.src = baseUrl;

    var preload2 = new Image();
    preload2.src = smileUrl;

    var preload3 = new Image();
    preload3.src = noMii;

    miiImg.attr("src", preload1.src);

    miiImg.on("error", function () {
        $(this).attr("src", preload3.src);
        miiImg.off("error");
    });

    $("#setup-modal-1 .btn-1.black").on("click", function () {
        disposeXCode();
        vino.soundPlayVolume("SE_COMMON_FINISH", 30);
        vino.exit();
    })

    function disposeXCode() {
        var code = xModal.find(".code").text();
        if (!code || !code.length) {
            console.log("No code to dispose (X)")
            return;
        }

        var form = new FormData();
        form.append("code", code)

        //Sometimes request will continue even after closing Vino and returning to the OS
        //Its weird why it happens sometimes, eShop has similar behavior but works always?
        //Check how eShop handles it
        var request = new XMLHttpRequest();
        request.open("POST", tvii.clientUrl + "/api/v1/socials/XCodeDispose");
        request.send(form);
    }

    xModal.find(".btn-2").on("click", logOutX)
    bModal.find(".submit-login").on("click", logInBsky)
    bModal.find(".submit-logout").on("click", logOutBsky)
    $(".btn-2.account-creation").on("click", createAccount)

    function changeSetupModal(show, hide) {
        if (hide) {
            hide.addClass("none");
        }
        show.removeClass("none");
        setupCont.scrCont.scrollTop(0);

        if (show.attr("id") === "x-login") {
            XOauthLogic();
        } else if (show.attr("id") === "bsky-login") {
            console.log()
        } else if (show.attr("id") === "setup-modal-5") {
            clearTimeout(XAfterLogInReturnTimeout)
            clearTimeout(BAfterLogInReturnTimeout)
            clearXCodeInterval();
        }
    }

    var accountCreating = false;

    function createAccount() {
        if (accountCreating) return;
        accountCreating = true;
        //Not supposed to be able to trigger this func without having selected a provider.
        var providerSelA = $(".tvproviders").find(".selected[data-provider-id]");
        var tvProviderId = providerSelA.attr("data-provider-id")

        var form = new FormData();
        form.append("pid", vino.act_getPid(tvii.userSlot));
        form.append("country", vino.info_getCountry());
        form.append("xOauthToken", xModal.attr("data-x-oauth-token"))
        form.append("xOauthSecret", xModal.attr("data-x-oauth-secret"))
        form.append("xUserId", xModal.attr("data-x-user-id"))
        form.append("bskyUsernameTemp", bModal.attr("data-bsky-username"))
        form.append("bskyPasswordTemp", bModal.attr("data-bsky-password"))
        form.append("tv_provider_id", tvProviderId);

        tvii.sendXHR("POST", tvii.clientUrl + "/api/v1/act/createAccount", function (responseText) {
            miiImg.attr("src", preload2.src);
            vino.soundStop(tvii.BGMId);
            tvii.BGMId = null;
            accountCreating = false;

            window.location.replace("?page=home");
        }, function (request) {
            var status = request.responseText ? request.responseText : null;
            if (status) {
                status = JSON.parse(status).status;
                if (status === "error_not_pretendo") {
                    handleError(true);
                } else {
                    handleError(false);
                }
            } else {
                handleError(false);
            }

            function handleError(isPretendoError) {
                if (isPretendoError) {
                    tvii.alert(tvii.getLoc("vino.error.account_not_pretendo"))
                } else {
                    tvii.alert(tvii.getLoc("vino.error.account_creation_unavailable"))
                }
            }

            accountCreating = false;
        }, null, form)
    }

    function logInBsky() {
        //Actually only checks if the account is valid.
        //Session tokens are created when submitting the account creation.
        var username = bModal.find(".username").val();
        var password = bModal.find(".password").val();

        if (username.length < 1 || password.length < 1) {
            tvii.alert(tvii.getLoc("vino.setup.bsky-login.p9"))
            return;
        }

        var request = new XMLHttpRequest();

        var form = new FormData();
        form.append("username", username)
        form.append("password", password)

        request.open("POST", tvii.clientUrl + "/api/v1/socials/BSLoginCheck");
        request.onload = function () {
            if (request.status === 200) {
                var res = JSON.parse(request.responseText);
                if (!res.active) {
                    tvii.alert(tvii.getLoc("vino.setup.bsky-login.p8"))
                    return;
                }
                bModal.attr("data-bsky-logged-in", "true")
                bModal.attr("data-bsky-username", username)
                bModal.attr("data-bsky-password", password)

                bModal.find("input").addClass("none")
                bModal.find(".submit-login").addClass("none")
                bModal.find(".submit-logout").removeClass("none")
                bModal.find("p:not(.logged-in)").addClass("none")
                bModal.find(".logged-in").removeClass("none")
                bModal.find(".display-name").text(res.displayName)
                bModal.find(".username").text("@" + res.handle)


                BAfterLogInReturnTimeout = setTimeout(function () {
                    changeSetupModal($("#setup-modal-5"), bModal)
                }, 1200)
            } else {
                tvii.alert(tvii.getLoc("vino.setup.bsky-login.p6"))
            }
        }
        request.send(form);
    }

    function logOutBsky() {
        if (tvii.confirm(tvii.getLoc("vino.setup.bsky-login.p7"), tvii.getLoc("vino.cancel"), tvii.getLoc("vino.logout"))) {

            bModal.attr("data-bsky-logged-in", "false")
            bModal.attr("data-bsky-username", "")
            bModal.attr("data-bsky-password", "")

            bModal.find("input").removeClass("none")
            bModal.find("input").val("")
            bModal.find("p:not(.logged-in)").removeClass("none")
            bModal.find(".logged-in").addClass("none")
            bModal.find(".display-name").text("")
            bModal.find(".username").text("")
            bModal.find(".submit-login").removeClass("none")
            bModal.find(".submit-logout").addClass("none")

            changeSetupModal($("#setup-modal-5"), bModal)
        }
    }

    function XOauthLogic() {
        generateXCodeAuth(setXCodeInterval)
    }

    function logOutX() {
        if (tvii.confirm(tvii.getLoc("vino.setup.x-login.p3"), tvii.getLoc("vino.cancel"), tvii.getLoc("vino.logout"))) {

            var modal = xModal;
            modal.attr("data-x-oauth-token", "")
            modal.attr("data-x-oauth-secret", "")
            modal.attr("data-x-user-id", "")
            modal.attr("data-x-logged-in", "false")
            modal.find(".btn-2").addClass("none")
            modal.find(".code").removeClass("none")
            modal.find(".logged-in").addClass("none")
            modal.find("p:not(.logged-in)").removeClass("none")
            modal.find(".code").text("")

            changeSetupModal($("#setup-modal-5"), modal)
        }
    }

    function generateXCodeAuth(callback) {
        var modal = xModal;
        if (modal.attr("data-x-logged-in") === "true") {
            return;
        }
        if (modal.find(".code").text().length) {
            callback(modal.find(".code").text())
            console.log("code exists")
            return;
        }
        var xhr = new XMLHttpRequest();
        /*its a POST for prod*/
        //xhr.open("GET", tvii.clientUrl + "/apid/generateXCode.json");
        xhr.open("POST", tvii.clientUrl + "/api/v1/socials/XCodeCreate");
        xhr.onload = function () {
            if (xhr.status === 200) {
                var code = JSON.parse(xhr.responseText).code;
                callback(code);
                modal.find(".code").text(code);
            }
        }
        xhr.send();
    }

    function clearXCodeInterval() {
        clearInterval(XInterval)
    }

    function setXCodeInterval(codeToCheck) {
        XInterval = setInterval(function () {
            var xhr = new XMLHttpRequest();
            //xhr.open("GET", tvii.clientUrl + "/apid/checkXCodeLogged.json?code=" + codeToCheck)
            xhr.open("GET", tvii.clientUrl + "/api/v1/socials/XCodeCheck?code=" + codeToCheck)
            xhr.onload = function () {
                if (xhr.status === 200) {
                    var modal = xModal;
                    var response = JSON.parse(xhr.responseText);

                    if (response.status === "verified") {
                        clearXCodeInterval();
                        modal.attr("data-x-oauth-token", response.x_oauth_token)
                        modal.attr("data-x-oauth-secret", response.x_oauth_secret)
                        modal.attr("data-x-user-id", response.x_user_id)
                        modal.attr("data-x-logged-in", "true")
                        modal.find(".code").addClass("none")
                        modal.find("p:not(.logged-in)").addClass("none")
                        modal.find(".logged-in").removeClass("none")
                        modal.find(".logged-in .display-name").text("@" + response.x_screen_name);
                        modal.find(".btn-2").removeClass("none")

                        XAfterLogInReturnTimeout = setTimeout(function () {
                            changeSetupModal($("#setup-modal-5"), modal)
                        }, 1200)
                    } else if (response.status === "expired") {
                        //MEANS IT EXPIRED
                        tvii.alert(tvii.getLoc("vino.setup.x-login.p4"))
                        //Clean the code so it generates a new one
                        modal.find(".code").text("")
                        changeSetupModal($("#setup-modal-5"), modal)
                    }

                }
            }
            xhr.send();
        }, 3190);
    }

    function checkZipCodeProviders() {

        if (isUS) {
            var code = usZipCodeInput.val();

            if ($(".tvproviders>a").length && savedCode === code) {
                return;
            } else {
                $(".tvproviders>a").remove();
            }

            savedCode = code;

            tvii.sendXHR("GET", tvii.clientUrl + "/api/v1/providers/" + code,
                function (responseText) {
                    var providers = JSON.parse(responseText).result;
                    setUpProviderAnchors(providers)
                }, function () {
                    $(".tvproviders").addClass("none")
                    tvii.alert(tvii.getLoc("vino.setup.screen3.m1"), tvii.getLoc("vino.setup.screen3.m1.b1"));
                    changeSetupModal($("#setup-modal-2"), $("#setup-modal-3"))
                });

        } else if (isCA) {
            var region = $(".zip-canada select#ca-region").val();
            var city = $(".zip-canada select#ca-city").val();

            if ($(".tvproviders>a").length && region === savedRegionCA && city === savedCityCA) {
                return;
            } else {
                $(".tvproviders>a").remove();
            }

            savedCityCA = city;
            savedRegionCA = region;

            tvii.sendXHR("GET", tvii.clientUrl + "/api/v1/providers/countries/CA?type=providers&city=" + encodeURIComponent(city) + "&region=" + encodeURIComponent(region),
                function (responseText) {
                    var providers = JSON.parse(responseText).result;
                    setUpProviderAnchors(providers)
                }, function () {
                    $(".tvproviders").addClass("none")
                    tvii.alert(tvii.getLoc("vino.setup.screen3.m2"), tvii.getLoc("vino.setup.screen3.m2.b1"));
                    changeSetupModal($("#setup-modal-2"), $("#setup-modal-3"))
                });
        }

        function setUpProviderAnchors(providers) {
            for (var i = 0; i < providers.length; i++) {
                var provider = providers[i];
                var providerA = $("<a>");
                providerA.addClass("none");
                providerA.attr("data-provider-id", provider.id);
                providerA.attr("navi_target", "");
                providerA.attr("tabindex", "0");
                providerA.attr("data-provider-type", provider.type);

                var providerN = $("<p>");
                providerN.html(provider.name)

                //API issue where the city name doesnt match the satellite providers.
                //Handle it to avoid confusion by not adding city label
                if (isUS || isCA && provider.type != "satellite") {
                    var providerC = $("<span>")
                    providerC.html(provider.city)
                }

                providerA.append(providerN)
                if (isUS || isCA && provider.type != "satellite") {
                    providerA.append(providerC)
                }

                $(".tvproviders").append(providerA)
            }

            $(".tvproviders .providertypes>a").removeClass("selected");
            $(".tvproviders .providertypes>a:first-child").addClass("selected");

            tvii.setActualClickListener($('.tvproviders>a'), function () {
                $(this).focus();
                vino.navi_setToFocused(true);
                vino.lyt_startTouchEffect();
                vino.soundPlayVolume("SE_CHECK", 30);
                $('.tvproviders>a').removeClass("selected");
                $(this).addClass("selected");
                vino.navi_decide();
                document.activeElement.blur();
            });

            $('.tvproviders>a').addClass("none")
            $('.tvproviders>a[data-provider-type="cable"]').removeClass("none");

            $('.tvproviders>a[data-provider-type="cable"]').last().addClass("last")
            $('.tvproviders>a[data-provider-type="broadcast"]').last().addClass("last")
            $('.tvproviders>a[data-provider-type="satellite"]').last().addClass("last")

            $(".tvproviders").removeClass("none")
        }
    }

    function getCanadaRegionsAndCitys(callback) {
        var xhr = new XMLHttpRequest();
        tvii.sendXHR("GET", tvii.clientUrl + "/api/v1/providers/countries/CA?type=regions",
            function (responseText) {
                $(".zip-canada select#ca-region option").remove();
                $(".zip-canada select#ca-city option").remove();
                $(".zip-canada select#ca-city-page option").remove();

                var regions = JSON.parse(responseText).result;
                for (var regionKey in regions) {
                    if (Object.prototype.hasOwnProperty.call(regions, regionKey)) {
                        var regionOpt = $("<option>");
                        regionOpt.attr("value", regionKey);
                        regionOpt.text(regionKey);
                        $(".zip-canada select#ca-region").append(regionOpt);
                    }
                }

                function updatePageCounter() {
                    var selectedRegion = $(".zip-canada select#ca-region").val();

                    if (Object.prototype.hasOwnProperty.call(regions, selectedRegion)) {
                        var cities = regions[selectedRegion];
                        var pageCount = Math.ceil(cities.length / 100);

                        var $pageSelect = $(".zip-canada select#ca-city-page");
                        $pageSelect.empty(); // clear existing options

                        for (var i = 1; i <= pageCount; i++) {
                            var pageOpt = $("<option>");
                            pageOpt.attr("value", i);
                            pageOpt.text(i);
                            $pageSelect.append(pageOpt);
                        }
                    }
                }

                function updateCitySelector() {
                    var page = parseInt($(".zip-canada select#ca-city-page").val(), 10); // Current page number
                    var regionKey = $(".zip-canada select#ca-region").val(); // Current selected region

                    if (!regions[regionKey]) return; // Exit if region is not valid

                    var allCities = regions[regionKey]; // Cities for the selected region
                    var perPage = 100;
                    var start = (page - 1) * perPage;
                    var end = start + perPage;

                    var citySlice = allCities.slice(start, end); // Get correct range of cities

                    var $citySelect = $(".zip-canada select#ca-city");
                    $citySelect.empty(); // Clear old options

                    for (var i = 0; i < citySlice.length; i++) {
                        var city = citySlice[i];
                        var $opt = $("<option>").val(city).text(city);
                        $citySelect.append($opt);
                    }

                }

                updatePageCounter();
                updateCitySelector();

                $(".zip-canada select#ca-city-page").on("change", updateCitySelector)
                $(".zip-canada select#ca-region").on("change", function () {
                    updatePageCounter();
                    updateCitySelector();
                })

                //For Canada, a default is already set on the dropdown, continue with setup.
                $(".zipcode-checkconfirm").removeClass("disabled");
            }, function () {
                tvii.alert(tvii.getLoc("vino.error.canada_region_request"))
                vino.exitForce();
            });
    }

    $("a[data-show][data-hide]").on("click", function () {
        var a = $(this);
        changeSetupModal($(a.attr("data-show")), $(a.attr("data-hide")))
    })

    //Check if its US or Canada
    if (isUS) {
        usZipCodeInput.removeClass("none");
        $(".us-provider-info").removeClass("none")
    } else if (isCA) {
        caZipCodeContainer.removeClass("none");
        $(".ca-provider-info").removeClass("none")
        getCanadaRegionsAndCitys();
    }

    changeSetupModal($("#setup-modal-1"), null)

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
        changeSetupModal($("#setup-modal-3"), $("#setup-modal-2"))

        checkZipCodeProviders();
    })

    $(".provider-checkconfirm").on("click", function () {
        if ($('.tvproviders>a.selected').length) {
            changeSetupModal($("#setup-modal-4"), $("#setup-modal-3"))
        } else {
            tvii.alert(tvii.getLoc("vino.setup.screen3.p2"))
        }
    })

    $(".tvproviders .providertypes>a").on("click", function () {
        vino.soundPlayVolume("SE_TAB_SELECT", 30);

        $(".tvproviders .providertypes>a").removeClass("selected");
        $(this).addClass("selected")

        $('.tvproviders>a').addClass("none")
        $('.tvproviders>a[data-provider-type="' + $(this).attr("data-provider-filter") + '"]').removeClass("none");
    })
};

function initVinoHome() {
    tvii.pushStateWithQuery("page", "home", false);
    tvii.replaceWrapper(tvii.templates.get(tvii.getQuery("page", true)));
    tvii.templates.setUpLocHTML();

    window.addEventListener("popstate", function (e) {
        var query = tvii.getQuery("scene", true);
        console.log("popstate" + query)
        if (query === "programpreview") {
            alert(JSON.stringify(e.state.program))
        } else if (query === "livetab") {
            closeProgramPageWithAnim();
        }
    });

    if (tvii.getQuery("scene", true)) {
        tvii.pushStateWithQuery("scene", "livetab", false);
    } else {
        tvii.pushStateWithQuery("scene", "livetab", false);
    }

    setupClock();
    tvii.setUpPageTip();
    tvii.setClassHoverToEls($(".exit, .menu, .back, .tune-in, .prev-page, .next-page"));

    $(".header .exit").on("click", function () {
        vino.soundPlayVolume("SE_COMMON_FINISH_TOUCH_OFF", 30);
        vino.exit();
    })

    $(".back").on("click", function () {
        vino.soundPlayVolume("SE_CLOSE_TOUCH_OFF", 30);
        history.back();
    })

    $(".tune-in").on("click", function () {
        var chNum = $(".program-info .program-details").attr("data-chnumfoc");
        if (!chNum) return;

        chNum = chNum.trim();
        vino.soundPlayVolume("SE_REMOTE_FINISH", 30);

        var digits = chNum.split("");
        var index = 0;

        function sendNextDigit() {
            if (index >= digits.length) return;

            var digit = digits[index++];
            var code = 0;

            switch (digit) {
                case "0": code = 20; break;
                case "1": code = 11; break;
                case "2": code = 12; break;
                case "3": code = 13; break;
                case "4": code = 14; break;
                case "5": code = 15; break;
                case "6": code = 16; break;
                case "7": code = 17; break;
                case "8": code = 18; break;
                case "9": code = 19; break;
                default: sendNextDigit(); return; // skip invalid chars
            }

            vino.ir_send(code, 0);
            setTimeout(sendNextDigit, 550);
        }

        sendNextDigit();
    });

    $(".header .tabs>a").on("click", function () {
        $(".header .tabs>a").removeClass("selected");
        $(this).addClass("selected");
    })

    var requested = false;
    var lastRequestedHeight = 0;
    var head = document.querySelector(".header"); // Will move up
    var head2 = document.querySelector(".header.pr-details"); // Will move up
    var bott = document.querySelector(".bottom"); // Will move down
    var cent = document.querySelector(".program-central");
    var det = document.querySelector(".program-fulldetails-page");
    var scrollPosition = 0;
    var frameRate = Math.round(1000 / 60);
    var currentTime = tvii.getLockedHourTimestamp();
    var lineup = tvii.profile.tv_provider_id;
    var limit = 100;
    var offset = 0;
    var total = 0;
    var duration = 120;

    var activeProgram = {
        info: {
            id: null,
            airingAttrib: null
        },
        channel: {
            name: null,
            number: null,
            logo: null,
            networkName: null,
            networkId: null,
            sourceId: null,
            fullName: null,
        },
        time: {
            start: null,
            end: null,
        }
    }

    function setUpTitleScrollbar(onSnapCallback, onConfirmCallback) {
        var container = document.querySelector(".program-list .content");
        var thumb = document.querySelector(".program-list .scrollbar .thumb");

        var minThumbTop = 20;
        var maxThumbTop = 225;
        var snapAnchorY = 193.5;

        var currentSnappedElement = null;
        var lastScrollSound = null;
        var lastScrollTop = container.scrollTop;
        var scrollSoundThreshold = 4;
        var isSnappingBack = false;
        var scrollEndSfx = "SE_LIST_SCROLL_END";
        var scrollSfx = scrollEndSfx.slice(0, -4);
        var vol = 60;

        function updateThumbPosition() {
            var maxScroll = container.scrollHeight - container.clientHeight;
            if (maxScroll <= 0) return;
            var scrollRatio = container.scrollTop / maxScroll;
            var newTop = minThumbTop + scrollRatio * (maxThumbTop - minThumbTop);
            thumb.style.top = newTop + "px";
        }

        function updateContainerScroll(thumbTop) {
            var maxScroll = container.scrollHeight - container.clientHeight;
            if (maxScroll <= 0) return;
            var scrollRatio = (thumbTop - minThumbTop) / (maxThumbTop - minThumbTop);
            container.scrollTop = scrollRatio * maxScroll;
        }

        function playScrollSound() {
            const maxScroll = container.scrollHeight - container.clientHeight;
            const top = container.scrollTop;
            const delta = Math.abs(top - lastScrollTop);

            const nearTop = top <= 1;
            const nearBottom = top >= maxScroll - 1;

            // Only play scrollEndSfx when newly arriving at top or bottom
            if (nearTop) {
                if (lastScrollSound !== "top") {
                    vino.soundPlayVolume(scrollEndSfx, vol);
                    lastScrollSound = "top";
                }
            } else if (nearBottom) {
                if (lastScrollSound !== "bottom") {
                    vino.soundPlayVolume(scrollEndSfx, vol);
                    lastScrollSound = "bottom";
                }
            } else if (delta >= scrollSoundThreshold) {
                // You're scrolling in the middle (not top/bottom)
                vino.soundPlayVolume(scrollSfx, vol);
                lastScrollSound = "scrolling";
            }

            lastScrollTop = top;
        }

        function snapToElement(elem, triggerCallback) {
            if (!elem) return;
            var containerRectTop = container.getBoundingClientRect().top;
            var anchorY = containerRectTop + snapAnchorY;
            var rect = elem.getBoundingClientRect();
            var delta = (rect.top + rect.height / 2) - anchorY;
            var targetScroll = container.scrollTop + delta;

            isSnappingBack = true;
            $(container).stop(true).animate({ scrollTop: targetScroll }, 120, function () {
                updateThumbPosition();
                currentSnappedElement = elem;
                isSnappingBack = false;
                if (typeof onSnapCallback === "function" && triggerCallback) {
                    onSnapCallback(elem);
                }
            });
        }
        if (!window.snapToClosestProgram) {
            window.snapToClosestProgram = function (triggerCallback) {
                var programs = container.querySelectorAll(".program");
                var len = programs.length;
                if (!len) return;

                var containerRectTop = container.getBoundingClientRect().top;
                var anchorY = containerRectTop + snapAnchorY;
                var closest = null;
                var closestDistance = 999999;

                for (var i = 0; i < len; i++) {
                    var rect = programs[i].getBoundingClientRect();
                    var centerY = rect.top + rect.height / 2;
                    var distance = Math.abs(centerY - anchorY);
                    if (distance < closestDistance) {
                        closest = programs[i];
                        closestDistance = distance;
                    }
                }

                if (!closest) return;
                snapToElement(closest, triggerCallback);
            }
        }
        // Scrollbar dragging
        thumb.addEventListener("mousedown", function (e) {
            e.preventDefault();
            lastScrollSound = null;
            var startY = e.clientY;
            var startTop = parseFloat(thumb.style.top) || minThumbTop;

            function onMouseMove(e) {
                var deltaY = e.clientY - startY;
                var newTop = Math.max(minThumbTop, Math.min(maxThumbTop, startTop + deltaY));
                thumb.style.top = newTop + "px";
                updateContainerScroll(newTop);
                playScrollSound();
            }

            function onMouseUp() {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
                snapToClosestProgram(true);
            }

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });

        // Container drag scroll
        container.addEventListener("mousedown", function (e) {
            var startY = e.clientY;
            var startScroll = container.scrollTop;
            var isDragging = false;
            lastScrollSound = null;

            function onMouseMove(e) {
                var deltaY = e.clientY - startY;
                if (Math.abs(deltaY) > 1) isDragging = true;
                container.scrollTop = startScroll - deltaY;
                updateThumbPosition();
                playScrollSound();
            }

            function onMouseUp() {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
                if (isDragging) snapToClosestProgram(true);
            }

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });

        // Sync thumb when scrolling
        container.addEventListener("scroll", updateThumbPosition);
        updateThumbPosition();
        lastScrollTop = container.scrollTop;

        // Click listener
        if (!window.setListenerToProgram) {
            window.setListenerToProgram = function () {
                var $programs = $(".program");
                $programs.each(function () {
                    var $el = $(this);
                    if ($el.data("tscr-d")) return;
                    $el.data("tscr-d", true);
                    tvii.setActualClickListener($programs, function () {
                        if (isSnappingBack) return;
                        vino.lyt_startTouchEffect();
                        if (typeof onConfirmCallback === "function" && (this === currentSnappedElement)) {
                            onConfirmCallback(this);
                            return;
                        }
                        vino.soundPlayVolume(scrollSfx, vol);
                        snapToElement(this, true);
                    });
                });
            }
        }

        // Previous/Next controls via hidden-e (UP) and hidden-d (DOWN)
        var hiddenUp = document.querySelector(".title-program-up");
        var hiddenDown = document.querySelector(".title-program-down");
        var hiddenOk = document.querySelector(".title-program-confirm");

        if (hiddenUp) {
            hiddenUp.addEventListener("click", function () {
                if (isSnappingBack || !currentSnappedElement) return;

                // Filter only visible .program elements
                var all = Array.prototype.slice.call(container.querySelectorAll(".program"));
                var visible = all.filter(function (el) {
                    return el.offsetParent !== null; // this checks if element is visible (not display: none)
                });

                var index = visible.indexOf(currentSnappedElement);
                if (index > 0) {
                    vino.soundPlayVolume(scrollSfx, vol);
                    snapToElement(visible[index - 1], true);
                }
            });
        }

        if (hiddenDown) {
            hiddenDown.addEventListener("click", function () {
                if (isSnappingBack || !currentSnappedElement) return;

                // Filter only visible .program elements
                var all = Array.prototype.slice.call(container.querySelectorAll(".program"));
                var visible = all.filter(function (el) {
                    return el.offsetParent !== null; // this checks if element is visible (not display: none)
                });

                var index = visible.indexOf(currentSnappedElement);
                if (index >= 0 && index < visible.length - 1) {
                    vino.soundPlayVolume(scrollSfx, vol);
                    snapToElement(visible[index + 1], true);
                }
            });
        }


        if (hiddenOk) {
            hiddenOk.addEventListener("click", function () {
                if (isSnappingBack) return;
                if (currentSnappedElement) {
                    onConfirmCallback(currentSnappedElement);
                }
            });
        }
    }

    function setProgramDivAttribute(guide) {
        var result = guide.result;
        var programs = document.querySelectorAll(".program-list .contents > .program");

        // === Reset all program display styles ===
        for (var k = 0; k < programs.length; k++) {
            programs[k].style.display = "";
        }

        // === Apply data to visible programs ===
        for (var i = 0; i < programs.length && i < result.length; i++) {
            var item = result[i];
            var channel = item.channel;
            var programEl = programs[i];

            // === Clear contents ===
            programEl.querySelector(".station").textContent = "";
            programEl.querySelector(".title").textContent = "";

            programEl.querySelector(".info .text").textContent = "";
            programEl.querySelector(".info .tag").textContent = "";

            programEl.querySelector(".genre").classList.remove("general");
            programEl.querySelector(".genre").classList.remove("news");
            programEl.querySelector(".genre").classList.remove("movies");
            programEl.querySelector(".genre").classList.remove("sports");
            programEl.querySelector(".genre").classList.remove("family");
            programEl.querySelector(".genre").querySelector("span").innerHTML = "";

            // Set channel-related attributes
            programEl.setAttribute("data-chfn", channel.fullName);
            programEl.setAttribute("data-chnu", channel.number);
            programEl.setAttribute("data-chna", channel.name);
            programEl.setAttribute("data-chsid", channel.sourceId);
            programEl.setAttribute("data-chid", channel.networkId);
            programEl.setAttribute("data-chnn", channel.networkName);
            programEl.setAttribute("data-chlo", channel.logo);

            var schedules = item.programSchedules;

            for (var j = 0; j < schedules.length; j++) {
                var program = schedules[j];
                var index = j + 1;

                programEl.setAttribute("data-prid-" + index, program.programId);
                programEl.setAttribute("data-prti-" + index, program.title);
                programEl.setAttribute("data-prge-" + index, program.catId);
                programEl.setAttribute("data-aiat-" + index, program.airingAttrib);
                programEl.setAttribute("data-aist-" + index, program.startTime);
                programEl.setAttribute("data-aien-" + index, program.endTime);
            }

            programEl.setAttribute("data-prid-active", "");
            programEl.setAttribute("data-prti-active", "");
            programEl.setAttribute("data-prge-active", "");
            programEl.setAttribute("data-aiat-active", "");
            programEl.setAttribute("data-aist-active", "");
            programEl.setAttribute("data-aien-active", "");
        }

        // === Hide unused program divs ===
        for (var l = result.length; l < programs.length; l++) {
            programs[l].style.display = "none";
        }
    }

    function formatTime(dateObj) {
        var hours = dateObj.getUTCHours();
        var minutes = dateObj.getUTCMinutes();
        var ampm = hours >= 12 ? "pm" : "am";

        hours = hours % 12;
        if (hours === 0) hours = 12;

        return hours + ":" + (minutes < 10 ? "0" : "") + minutes + ampm;
    }

    function formatAMPMWithDate(utcStart, utcEnd) {
        var offsetMillis = tvii.profile.UTCOffset * 1000;

        var localStart = new Date(utcStart * 1000 + offsetMillis);
        var localEnd = new Date(utcEnd * 1000 + offsetMillis);

        var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        var dayName = days[localStart.getUTCDay()];
        var month = localStart.getUTCMonth() + 1;
        var day = localStart.getUTCDate();

        var timeStart = formatTime(localStart);
        var timeEnd = formatTime(localEnd);

        return dayName + ". " + month + "/" + day + ", " + timeStart + " - " + timeEnd;
    }

    function setupClock() {
        var clock = document.querySelector(".bottom .clock");
        if (!clock) return;

        var dateSpan = clock.querySelector(".date");
        var daySpan = clock.querySelector(".day");
        var sepSpan = clock.querySelector(".sep");
        var hourSpan = clock.querySelector(".hour");
        var colonSpan = hourSpan.querySelector("span");

        var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        function pad(n) {
            return n < 10 ? "0" + n : n;
        }

        function updateClock() {
            var nowUTC = new Date();
            var localMillis = nowUTC.getTime() + tvii.profile.UTCOffset * 1000;
            var local = new Date(localMillis);

            var hours = local.getUTCHours();
            var minutes = local.getUTCMinutes();
            var isPM = hours >= 12;
            var hours12 = hours % 12;
            if (hours12 === 0) hours12 = 12;

            // Update date and day
            var month = pad(local.getUTCMonth() + 1);
            var dayNum = pad(local.getUTCDate());
            var dayName = days[local.getUTCDay()];

            dateSpan.textContent = month + "/" + dayNum;
            daySpan.textContent = dayName;
            sepSpan.textContent = isPM ? "PM" : "AM";

            // Update hour with blinking colon
            var minsText = pad(minutes);
            hourSpan.firstChild.nodeValue = pad(hours12); // updates the hour
            hourSpan.lastChild.nodeValue = minsText; // updates the minute

            // Toggle blinking colon
            colonSpan.style.visibility = colonSpan.style.visibility === "hidden" ? "visible" : "hidden";
        }
        updateClock(); // Initial call

        // Align first interval to the next full second
        var now = Date.now();
        var delay = 1000 - (now % 1000);

        window.clockTimeout = setTimeout(function () {
            updateClock();
            window.clockInterval = setInterval(updateClock, 1000);
        }, delay);
    }

    function setupProgramTimer() {
        window.infoUpdInterval = setInterval(function () {
            updateTabListProgram();
        }, 25 * 1000);
    }

    function programPreviewUpdate(program) {
        var programDetails = $(".program-central .program-details");
        program = $(program);
        const channelName = program.attr("data-chfn");
        const programId = program.attr("data-prid-active");

        // Get previously shown data
        const lastChannelName = programDetails.attr("data-chfoc");
        const lastProgramId = programDetails.attr("data-prfoc");

        // If same program and same channel, do nothing
        if (lastProgramId === programId && lastChannelName === channelName) {
            console.log("same chan and prog")
            return;
        }

        const logoSrc = program.attr("data-chlo") + "?width=56";
        const chlogo = programDetails.find(".chlogo");
        const start = parseInt(program.attr("data-aist-active"), 10);
        const end = parseInt(program.attr("data-aien-active"), 10);
        chlogo.off("error").on("error", function () {
            chlogo.css("display", "none");
        });

        // If same program but different channel, update only logo, channel name, and airdate
        if (lastProgramId === programId && lastChannelName !== channelName) {
            console.log("dif chan but same prog")
            //Update active program
            activeProgram.channel = {
                name: program.attr("data-chna"),
                number: program.attr("data-chnu"),
                logo: program.attr("data-chlo"),
                networkName: program.attr("data-chnn"),
                networkId: program.attr("data-chid"),
                sourceId: program.attr("data-chsid"),
                fullName: channelName,
            };
            activeProgram.time = { start: start, end: end };
            chlogo.css("display", "block");
            chlogo.attr("src", logoSrc);

            const chnumElem = programDetails.find(".chnum");
            const chnumText = chnumElem.text();
            console.log(lastChannelName, channelName)
            const updatedChnumText = chnumText.replace(lastChannelName, channelName);
            chnumElem.text(updatedChnumText);

            const timeStr = formatAMPMWithDate(start, end);
            programDetails.find(".date").text(timeStr);

            programDetails.attr("data-chfoc", channelName); // update new channel
            return;
        }

        // Otherwise: fetch new program details
        programDetails.css("display", "none");
        vino.loading_setIconRect(165, 180, 110, 110);
        vino.loading_setIconAppear(true);
        chlogo.css("display", "block");
        chlogo.attr("src", logoSrc);

        tvii.requestProgramDetails(programId, "episode", function (details) {
            var chfn = program.attr("data-chfn") || "";
            if (chfn.length > 25 && details.seasonNumber != null) {
                chfn = chfn.slice(0, 22) + "...";
            } else if (chfn.length > 36 && details.releaseYear && !details.tvRating) {
                chfn = chfn.slice(0, 33) + "...";
            } else if (chfn.length > 30 && details.releaseYear && details.tvRating) {
                chfn = chfn.slice(0, 27) + "...";
            }

            var seasonEpisodeText = "";
            if (details.seasonNumber != null) {
                seasonEpisodeText = " · S" + details.seasonNumber + " E" + details.episodeNumber;
            }

            programDetails.find(".chnum").text(
                chfn +
                (details.tvRating ? " · " + details.tvRating.toString().replace(/\s+/g, '') : "") +
                (details.releaseYear ? " · " + details.releaseYear : "") +
                seasonEpisodeText
            );

            programDetails.find(".pname").text(details.name);

            if (details.episodeTitle && details.episodeTitle !== "") {
                programDetails.find(".channel-detail").removeClass("no-episode");
                programDetails.find(".pepisode").text(details.episodeTitle);
            } else {
                programDetails.find(".channel-detail").addClass("no-episode");
                programDetails.find(".pepisode").text("");
            }

            const timeStr = formatAMPMWithDate(start, end);
            programDetails.find(".date").text(timeStr);

            const desc = details.description || details.episodeTitle || details.name;
            programDetails.find(".program-description > p").text(desc);

            // Update active program info
            activeProgram.info.id = details.id;
            activeProgram.info.airingAttrib = parseInt(program.attr("data-aiat-active"), 10);
            activeProgram.time = { start: start, end: end };
            activeProgram.channel = {
                name: program.attr("data-chna"),
                number: program.attr("data-chnu"),
                logo: program.attr("data-chlo"),
                networkName: program.attr("data-chnn"),
                networkId: program.attr("data-chid"),
                sourceId: program.attr("data-chsid"),
                fullName: channelName,
            };

            programDetails.attr("data-chnumfoc", program.attr("data-chnu"));
            programDetails.attr("data-chfoc", channelName);
            programDetails.attr("data-prfoc", programId);
            vino.loading_setIconAppear(false);
            programDetails.css("display", "");
            details = null;
        }, function () {
            // Optional error handler
        });
    }

    function drawLyt() {
        vino.lyt_drawFixedFrame(430 - 6, 217 - 3, 360 + 7, 77 + 4);
    }

    function updateTabListProgram() {
        var nowTimestamp = tvii.getCurrentTimestamp();

        var STR_MOMENT_AGO = "Started a moment ago";
        var STR_MINUTE_AGO = "Started a minute ago";
        var STR_STARTED = "Started ";
        var STR_MIN_AGO = " minutes ago";
        var STR_HOUR = "h";
        var STR_MIN_AGO2 = " min ago";
        var STR_AGO = " ago";

        var C_GEN = "general";
        var C_NEWS = "news";
        var C_MOVIES = "movies";
        var C_SPORTS = "sports";
        var C_FAMILY = "family";

        var T_GEN = "General";
        var T_NEWS = "News/<br>C.Affairs";
        var T_MOVIES = "Movies";
        var T_SPORTS = "Sports";
        var T_FAMILY = "Family";

        var getCategoryImage = function (catId) {
            return (catId === tvii.tvgAirGenre.NEWS) ? C_NEWS :
                (catId === tvii.tvgAirGenre.MOVIES) ? C_MOVIES :
                    (catId === tvii.tvgAirGenre.SPORTS) ? C_SPORTS :
                        (catId === tvii.tvgAirGenre.FAMILY) ? C_FAMILY :
                            C_GEN;
        };

        var getCategoryText = function (catId) {
            return (catId === tvii.tvgAirGenre.NEWS) ? T_NEWS :
                (catId === tvii.tvgAirGenre.MOVIES) ? T_MOVIES :
                    (catId === tvii.tvgAirGenre.SPORTS) ? T_SPORTS :
                        (catId === tvii.tvgAirGenre.FAMILY) ? T_FAMILY :
                            T_GEN;
        };

        var programDivs = $(".program-list .contents .program");

        programDivs.each(function () {
            var $a = $(this);
            var dom = this;

            var found = false;
            var program = {};
            var index = 1;

            // Loop through indexed programs
            while (true) {
                var start = parseInt($a.attr("data-aist-" + index), 10);
                var end = parseInt($a.attr("data-aien-" + index), 10);
                if (isNaN(start) || isNaN(end)) break;

                if (nowTimestamp >= start && nowTimestamp < end) {
                    program.programId = $a.attr("data-prid-" + index);
                    program.title = $a.attr("data-prti-" + index);
                    program.startTime = start;
                    program.endTime = end;
                    program.airingAttrib = parseInt($a.attr("data-aiat-" + index), 10);
                    program.catId = parseInt($a.attr("data-prge-" + index), 10);
                    program.index = index;
                    found = true;
                    break;
                }
                index++;
            }

            if (!found) return;

            // If already active and start time matches, skip updating
            var activeStart = parseInt($a.attr("data-aist-active"), 10);
            if (!isNaN(activeStart) && activeStart === program.startTime) {
                // Still the same program — only update "Started X minutes ago"
                var elapsedSeconds = nowTimestamp - program.startTime;
                var infoText = "";
                if (elapsedSeconds < 60) {
                    infoText = STR_MOMENT_AGO;
                } else if (elapsedSeconds < 120) {
                    infoText = STR_MINUTE_AGO;
                } else {
                    var totalMinutes = (elapsedSeconds / 60) | 0;
                    var hours = (totalMinutes / 60) | 0;
                    var minutes = totalMinutes % 60;
                    infoText = STR_STARTED + (hours > 0 ? (hours + STR_HOUR + (minutes > 0 ? " " + minutes + STR_MIN_AGO2 : STR_AGO)) : (minutes + STR_MIN_AGO));
                }

                var infoSpan = dom.querySelector("span.info");
                var textSpan = infoSpan ? infoSpan.querySelector(".text") : null;
                if (textSpan) {
                    textSpan.textContent = infoText;
                }

                return; // Skip full update
            }

            // Update active program data-* attributes
            $a.attr("data-prid-active", program.programId);
            $a.attr("data-prti-active", program.title);
            $a.attr("data-aiat-active", program.airingAttrib);
            $a.attr("data-aist-active", program.startTime);
            $a.attr("data-aien-active", program.endTime);
            $a.attr("data-prge-active", program.catId);

            // Compute info text
            var elapsedSeconds = nowTimestamp - program.startTime;
            var infoText = "";
            if (elapsedSeconds < 60) {
                infoText = STR_MOMENT_AGO;
            } else if (elapsedSeconds < 120) {
                infoText = STR_MINUTE_AGO;
            } else {
                var totalMinutes = (elapsedSeconds / 60) | 0;
                var hours = (totalMinutes / 60) | 0;
                var minutes = totalMinutes % 60;
                infoText = STR_STARTED + (hours > 0 ? (hours + STR_HOUR + (minutes > 0 ? " " + minutes + STR_MIN_AGO2 : STR_AGO)) : (minutes + STR_MIN_AGO));
            }

            var airFlags = tvii.getAiringFlags(program.airingAttrib);

            // Update image
            var genre = dom.querySelector(".genre");
            if (genre) {
                genre.classList.remove(C_GEN);
                genre.classList.remove(C_NEWS);
                genre.classList.remove(C_MOVIES);
                genre.classList.remove(C_SPORTS);
                genre.classList.remove(C_FAMILY);
                genre.classList.add(getCategoryImage(program.catId));
                genre.querySelector("span").innerHTML = getCategoryText(program.catId);
            }

            // Update title span if empty
            var titleSpan = dom.querySelector("span.title");
            if (titleSpan) {
                titleSpan.textContent = program.title;
            }

            // Update station span if empty
            var stationSpan = dom.querySelector("span.station");
            if (stationSpan && !stationSpan.textContent.trim()) {
                var chName = $a.attr("data-chna");
                var chNum = $a.attr("data-chnu");
                var chNet = $a.attr("data-chnn");

                chNet = (chNet && chNet !== "null") ? chNet : "";
                chNum = (chNum && chNum !== "null") ? chNum : "";

                var stationText = chName + " (" + (chNet ? chNet + " " : "") + chNum + ")";
                stationSpan.textContent = stationText;
            }

            // Update info span
            var infoSpan = dom.querySelector("span.info");
            var tag = dom.querySelector("span.info > .tag");
            if (infoSpan) {
                // Remove both classes manually
                tag.classList.remove("tagn");
                tag.classList.remove("tagl");

                if (airFlags.isNew) {
                    tag.classList.add("tagn");
                    tag.textContent = "New";
                    tag.style.display = "";
                } else if (airFlags.isLive) {
                    tag.classList.add("tagl");
                    tag.textContent = "Live";
                    tag.style.display = "";
                } else {
                    tag.textContent = "";
                    tag.style.display = "none";
                }

                var textSpan = infoSpan.querySelector(".text");
                if (textSpan) {
                    textSpan.textContent = infoText;
                }
            }
        });
    }

    function setContainerPagination() {
        $(".footer .prev, .footer .next").on("click", function () {
            if (requested) return;

            var isPrev = $(this).hasClass("prev");
            var isNext = $(this).hasClass("next");

            if (isPrev && offset === 0) return;
            if (isNext && offset + limit >= total) return;

            vino.lyt_startTouchEffect();
            vino.soundPlayVolume("SE_PROGRAM_SLIDE_SPEED", 30);
            requested = true;
            $(this).addClass("selected");

            if (isPrev) {
                offset = Math.max(0, offset - limit);
            } else {
                offset = offset + limit;
            }

            requestGuidePage(isPrev, $(this));
        });

        function requestGuidePage(isPrev, $button) {
            vino.lyt_setFixedFrameSemitransparency(true);
            vino.loading_setIconAppear(true);

            tvii.requestProgramGuide(currentTime, lineup, duration, limit, offset, function (guide) {
                setProgramDivAttribute(guide);
                updateTabListProgram();
                window.setListenerToProgram();
                updateFooterState();
                $button.removeClass("selected");
                $(".program-list .content").stop().animate({ scrollTop: 0 }, 300, function () {
                    window.snapToClosestProgram(true);
                });
                vino.lyt_setFixedFrameSemitransparency(false);
                vino.loading_setIconAppear(false);
                guide = null;
                requested = false;
            }, function () {
                vino.loading_setIconAppear(false);
                $button.removeClass("selected");
                requested = false;
            });
        }

        function updateFooterState() {
            var $prev = $(".footer .prev");
            var $next = $(".footer .next");
            var $counter = $(".footer > span");

            // Total pages based on total/limit (rounded up)
            var totalPages = Math.ceil(total / limit);
            var currentPage = Math.floor(offset / limit) + 1;

            // Update counter
            $counter.html(currentPage + "<span>/" + totalPages + "</span>");

            // Enable/disable prev
            if (offset === 0) {
                $prev.addClass("disabled");
            } else {
                $prev.removeClass("disabled");
            }

            // Enable/disable next
            if (offset + limit >= total) {
                $next.addClass("disabled");
            } else {
                $next.removeClass("disabled");
            }
        }

        // Initialize footer state on first load
        updateFooterState();
    }

    function programConfirmSel() {
        var programDetails = $(".program-central .program-details");
        if (!programDetails.is(":visible")) {
            return;
        }
        vino.lyt_decideFixedFrame();
        vino.soundPlayVolume("SE_APPEAR_DETAIL", 30);
        setupProgramPageWithAnim();
    }

    function animateTransformY(element, from, to, duration, callback) {
        var start = Date.now();
        var distance = to - from;

        function step() {
            var now = Date.now();
            var elapsed = now - start;
            var progress = Math.min(elapsed / duration, 1); // Clamp to 1

            // Easing function (linear)
            var value = from + (distance * progress);

            // Apply the transform
            element.style.webkitTransform = 'translateY(' + value + 'px)';
            element.style.transform = 'translateY(' + value + 'px)';

            if (progress < 1) {
                setTimeout(step, frameRate);
            } else if (typeof callback === 'function') {
                callback();
            }
        }

        step();
    }

    function setupProgramPageWithAnim() {
        cleanProgramPage();
        scrollPosition = $(".program-list .content").scrollTop();

        $(cent).css("opacity", 1).animate({ opacity: 0 }, 70, function () {
            cent.style.display = "none";
        });

        animateTransformY(head, 0, -70, 95, function () {
            head.style.display = "none";
        });
        animateTransformY(bott, 0, 50, 95, function () {
            bott.style.display = "none";
        });

        setTimeout(function () {
            head2.style.display = "";
            bott.style.display = "";
            det.style.display = "";
            $(".program-fulldetails-page .content").stop(true, true).scrollLeft(0);
            $(".prev-page").stop(true, true).fadeOut(0);
            $(".next-page").stop(true, true).fadeIn(0);
            bott.classList.add("prfuldet");
            animateTransformY(head2, -70, 0, 95);
            animateTransformY(bott, 50, 0, 95);
            $(det).css("opacity", 0).animate({ opacity: 1 }, 70);
            setupProgramPage();
        }, 500);
    }

    function cleanProgramPage() {
        $(".prev-page").off("click");
        $(".next-page").off("click");
        var prodet = document.querySelector(".program-fulldetails-page .program-details");
        //Clear info
        prodet.querySelector(".prinfo .info").innerText = "";
        head2.querySelector("span").innerText = "";
        prodet.querySelector(".date").innerText = "";
        prodet.querySelector(".chname").innerText = "";
        prodet.querySelector(".chnumber").innerText = "";
        prodet.querySelector(".chlogo").setAttribute("src", "/img/noimg.png");
        prodet.querySelector(".prinfo > .tag").innerText = "";
        prodet.querySelector(".prinfo > .tag").style.display = "none";
        prodet.querySelector(".scoreinfo>.text").innerText = "";
        prodet.querySelector(".scoreinfo>.metascore").style.display = "none";
        prodet.querySelector(".scoreinfo>.metascore").innerText = "";

        prodet.querySelector(".program-description>span").innerText = "";
        prodet.querySelector(".program-description>p").innerText = "";
        document.querySelector(".program-fulldetails-page .program-image>img").setAttribute("src", "/img/noimg.png")
    }

    var isMovingPrgmPage = false;

    function setupProgramPage() {
        if (!activeProgram) return;
        tvii.pushStateWithQuery("scene", "programpreview", true, { program: activeProgram });
        //Now start
        cleanProgramPage();
        vino.loading_setIconRect(360, 160, 120, 120);
        vino.loading_setIconAppear(true);

        $(".prev-page").stop(true, true).fadeOut(0);
        $(".next-page").stop(true, true).fadeIn(0);
        console.log(activeProgram)

        $(".program-fulldetails-page .content").stop(true, true).scrollLeft(0);

        $(".prev-page").on("click", function () {
            if (isMovingPrgmPage) return;
            isMovingPrgmPage = true;
            $(".prev-page").fadeOut(200);
            vino.soundPlayVolume("SE_MOVEPAGE_PLAY", 30)
            $(".program-fulldetails-page .content").animate({
                scrollLeft: 0
            }, 500, function () {
                $(".next-page").fadeIn(200);
                isMovingPrgmPage = false;
            });
        })

        $(".next-page").on("click", function () {
            if (isMovingPrgmPage) return;
            isMovingPrgmPage = true;
            $(".next-page").fadeOut(200);
            vino.soundPlayVolume("SE_MOVEPAGE_PLAY", 30)
            $(".program-fulldetails-page .content").animate({
                scrollLeft: 854
            }, 500, function () {
                $(".prev-page").fadeIn(200);
                isMovingPrgmPage = false;
            });
        })

        tvii.requestProgramDetails(activeProgram.info.id, "episode", function (details) {
            var prodet = document.querySelector(".program-fulldetails-page .program-details");
            console.log(details)

            var airFlags = tvii.getAiringFlags(activeProgram.info.airingAttrib);
            var timeStr = formatAMPMWithDate(activeProgram.time.start, activeProgram.time.end);

            var chlogo = prodet.querySelector(".chlogo");
            chlogo.onerror = function () {
                chlogo.style.display = "none";
            };

            chlogo.style.display = "";
            chlogo.src = activeProgram.channel.logo + "?width=56";

            var seasonEpisodeText = "";
            if (details.seasonNumber != null && details.episodeNumber != null) {
                seasonEpisodeText = " · S" + details.seasonNumber + " E" + details.episodeNumber;
            }

            var rating = details.tvRating ? details.tvRating.toString().replace(/\s+/g, '') : "";
            var year = details.releaseYear ? (rating ? " · " : "") + details.releaseYear : "";

            prodet.querySelector(".prinfo .info").innerText = rating + year + seasonEpisodeText;

            head2.querySelector("span").innerText = details.name;
            prodet.querySelector(".date").innerText = timeStr;
            prodet.querySelector(".chname").innerText = activeProgram.channel.fullName;
            prodet.querySelector(".chnumber").innerText = "Ch " + activeProgram.channel.number;

            var tag = prodet.querySelector(".prinfo > .tag");
            if (tag) {
                // Remove both classes manually
                tag.classList.remove("tagn");
                tag.classList.remove("tagl");

                if (airFlags.isNew) {
                    tag.classList.add("tagn");
                    tag.textContent = "New";
                    tag.style.display = "";
                } else if (airFlags.isLive) {
                    tag.classList.add("tagl");
                    tag.textContent = "Live";
                    tag.style.display = "";
                } else {
                    tag.textContent = "";
                    tag.style.display = "none";
                }
            }

            if (details.metacriticSummary) {
                prodet.querySelector(".scoreinfo>.text").innerText = "Metascore: ";
                var scoreEl = prodet.querySelector(".scoreinfo>.metascore");
                var scoreN = details.metacriticSummary.score;
                scoreEl.style.display = "";
                scoreEl.innerText = details.metacriticSummary.score;
                scoreEl.classList.remove("green");
                scoreEl.classList.remove("yellow");
                scoreEl.classList.remove("red");
                if (scoreN >= 61) {
                    scoreEl.classList.add("green");
                } else if (scoreN >= 40) {
                    scoreEl.classList.add("yellow");
                } else {
                    scoreEl.classList.add("red");
                }
            }

            prodet.querySelector(".program-description>span").innerText = details.episodeTitle || "";
            prodet.querySelector(".program-description>p").innerText = details.description || details.episodeTitle || details.name;

            if (details.images && details.images.length !== 0) {
                var bucketPath = null;

                if (details.type === "movie") {
                    // Try to find image with imageType.typeId === 2
                    for (var i = 0; i < details.images.length; i++) {
                        var img = details.images[i];
                        if (img.imageType && img.imageType.typeId === 2) {
                            bucketPath = img.bucketPath;
                            break;
                        }
                    }
                }

                // If not a movie or no matching typeId found, fallback to first image
                if (!bucketPath) {
                    bucketPath = details.images[0].bucketPath;
                }

                document.querySelector(".program-fulldetails-page .program-image>img")
                    .setAttribute("src", tvii.clientUrl + "/images/catalog" + bucketPath + "?height=255");
            }
            vino.loading_setIconAppear(false);
        }, function () {

        })
    }

    function closeProgramPageWithAnim() {
        vino.loading_setIconRect(165, 180, 110, 110);
        animateTransformY(head2, 0, -70, 95, function () {
            head2.style.display = "none";
        });
        animateTransformY(bott, 0, 50, 95, function () {
            bott.style.display = "none";
        });
        $(det).css("opacity", 1).animate({ opacity: 0 }, 70, function () {
            det.style.display = "none";
        });

        setTimeout(function () {
            cent.style.display = "";
            $(".program-list .content").scrollTop(scrollPosition);
            head.style.display = "";
            bott.style.display = "";
            bott.classList.remove("prfuldet");

            $(cent).css("opacity", 0).animate({ opacity: 1 }, 70);
            animateTransformY(head, -70, -0, 95, function () {
                void head.offsetHeight;
            });
            animateTransformY(bott, 50, 0, 95, function () {
                void bott.offsetHeight;
            });

            drawLyt();
        }, 500);
    }

    function initLiveTab() {
        vino.loading_setIconAppear(true);

        tvii.requestProgramGuide(currentTime, lineup, duration, limit, offset, function (guide) {
            setProgramDivAttribute(guide);
            total = guide.total;
            updateTabListProgram();
            setUpTitleScrollbar(programPreviewUpdate, programConfirmSel);
            window.setListenerToProgram();
            setupProgramTimer();
            setContainerPagination();
            vino.loading_setIconAppear(false);
            window.snapToClosestProgram(true);
            setTimeout(function () {
                drawLyt();
            }, 0)
        }, function () {
            vino.loading_setIconAppear(false);
        })
    }

    //Init live tab action
    initLiveTab();

};

window.addEventListener("load", function () {
    tvii.initialize();
});