/* eslint-disable */
var tvii = {
    clientUrl: location.origin,
    BGMId: null,
    userSlot: vino.act_getCurrentSlotNo(),
    currentXHR: null,
    currentPostXhr: null,
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
        NEWS: 4,
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
        STARRATING5: 131072,
    },
    templates: {
        templateList: [
            {
                template_query: "prg_central",
                template_file: "prg_central.html",
            },
            {
                template_query: "prg_fulldetails",
                template_file: "prg_fulldetails.html",
            },
            {
                template_query: "miiverse_post_modal",
                template_file: "miiverse_post_modal.html",
            },
        ],
        requestAll: function () {
            var templateLoadCount = 0;

            for (var i = 0; i < tvii.templates.templateList.length; i++) {
                (function (temToLoad) {
                    var xhr = new XMLHttpRequest();
                    xhr.open(
                        "GET",
                        tvii.clientUrl + "/pages/" + temToLoad.template_file
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
                                    tvii.templates.templateList.length
                                ) {
                                    $(document).trigger("vino:templateload");
                                }
                            }
                        }
                    };
                    xhr.send();
                })(tvii.templates.templateList[i]);
            }
        },
        get: function (templateName) {
            var getHTML = JSON.parse(
                sessionStorage.getItem("template_" + templateName)
            ).template_html;
            return getHTML.trim();
        },
        requestJSONLoc: function () {
            var locFile =
                tvii.getLang().split("-")[0] + "_" + tvii.getRegion() + ".json";

            var sendRequest = function (locFile) {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", tvii.clientUrl + "/loc/" + locFile);
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4) {
                        if (xhr.status == 200) {
                            tvii.locFile = JSON.parse(xhr.responseText);
                            $(document).trigger("vino:jsonlocload");
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

            if (arrayReplace && typeof arrayReplace === "object") {
                for (var key in arrayReplace) {
                    if (
                        Object.prototype.hasOwnProperty.call(arrayReplace, key)
                    ) {
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
                    var $el = $(el);
                    var els = tvii.templates.getLoc($el.attr("data-loc"));
                    $el.html(els);
                    $el.removeAttr("data-loc");
                });

            $("body")
                .find("[data-loc-attr]")
                .each(function (index, el) {
                    var a = JSON.parse($(el).attr("data-loc-attr"));

                    for (var key in a) {
                        var value = a[key];
                        $(el).attr(key, tvii.templates.getLoc(value));
                    }
                });
        },
    },
    posts: {
        getMiiverseParPackProp: function (key) {
            var param = vino.olv_getParameterPack();
            var decodedParam = Base64.decode(param);
            decodedParam = decodedParam.substring(1, decodedParam.length - 1);
            var parts = decodedParam.split("\\").map(function (item) {
                return item.trim();
            });

            var keyValuePairs = [];
            for (var i = 0; i < parts.length; i += 2) {
                keyValuePairs.push({ key: parts[i], value: parts[i + 1] });
            }

            for (var i = 0; i < keyValuePairs.length; i++) {
                if (keyValuePairs[i].key === key) {
                    return keyValuePairs[i].value;
                }
            }
            return null;
        },
        appendMiiverseHeadersToXhr: function () {
            if (!vino.olv_isEnabled()) return;
            tvii.currentPostXhr.setRequestHeader(
                "X-Nintendo-Olv-Api-Url",
                vino.olv_getHostName()
            );
            tvii.currentPostXhr.setRequestHeader(
                "X-Nintendo-ServiceToken",
                vino.olv_getServiceToken()
            );
            tvii.currentPostXhr.setRequestHeader(
                "X-Nintendo-ParamPack",
                vino.olv_getParameterPack()
            );
            tvii.currentPostXhr.setRequestHeader(
                "X-Nintendo-Olv-User-Agent",
                vino.olv_getUserAgent()
            );
        },
        abortApiRequest: function () {
            if (tvii.currentPostXhr != null) {
                tvii.currentPostXhr.abort();
                console.warn("post xhr aborted");
                tvii.currentPostXhr = null;
            }
        },
        //Replacement to tvii.olv
        requestPosts: function (
            limit,
            searchKeys,
            callbackSuccess,
            callbackError
        ) {
            tvii.posts.abortApiRequest();

            tvii.currentPostXhr = new XMLHttpRequest();

            // Build query string manually
            var query = "limit=" + encodeURIComponent(limit);
            for (var i = 0; i < searchKeys.length; i++) {
                query += "&search_key=" + encodeURIComponent(searchKeys[i]);
            }

            var url = tvii.clientUrl + "/api/v1/socials/postsAlt?" + query;
            tvii.currentPostXhr.open("GET", url, true);

            tvii.currentPostXhr.onload = function () {
                if (tvii.currentPostXhr.status === 200) {
                    callbackSuccess(
                        JSON.parse(tvii.currentPostXhr.responseText)
                    );
                    tvii.currentPostXhr = null;
                } else {
                    if (callbackError) callbackError(tvii.currentPostXhr);
                    tvii.currentPostXhr = null;
                }
            };

            tvii.currentPostXhr.send();
        },
        sendPostToApi: function (
            type,
            content,
            topicTag,
            appData,
            feeling,
            isAutopost,
            isSpoiler,
            searchKey1,
            searchKey2,
            searchKey3,
            searchKey4,
            searchKey5,
            onPostSendFinish
        ) {
            tvii.posts.abortApiRequest();

            tvii.currentPostXhr = new XMLHttpRequest();
            var postForm = new FormData();

            if (searchKey1 && searchKey1.length) {
                postForm.append("search_key", searchKey1);
            }
            if (searchKey2 && searchKey2.length) {
                postForm.append("search_key", searchKey2);
            }
            if (searchKey3 && searchKey3.length) {
                postForm.append("search_key", searchKey3);
            }
            if (searchKey4 && searchKey4.length) {
                postForm.append("search_key", searchKey4);
            }
            if (searchKey5 && searchKey5.length) {
                postForm.append("search_key", searchKey5);
            }

            if (topicTag && topicTag.length) {
                postForm.append("topic_tag", topicTag);
            }

            postForm.append(type === "text" ? "body" : "painting", content);

            postForm.append("is_spoiler", isSpoiler ? "1" : "0");

            postForm.append("feeling_id", feeling ? String(feeling) : "0");

            //For miiverse crosspost
            postForm.append(
                "olv_language_id",
                tvii.posts.getMiiverseParPackProp("language_id")
                    ? tvii.posts.getMiiverseParPackProp("language_id")
                    : "1"
            );

            var url = tvii.clientUrl + "/api/v1/socials/postsAlt";
            tvii.currentPostXhr.open("POST", url, true);
            //For miiverse crosspost
            tvii.posts.appendMiiverseHeadersToXhr();

            tvii.currentPostXhr.onload = function () {
                onPostSendFinish(
                    tvii.currentPostXhr.status === 200,
                    tvii.currentPostXhr.responseText
                );
                tvii.currentPostXhr = null;
            };

            tvii.currentPostXhr.send(postForm);
        },
        addEmpathyToPost: function (remove, id, onEmpathyFinish) {
            tvii.posts.abortApiRequest();

            tvii.currentPostXhr = new XMLHttpRequest();
            var url =
                tvii.clientUrl +
                "/api/v1/socials/postsAlt/" +
                id +
                "/empathies";
            var method = remove ? "DELETE" : "POST";
            tvii.currentPostXhr.open(method, url, true);

            tvii.currentPostXhr.onload = function () {
                onEmpathyFinish(
                    tvii.currentPostXhr.status === 200,
                    tvii.currentPostXhr.responseText
                );
                tvii.currentPostXhr = null;
            };

            tvii.currentPostXhr.send();
        },
    },
    getLoc: function () {
        return tvii.templates.getLoc.apply(this.templates, arguments);
    },
    setClassHoverToEls: function (els) {
        els.each(function () {
            if (!$.data(this, "hoverLSTNR")) {
                var $el = $(this);
                var isHoverActive = false;

                // Activate hover only on mousedown
                $el.on("mousedown", function () {
                    vino.soundPlayVolume("SE_COMMON_TOUCH_ON", 30);
                    if (!isHoverActive) {
                        $(this).addClass("hover");
                        isHoverActive = true;
                    }
                });

                // Remove hover & play cancel sound on full leave
                $el.on("mouseleave", function () {
                    if (isHoverActive) {
                        $(this).removeClass("hover");
                        vino.soundPlayVolume("SE_COMMON_TOUCH_CANCEL", 30);
                        isHoverActive = false;
                    }
                });

                // Remove hover without playing cancel sound on mouseup
                $el.on("mouseup", function () {
                    if (isHoverActive) {
                        $(this).removeClass("hover");
                        isHoverActive = false;
                    }
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
            $el.off(".actualClick");

            $el.on("mousedown.actualClick", function (e) {
                $el.data("isDragging", false);
                $el.data("startX", e.pageX);
                $el.data("startY", e.pageY);
            });

            $el.on("mousemove.actualClick", function (e) {
                var startX = $el.data("startX") || 0;
                var startY = $el.data("startY") || 0;

                if (
                    Math.abs(e.pageX - startX) > dragThreshold ||
                    Math.abs(e.pageY - startY) > dragThreshold
                ) {
                    $el.data("isDragging", true);
                }
            });

            $el.on("click.actualClick", function (e) {
                if ($el.data("isDragging")) {
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
    getRegion: function () {
        var region;
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
            case "SK":
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
        return region;
    },
    getQuery: function (param, isSearch) {
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
    },
    pushStateWithQuery: function (queryName, queryValue, isPush, pushData) {
        var queryString = location.search;
        var currentQuery = tvii.getQuery(queryName, true);

        if (currentQuery == null) {
            queryString += queryString
                ? "&" +
                encodeURIComponent(queryName) +
                "=" +
                encodeURIComponent(queryValue)
                : "?" +
                encodeURIComponent(queryName) +
                "=" +
                encodeURIComponent(queryValue);
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

        const stateData = pushData || { __internal__: true };

        if (isPush) {
            window.history.pushState(
                stateData,
                "",
                tvii.clientUrl + queryString
            );
        } else {
            window.history.replaceState(
                stateData,
                "",
                tvii.clientUrl + queryString
            );
        }
    },
    clearWrapper: function () {
        $(".wrapper").html("");
    },
    replaceWrapper: function (html) {
        $(".wrapper").html(html);
    },
    getWrapper: function () {
        return $(".wrapper").html();
    },
    confirm: function (string, button1, button2) {
        return !vino.runTwoButtonDialog(
            string,
            button1 ? button1 : null,
            button2 ? button2 : null
        );
    },
    alert: function (dialog, button) {
        return vino.runSingleButtonDialog(dialog, button ? button : null);
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

        window.addEventListener(
            "focus",
            function (e) {
                var el = e.target;
                if (!el || !vino.navi_getRect()) return;

                // Bounding rects
                var parent = $(".l-stick-scroll:visible").first().get(0);
                if (!parent) return;
                var parentRect = parent.getBoundingClientRect();
                if (!parentRect) return;
                var elRect = el.getBoundingClientRect();
                if (!elRect) return;

                var rectStr = vino.navi_getRect();

                var parts = rectStr.split(",").map(function (n) {
                    return parseInt(n, 10);
                });

                var naviRect = {
                    left: parts[0],
                    top: parts[1],
                    width: parts[2],
                    height: parts[3]
                };

                // compare
                if (
                    elRect.left === naviRect.left &&
                    elRect.top === naviRect.top &&
                    elRect.width === naviRect.width &&
                    elRect.height === naviRect.height
                ) {
                    // Adjust vertical scroll
                    if (elRect.top < parentRect.top) {
                        parent.scrollTop -= parentRect.top - elRect.top;
                    } else if (elRect.bottom > parentRect.bottom) {
                        parent.scrollTop += elRect.bottom - parentRect.bottom;
                    }

                    // Adjust horizontal scroll
                    if (elRect.left < parentRect.left) {
                        parent.scrollLeft -= parentRect.left - elRect.left;
                    } else if (elRect.right > parentRect.right) {
                        parent.scrollLeft += elRect.right - parentRect.right;
                    }
                }

            },
            true
        );

        var inputCheck = setInterval(function () {
            wiiu.gamepad.update();
            var c = $(".l-stick-scroll:visible").first();
            var maxSpeed = 40; // Increased for faster max scrolling

            var dx = wiiu.gamepad.lStickX;
            var dy = wiiu.gamepad.lStickY;

            if ((dx !== 0 && dy !== 0) || wiiu.gamepad.tpTouch === 1) {
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
                case 36:
                    //HBM
                    break;
                default:
                    break;
            }

            var chr = String.fromCharCode(kc).toLowerCase();
            var safeChr = escapeForClassSelector(chr);
            if (!safeChr) return;
            var els = $(
                ".accesskey-" + safeChr + ":visible, .hidden-" + safeChr
            );

            if (els.length) {
                var highestZ = -Infinity;
                var highestEl = null;

                els.each(function () {
                    var z = parseInt($(this).css("z-index"), 10);
                    if (isNaN(z)) z = 0; // treat "auto" as 0
                    if (z > highestZ) {
                        highestZ = z;
                        highestEl = $(this);
                    }
                });

                if (highestEl) {
                    if (highestEl.is("input, textarea, select")) {
                        highestEl.focus();
                        vino.wakeKeyboard();
                    } else {
                        highestEl.trigger("click");
                    }
                }
            }
        };
    },
    sendXHR: function (
        type,
        url,
        callbackSuccess,
        callbackError,
        headers,
        formData,
        dontLoadIcon
    ) {
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
                    callbackSuccess(
                        tvii.currentXHR.responseText || "",
                        tvii.currentXHR
                    );
                } else {
                    callbackError(tvii.currentXHR);
                }
                tvii.currentXHR = null;
            }
        };

        if (type === "POST" && formData) {
            tvii.currentXHR.send(formData);
        } else {
            tvii.currentXHR.send();
        }
    },
    requestProgramGuide: function (
        timestamp,
        lineup,
        duration,
        limit,
        offset,
        callbackSuccess,
        callbackFailure
    ) {
        duration = duration === 120 ? 120 : 180;
        var xhr = new XMLHttpRequest();
        xhr.open(
            "GET",
            tvii.clientUrl +
            "/api/v1/providers/lineup/" +
            lineup +
            "?start=" +
            String(timestamp) +
            "&duration=" +
            String(duration) +
            "&limit=" +
            String(limit) +
            "&offset=" +
            String(offset)
        );
        xhr.onload = function () {
            if (xhr.status === 200) {
                var data;
                try {
                    data = JSON.parse(xhr.responseText);
                } catch (e) {
                    data = xhr.responseText;
                }
                callbackSuccess(data);
            } else {
                callbackFailure(xhr);
            }
        };
        xhr.send();
    },
    getAiringFlags: function (airingAttribute) {
        return {
            isLive:
                (airingAttribute & tvii.tvgAirFlags.LIVE) ===
                tvii.tvgAirFlags.LIVE,
            isNew:
                (airingAttribute & tvii.tvgAirFlags.NEW) ===
                tvii.tvgAirFlags.NEW,
            isAdult:
                (airingAttribute & tvii.tvgAirFlags.ADULT) ===
                tvii.tvgAirFlags.ADULT,
        };
    },
    requestProgramDetails: function (
        id,
        type,
        callbackSuccess,
        callbackFailure
    ) {
        type = type === "episode" ? "episode" : "program";
        tvii.sendXHR(
            "GET",
            tvii.clientUrl +
            "/api/v1/providers/program/" +
            id +
            "/details" +
            "?type=" +
            type,
            function (responseText) {
                var details = JSON.parse(responseText).result.item;
                callbackSuccess(details);
            },
            callbackFailure,
            null,
            null,
            true
        );
    },
    abortOngoingXHR: function (dontLoadIcon) {
        if (tvii.currentXHR != null) {
            if (!dontLoadIcon) {
                vino.loading_setIconAppear(false);
            }
            tvii.currentXHR.abort();
            console.warn("xhr aborted");
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
                                self.scrCont.scrollLeft() + self.scrollVelocityX
                            );
                            self.scrollVelocityX *= self.friction;
                        }
                        if (continueY) {
                            self.scrCont.scrollTop(
                                self.scrCont.scrollTop() + self.scrollVelocityY
                            );
                            self.scrollVelocityY *= self.friction;
                        }

                        // Trigger scrolling event on the container element
                        self.scrCont.trigger("scrolling", {
                            scrollX: self.scrCont.scrollLeft(),
                            scrollY: self.scrCont.scrollTop(),
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

        this.scrCont.on("mousemove", function (e) {
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
                        self.scrollVelocityX =
                            self.scrCont.scrollLeft() - self.lastScrollPosX; // Update velocity based on scroll change
                        self.lastScrollPosX = self.scrCont.scrollLeft(); // Update last scroll position
                        self.scrollVelocityY = 0; // Prevent any vertical velocity
                    } else {
                        // Vertical scroll
                        walkY = (currentPosY - self.startPosY) * 2; // Scroll speed
                        self.scrCont.scrollTop(self.scrollStartY - walkY);
                        self.scrollVelocityY =
                            self.scrCont.scrollTop() - self.lastScrollPosY; // Update velocity based on scroll change
                        self.lastScrollPosY = self.scrCont.scrollTop(); // Update last scroll position
                        self.scrollVelocityX = 0; // Prevent any horizontal velocity
                    }
                } else {
                    // Normal behavior (not forced to one direction)
                    walkX = (currentPosX - self.startPosX) * 2; // Scroll speed
                    walkY = (currentPosY - self.startPosY) * 2;

                    if (self.isHorizontal === true || self.isHorizontal === 3) {
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
                    scrollX: self.scrCont.scrollLeft(),
                    scrollY: self.scrCont.scrollTop(),
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
        var utc = now.getTime() + now.getTimezoneOffset() * 60000; // always gives real UTC
        return new Date(utc + tvii.profile.UTCOffset * 1000); // offset from UTC
    },
    setUpPageTip: function () {
        var span = document.querySelector(
            ".program-list .content .tips span:nth-of-type(2)"
        );
        if (!span) return;

        var tipIndex = Math.floor(Math.random() * 12) + 1; // 1 to 12
        var key = "vino.home.tips.tip" + tipIndex;
        var tipText = tvii.getLoc(key);

        span.innerHTML = tipText;
    },
    initialize: function () {
        //We want alt title screen since the US BG doesnt make sense (US REGION USERS)
        if (
            !vino.title_hasImage("vino_white_title") &&
            tvii.getRegion() === "US"
        ) {
            vino.title_clearImage();
            vino.title_setFixedImage(
                "https://i.imgur.com/kztCrOk.png",
                "vino_white_title",
                "",
                "",
                "",
                2
            );
        }
        //Avoids black memo issue
        vino.memo_reset();

        if (vino.ir_isEnabled()) {
            //User has set-top box?
            if (vino.ir_existsOtherCodeset()) {
                vino.ir_enableCodeset(2);
            }
            //User has TV remote only set up
            else if (vino.ir_existsTvCodeset()) {
                vino.ir_enableCodeset(1);
            }
        }

        vino.loading_setIconRect(360, 160, 120, 120);
        vino.video_enableOnTV(true);
        vino.navi_setBaseVisibilityOnKeyEvent(true);

        const statuses = {
            SERVER_UNAVAILABLE: 1,
            ACCOUNT_EXISTS: 2,
            ACCOUNT_DOESNT_EXIST_YET: 3,
        };

        $(document).on("vino:jsonlocload", function () {
            tvii.templates.requestAll();
        });

        $(document).on("vino:templateload", function () {
            $(document).off("vino:jsonlocload");
            $(document).off("vino:templateload");
            tvii.setButtonActions();
            initLoginCheck();

            function initLoginCheck() {
                var xhr = new XMLHttpRequest();
                xhr.open("POST", tvii.clientUrl + "/api/v1/act/checkLogIn");
                xhr.onload = function () {
                    if (!xhr || !xhr.responseText || !xhr.status) {
                        tvii.alert(
                            tvii.getLoc(
                                "vino.error.account_creation_unavailable"
                            )
                        );
                        vino.exitForce();
                    }

                    try {
                        var res = JSON.parse(xhr.responseText);
                        if (res.status === "verified") {
                            tvii.profile.UTCOffset = res.profile.utc_offset;
                            tvii.profile.tv_provider_id =
                                res.profile.tv_provider_id;
                            tvii.profile.user_id = res.profile.user_id;
                            initVinoHome();
                        } else {
                            initVinoSetup();
                        }
                    } catch (e) {
                        tvii.alert(
                            tvii.getLoc(
                                "vino.error.account_creation_unavailable"
                            )
                        );
                        vino.exitForce();
                    }
                };
                xhr.send();
            }
        });

        tvii.templates.requestJSONLoc();
    },
};

function initVinoSetup() {
    tvii.pushStateWithQuery("page", "setup", false);
    tvii.templates.setUpLocHTML();
    tvii.BGMId = vino.soundPlayVolume("SE_APP_START_SUB", 30);

    var savedCode;
    var savedRegionCA;
    var savedCityCA;
    var XInterval;
    var XAfterLogInReturnTimeout;
    var BAfterLogInReturnTimeout;
    var setupCont = new tvii.makeScrollContainer(
        $(".setup-modal-container"),
        false
    );

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
        if (!vino.navi_getRect()) {
            vino.lyt_startTouchEffect();
        }
    });

    $("a.btn-1:not(.black)").on("click", function () {
        if ($(this).hasClass("disabled")) return;
        vino.soundPlayVolume("SE_CLOSE", 30);
    });

    $("a.btn-2, .social-buttons a").on("click", function () {
        if ($(this).hasClass("disabled")) return;
        vino.soundPlayVolume("SE_DECIDE", 30);
    });

    var miiData = encodeURIComponent(vino.act_getMiiData(tvii.userSlot));

    var baseUrl =
        tvii.clientUrl +
        "/api/v1/miis?texResolution=128&width=128&data=" +
        miiData;
    var smileUrl =
        tvii.clientUrl +
        "/api/v1/miis?texResolution=128&width=128&expression=smile&data=" +
        miiData;

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
    });

    function disposeXCode() {
        var code = xModal.find(".code").text();
        if (!code || !code.length) {
            console.log("No code to dispose (X)");
            return;
        }

        var form = new FormData();
        form.append("code", code);

        //Sometimes request will continue even after closing Vino and returning to the OS
        //Its weird why it happens sometimes, eShop has similar behavior but works always?
        //Check how eShop handles it
        var request = new XMLHttpRequest();
        request.open("POST", tvii.clientUrl + "/api/v1/socials/XCodeDispose");
        request.send(form);
    }

    xModal.find(".btn-2").on("click", logOutX);
    bModal.find(".submit-login").on("click", logInBsky);
    bModal.find(".submit-logout").on("click", logOutBsky);
    $(".btn-2.account-creation").on("click", createAccount);

    function changeSetupModal(show, hide) {
        if (hide) {
            hide.addClass("none");
        }
        show.removeClass("none");
        setupCont.scrCont.scrollTop(0);

        if (show.attr("id") === "x-login") {
            XOauthLogic();
        } else if (show.attr("id") === "bsky-login") {
            console.log();
        } else if (show.attr("id") === "setup-modal-5") {
            clearTimeout(XAfterLogInReturnTimeout);
            clearTimeout(BAfterLogInReturnTimeout);
            clearXCodeInterval();
        }
    }

    var accountCreating = false;

    function createAccount() {
        if (accountCreating) return;
        accountCreating = true;
        //Not supposed to be able to trigger this func without having selected a provider.
        var providerSelA = $(".tvproviders").find(
            ".selected[data-provider-id]"
        );
        var tvProviderId = providerSelA.attr("data-provider-id");

        var form = new FormData();
        form.append("pid", vino.act_getPid(tvii.userSlot));
        form.append("country", vino.info_getCountry());
        form.append("xOauthToken", xModal.attr("data-x-oauth-token"));
        form.append("xOauthSecret", xModal.attr("data-x-oauth-secret"));
        form.append("xUserId", xModal.attr("data-x-user-id"));
        form.append("bskyUsernameTemp", bModal.attr("data-bsky-username"));
        form.append("bskyPasswordTemp", bModal.attr("data-bsky-password"));
        form.append("tv_provider_id", tvProviderId);

        tvii.sendXHR(
            "POST",
            tvii.clientUrl + "/api/v1/act/createAccount",
            function (responseText) {
                miiImg.attr("src", preload2.src);
                vino.soundStop(tvii.BGMId);
                tvii.BGMId = null;
                accountCreating = false;

                window.location.replace("?page=home");
            },
            function (request) {
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
                        tvii.alert(
                            tvii.getLoc("vino.error.account_not_pretendo")
                        );
                    } else {
                        tvii.alert(
                            tvii.getLoc(
                                "vino.error.account_creation_unavailable"
                            )
                        );
                    }
                }

                accountCreating = false;
            },
            null,
            form
        );
    }

    function logInBsky() {
        //Actually only checks if the account is valid.
        //Session tokens are created when submitting the account creation.
        var username = bModal.find(".username").val();
        var password = bModal.find(".password").val();

        if (username.length < 1 || password.length < 1) {
            tvii.alert(tvii.getLoc("vino.setup.bsky-login.p9"));
            return;
        }

        var request = new XMLHttpRequest();

        var form = new FormData();
        form.append("username", username);
        form.append("password", password);

        request.open("POST", tvii.clientUrl + "/api/v1/socials/BSLoginCheck");
        request.onload = function () {
            if (request.status === 200) {
                var res = JSON.parse(request.responseText);
                if (!res.active) {
                    tvii.alert(tvii.getLoc("vino.setup.bsky-login.p8"));
                    return;
                }
                bModal.attr("data-bsky-logged-in", "true");
                bModal.attr("data-bsky-username", username);
                bModal.attr("data-bsky-password", password);

                bModal.find("input").addClass("none");
                bModal.find(".submit-login").addClass("none");
                bModal.find(".submit-logout").removeClass("none");
                bModal.find("p:not(.logged-in)").addClass("none");
                bModal.find(".logged-in").removeClass("none");
                bModal.find(".display-name").text(res.displayName);
                bModal.find(".username").text("@" + res.handle);

                BAfterLogInReturnTimeout = setTimeout(function () {
                    changeSetupModal($("#setup-modal-5"), bModal);
                }, 1200);
            } else {
                tvii.alert(tvii.getLoc("vino.setup.bsky-login.p6"));
            }
        };
        request.send(form);
    }

    function logOutBsky() {
        if (
            tvii.confirm(
                tvii.getLoc("vino.setup.bsky-login.p7"),
                tvii.getLoc("vino.cancel"),
                tvii.getLoc("vino.logout")
            )
        ) {
            bModal.attr("data-bsky-logged-in", "false");
            bModal.attr("data-bsky-username", "");
            bModal.attr("data-bsky-password", "");

            bModal.find("input").removeClass("none");
            bModal.find("input").val("");
            bModal.find("p:not(.logged-in)").removeClass("none");
            bModal.find(".logged-in").addClass("none");
            bModal.find(".display-name").text("");
            bModal.find(".username").text("");
            bModal.find(".submit-login").removeClass("none");
            bModal.find(".submit-logout").addClass("none");

            changeSetupModal($("#setup-modal-5"), bModal);
        }
    }

    function XOauthLogic() {
        generateXCodeAuth(setXCodeInterval);
    }

    function logOutX() {
        if (
            tvii.confirm(
                tvii.getLoc("vino.setup.x-login.p3"),
                tvii.getLoc("vino.cancel"),
                tvii.getLoc("vino.logout")
            )
        ) {
            var modal = xModal;
            modal.attr("data-x-oauth-token", "");
            modal.attr("data-x-oauth-secret", "");
            modal.attr("data-x-user-id", "");
            modal.attr("data-x-logged-in", "false");
            modal.find(".btn-2").addClass("none");
            modal.find(".code").removeClass("none");
            modal.find(".logged-in").addClass("none");
            modal.find("p:not(.logged-in)").removeClass("none");
            modal.find(".code").text("");

            changeSetupModal($("#setup-modal-5"), modal);
        }
    }

    function generateXCodeAuth(callback) {
        var modal = xModal;
        if (modal.attr("data-x-logged-in") === "true") {
            return;
        }
        if (modal.find(".code").text().length) {
            callback(modal.find(".code").text());
            console.log("code exists");
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
        };
        xhr.send();
    }

    function clearXCodeInterval() {
        clearInterval(XInterval);
    }

    function setXCodeInterval(codeToCheck) {
        XInterval = setInterval(function () {
            var xhr = new XMLHttpRequest();
            //xhr.open("GET", tvii.clientUrl + "/apid/checkXCodeLogged.json?code=" + codeToCheck)
            xhr.open(
                "GET",
                tvii.clientUrl +
                "/api/v1/socials/XCodeCheck?code=" +
                codeToCheck
            );
            xhr.onload = function () {
                if (xhr.status === 200) {
                    var modal = xModal;
                    var response = JSON.parse(xhr.responseText);

                    if (response.status === "verified") {
                        clearXCodeInterval();
                        modal.attr(
                            "data-x-oauth-token",
                            response.x_oauth_token
                        );
                        modal.attr(
                            "data-x-oauth-secret",
                            response.x_oauth_secret
                        );
                        modal.attr("data-x-user-id", response.x_user_id);
                        modal.attr("data-x-logged-in", "true");
                        modal.find(".code").addClass("none");
                        modal.find("p:not(.logged-in)").addClass("none");
                        modal.find(".logged-in").removeClass("none");
                        modal
                            .find(".logged-in .display-name")
                            .text("@" + response.x_screen_name);
                        modal.find(".btn-2").removeClass("none");

                        XAfterLogInReturnTimeout = setTimeout(function () {
                            changeSetupModal($("#setup-modal-5"), modal);
                        }, 1200);
                    } else if (response.status === "expired") {
                        //MEANS IT EXPIRED
                        tvii.alert(tvii.getLoc("vino.setup.x-login.p4"));
                        //Clean the code so it generates a new one
                        modal.find(".code").text("");
                        changeSetupModal($("#setup-modal-5"), modal);
                    }
                }
            };
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

            tvii.sendXHR(
                "GET",
                tvii.clientUrl + "/api/v1/providers/" + code,
                function (responseText) {
                    var providers = JSON.parse(responseText).result;
                    setUpProviderAnchors(providers);
                },
                function () {
                    $(".tvproviders").addClass("none");
                    tvii.alert(
                        tvii.getLoc("vino.setup.screen3.m1"),
                        tvii.getLoc("vino.setup.screen3.m1.b1")
                    );
                    changeSetupModal($("#setup-modal-2"), $("#setup-modal-3"));
                }
            );
        } else if (isCA) {
            var region = $(".zip-canada select#ca-region").val();
            var city = $(".zip-canada select#ca-city").val();

            if (
                $(".tvproviders>a").length &&
                region === savedRegionCA &&
                city === savedCityCA
            ) {
                return;
            } else {
                $(".tvproviders>a").remove();
            }

            savedCityCA = city;
            savedRegionCA = region;

            tvii.sendXHR(
                "GET",
                tvii.clientUrl +
                "/api/v1/providers/countries/CA?type=providers&city=" +
                encodeURIComponent(city) +
                "&region=" +
                encodeURIComponent(region),
                function (responseText) {
                    var providers = JSON.parse(responseText).result;
                    setUpProviderAnchors(providers);
                },
                function () {
                    $(".tvproviders").addClass("none");
                    tvii.alert(
                        tvii.getLoc("vino.setup.screen3.m2"),
                        tvii.getLoc("vino.setup.screen3.m2.b1")
                    );
                    changeSetupModal($("#setup-modal-2"), $("#setup-modal-3"));
                }
            );
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
                providerN.html(provider.name);

                //API issue where the city name doesnt match the satellite providers.
                //Handle it to avoid confusion by not adding city label
                if (isUS || (isCA && provider.type != "satellite")) {
                    var providerC = $("<span>");
                    providerC.html(provider.city);
                }

                providerA.append(providerN);
                if (isUS || (isCA && provider.type != "satellite")) {
                    providerA.append(providerC);
                }

                $(".tvproviders").append(providerA);
            }

            $(".tvproviders .providertypes>a").removeClass("selected");
            $(".tvproviders .providertypes>a:first-child").addClass("selected");

            tvii.setActualClickListener($(".tvproviders>a"), function () {
                $(this).focus();
                vino.navi_setToFocused(true);
                vino.lyt_startTouchEffect();
                vino.soundPlayVolume("SE_CHECK", 30);
                $(".tvproviders>a").removeClass("selected");
                $(this).addClass("selected");
                vino.navi_decide();
                document.activeElement.blur();
            });

            $(".tvproviders>a").addClass("none");
            $('.tvproviders>a[data-provider-type="cable"]').removeClass("none");

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
        }
    }

    function getCanadaRegionsAndCitys(callback) {
        var xhr = new XMLHttpRequest();
        tvii.sendXHR(
            "GET",
            tvii.clientUrl + "/api/v1/providers/countries/CA?type=regions",
            function (responseText) {
                $(".zip-canada select#ca-region option").remove();
                $(".zip-canada select#ca-city option").remove();
                $(".zip-canada select#ca-city-page option").remove();

                var regions = JSON.parse(responseText).result;
                for (var regionKey in regions) {
                    if (
                        Object.prototype.hasOwnProperty.call(regions, regionKey)
                    ) {
                        var regionOpt = $("<option>");
                        regionOpt.attr("value", regionKey);
                        regionOpt.text(regionKey);
                        $(".zip-canada select#ca-region").append(regionOpt);
                    }
                }

                function updatePageCounter() {
                    var selectedRegion = $(
                        ".zip-canada select#ca-region"
                    ).val();

                    if (
                        Object.prototype.hasOwnProperty.call(
                            regions,
                            selectedRegion
                        )
                    ) {
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
                    var page = parseInt(
                        $(".zip-canada select#ca-city-page").val(),
                        10
                    ); // Current page number
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

                $(".zip-canada select#ca-city-page").on(
                    "change",
                    updateCitySelector
                );
                $(".zip-canada select#ca-region").on("change", function () {
                    updatePageCounter();
                    updateCitySelector();
                });

                //For Canada, a default is already set on the dropdown, continue with setup.
                $(".zipcode-checkconfirm").removeClass("disabled");
            },
            function () {
                tvii.alert(tvii.getLoc("vino.error.canada_region_request"));
                vino.exitForce();
            }
        );
    }

    $("a[data-show][data-hide]").on("click", function () {
        var a = $(this);
        changeSetupModal($(a.attr("data-show")), $(a.attr("data-hide")));
    });

    //Check if its US or Canada
    if (isUS) {
        usZipCodeInput.removeClass("none");
        $(".us-provider-info").removeClass("none");
    } else if (isCA) {
        caZipCodeContainer.removeClass("none");
        $(".ca-provider-info").removeClass("none");
        getCanadaRegionsAndCitys();
    }

    changeSetupModal($("#setup-modal-1"), null);

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
            tvii.alert(tvii.getLoc("vino.setup.screen3.p2"));
        }
    });

    $(".tvproviders .providertypes>a").on("click", function () {
        vino.soundPlayVolume("SE_TAB_SELECT", 30);

        $(".tvproviders .providertypes>a").removeClass("selected");
        $(this).addClass("selected");

        $(".tvproviders>a").addClass("none");
        $(
            '.tvproviders>a[data-provider-type="' +
            $(this).attr("data-provider-filter") +
            '"]'
        ).removeClass("none");
    });
}

function initVinoHome() {
    tvii.pushStateWithQuery("page", "home", false);
    $(".miiverse-post-modal").html(tvii.templates.get("miiverse_post_modal"));
    $(".program-fulldetails-page").html(tvii.templates.get("prg_fulldetails"));
    tvii.templates.setUpLocHTML();

    window.addEventListener("popstate", function (e) {
        var query = tvii.getQuery("scene", true);
        console.log("popstate" + query);
        switch (query) {
            case "pprev":
                onProgramPreviewPopstate(e);
                break;
            case "livetab":
                onLiveTabPopstate(e);
                break;
            default:
                break;
        }
    });

    /*if (tvii.getQuery("scene", true)) {
        tvii.pushStateWithQuery("scene", "livetab", false);
    } else {
        tvii.pushStateWithQuery("scene", "livetab", false);
    }*/

    setupClock();
    tvii.setClassHoverToEls(
        $(
            ".exit, .menu, .back, .tune-in, .prev-page, .next-page, .miiverse-button, .miiverse-post"
        )
    );

    $(".header .exit").on("click", function (e) {
        if (isHeaderButtonBlocked) return;
        if (e.originalEvent) {
            if (!vino.navi_getRect()) {
                vino.lyt_startTouchEffect();
            }
            vino.soundPlayVolume("SE_COMMON_FINISH_TOUCH_OFF", 30);
        } else {
            vino.soundPlayVolume("SE_COMMON_FINISH", 30);
        }
        vino.exit();
    });

    $(".footer .back").on("click", function (e) {
        if (isHeaderButtonBlocked) return;
        if (e.originalEvent) {
            if (!vino.navi_getRect()) {
                vino.lyt_startTouchEffect();
            }
            vino.soundPlayVolume("SE_CLOSE_TOUCH_OFF", 30);
        } else {
            vino.soundPlayVolume("SE_CLOSE", 30);
        }
        history.back();
    });

    var isSendingIR = false;

    $(".tune-in").on("click", function (e) {
        //vino.olv_postText("Hi", "Test tag", 2, false, "9000010198", "vino_search_key", "", "", "");

        if (isHeaderButtonBlocked) return;
        if (isSendingIR) return;

        var chNum = $(".program-info .program-details").attr("data-chnufoc");
        if (!chNum) return;

        if (e.originalEvent) {
            if (!vino.navi_getRect()) {
                vino.lyt_startTouchEffect();
            }
        }

        isSendingIR = true;

        chNum = chNum.trim();

        var digits = chNum.split("");
        var index = 0;

        function sendNextDigit() {
            if (index >= digits.length) {
                // After digits, send OK (code 60)
                vino.ir_send(60, 0);

                // Play remote finish sound
                setTimeout(function () {
                    vino.soundPlayVolume("SE_REMOTE_FINISH", 30);
                    isSendingIR = false;
                }, 550);
                return;
            }

            var digit = digits[index++];
            var code = 0;

            switch (digit) {
                case "0":
                    code = 20;
                    break;
                case "1":
                    code = 11;
                    break;
                case "2":
                    code = 12;
                    break;
                case "3":
                    code = 13;
                    break;
                case "4":
                    code = 14;
                    break;
                case "5":
                    code = 15;
                    break;
                case "6":
                    code = 16;
                    break;
                case "7":
                    code = 17;
                    break;
                case "8":
                    code = 18;
                    break;
                case "9":
                    code = 19;
                    break;
                case ".":
                    code = 55;
                    break;
                default:
                    setTimeout(sendNextDigit, 550); // Skip invalid
                    return;
            }

            vino.ir_send(code, 0);
            setTimeout(sendNextDigit, 550);
        }

        sendNextDigit();
    });

    $(".header .tabs>a").on("click", function () {
        if (isHeaderButtonBlocked) return;
        if ($(this).hasClass("selected")) return;
        vino.lyt_startTouchEffect();
        vino.soundPlayVolume("SE_TAB_SELECT", 30);

        $(".header .tabs>a").removeClass("selected");
        switch ($(this).index()) {
            case 0: // first child
                initLiveTab();
                break;
            case 1: // second child
                initGuideTab();
                break;
            case 2: // third child
                initRecommendedTab();
                break;
        }
        $(this).addClass("selected");
    });

    var requested = false;
    var lastRequestedHeight = 0;
    var head = document.querySelector(".header"); // Will move up
    var head2 = document.querySelector(".header.pr-details"); // Will move up
    var headOlv = document.querySelector(".header.miiverse"); // Will move up
    var bott = document.querySelector(".bottom"); // Will move down
    var cent = document.querySelector(".program-central");
    var det = document.querySelector(".program-fulldetails-page");
    var programListScroll = 0;
    var programPreviewScroll = 0;
    var lineup = tvii.profile.tv_provider_id;
    var limit = 100;
    var offset = 0;
    var total = 0;
    var duration = 120;

    var activeProgram = {
        info: {
            id: null,
            airingAttrib: null,
            name: null,
            episodeTitle: null,
            parentId: null,
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
        },
    };

    function setUpTitleScrollbar(onSnapCallback, onConfirmCallback) {
        var container = document.querySelector(".program-list .content");
        var thumb = document.querySelector(".program-list .scrollbar .thumb");

        var minThumbTop = 20;
        var maxThumbTop = 225;
        var snapAnchorY = 193.5;

        var currentSnappedElement = null;
        var lastScrollTop = container.scrollTop;
        var scrollSoundThreshold = 4;
        var isSnappingBack = false;
        var scrollEndSfx = "SE_LIST_SCROLL_END";
        var scrollSfx = scrollEndSfx.slice(0, -4);
        var vol = 60;

        // Edge lockout vars
        var EDGE_RESET_PX = 4; // must move this far away from edge to re-arm beep
        var edgeLockTop = false;
        var edgeLockBottom = false;

        function updateThumbPosition() {
            var maxScroll = container.scrollHeight - container.clientHeight;
            if (maxScroll <= 0) return;
            var scrollRatio = container.scrollTop / maxScroll;
            var newTop =
                minThumbTop + scrollRatio * (maxThumbTop - minThumbTop);
            thumb.style.top = newTop + "px";
        }

        function updateContainerScroll(thumbTop) {
            var maxScroll = container.scrollHeight - container.clientHeight;
            if (maxScroll <= 0) return;
            var scrollRatio =
                (thumbTop - minThumbTop) / (maxThumbTop - minThumbTop);
            container.scrollTop = scrollRatio * maxScroll;
        }

        function playScrollSound() {
            if (isSnappingBack) {
                lastScrollTop = container.scrollTop;
                return;
            }

            const maxScroll = container.scrollHeight - container.clientHeight;
            const top = container.scrollTop;
            const delta = Math.abs(top - lastScrollTop);

            const nearTop = top <= 1;
            const nearBottom = top >= Math.max(0, maxScroll - 1);

            const awayFromTop = top > EDGE_RESET_PX;
            const awayFromBottom = top < maxScroll - EDGE_RESET_PX;

            // Entering top edge
            if (nearTop && !edgeLockTop) {
                vino.soundPlayVolume(scrollEndSfx, vol);
                edgeLockTop = true;
                edgeLockBottom = false; // clear opposite lock
            }
            // Entering bottom edge
            else if (nearBottom && !edgeLockBottom) {
                vino.soundPlayVolume(scrollEndSfx, vol);
                edgeLockBottom = true;
                edgeLockTop = false;
            }
            // Middle scrolling
            else if (!nearTop && !nearBottom && delta >= scrollSoundThreshold) {
                vino.soundPlayVolume(scrollSfx, vol);
            }

            // Unlock edges when far enough away
            if (edgeLockTop && awayFromTop) edgeLockTop = false;
            if (edgeLockBottom && awayFromBottom) edgeLockBottom = false;

            lastScrollTop = top;
        }

        function snapToElement(elem, triggerCallback) {
            if (!elem) return;
            var containerRectTop = container.getBoundingClientRect().top;
            var anchorY = containerRectTop + snapAnchorY;
            var rect = elem.getBoundingClientRect();
            var delta = rect.top + rect.height / 2 - anchorY;
            var targetScroll = container.scrollTop + delta;

            isSnappingBack = true;
            $(container)
                .stop(true)
                .animate({ scrollTop: targetScroll }, 120, function () {
                    updateThumbPosition();
                    currentSnappedElement = elem;
                    isSnappingBack = false;
                    if (
                        typeof onSnapCallback === "function" &&
                        triggerCallback
                    ) {
                        onSnapCallback(elem);
                    }
                });
        }

        window.snapToClosestProgram = function (triggerCallback) {
            var programs = container.querySelectorAll(".program");
            var len = programs.length;
            if (!len) return;

            var containerRectTop = container.getBoundingClientRect().top;
            var anchorY = containerRectTop + snapAnchorY;
            var closest = null;
            var closestDistance = Infinity;

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
        };

        // Scrollbar dragging
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
        window.setListenerToProgram = function () {
            var $programs = $(".program");
            $programs.each(function () {
                var $el = $(this);
                if ($el.data("tscr-d")) return;
                $el.data("tscr-d", true);
                tvii.setActualClickListener($programs, function (evt) {
                    if (isSnappingBack) return;
                    if (
                        typeof onConfirmCallback === "function" &&
                        this === currentSnappedElement
                    ) {
                        onConfirmCallback(this, false);
                        return;
                    }
                    vino.lyt_startTouchEffect();
                    vino.soundPlayVolume(scrollSfx, vol);
                    snapToElement(this, true);
                });
            });
        };

        // Previous/Next controls
        var hiddenUp = document.querySelector(".title-program-up");
        var hiddenDown = document.querySelector(".title-program-down");
        var hiddenOk = document.querySelector(".title-program-confirm");

        if (hiddenUp) {
            hiddenUp.addEventListener("click", function () {
                if (isSnappingBack || !currentSnappedElement) return;
                var all = Array.prototype.slice.call(
                    container.querySelectorAll(".program")
                );
                var visible = all.filter(function (el) {
                    return el.offsetParent !== null;
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
                var all = Array.prototype.slice.call(
                    container.querySelectorAll(".program")
                );
                var visible = all.filter(function (el) {
                    return el.offsetParent !== null;
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
                    onConfirmCallback(currentSnappedElement, true);
                }
            });
        }
    }

    function setProgramDivAttribute(guide) {
        var result = guide.result;
        var programs = document.querySelectorAll(
            ".program-list .contents > .program"
        );

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
            programEl.querySelector(".genre").querySelector("span").innerHTML =
                "";

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
                programEl.setAttribute(
                    "data-aiat-" + index,
                    program.airingAttrib
                );
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

        return (
            dayName +
            ". " +
            month +
            "/" +
            day +
            ", " +
            timeStart +
            " - " +
            timeEnd
        );
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
            colonSpan.style.visibility =
                colonSpan.style.visibility === "hidden" ? "visible" : "hidden";
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
        const channelNum = program.attr("data-chnu");

        // Get previously shown data
        const lastChannelName = programDetails.attr("data-chfoc");
        const lastProgramId = programDetails.attr("data-prfoc");
        const lastChannelNum = programDetails.attr("data-chnufoc");

        // If same program and same channel name and num, do nothing
        if (
            lastProgramId === programId &&
            lastChannelName === channelName &&
            lastChannelNum === channelNum
        ) {
            console.log("same chan, num, and prog");
            return;
        }

        const logoSrc = program.attr("data-chlo") + "?width=56";
        const chlogo = programDetails.find(".chlogo");
        const start = parseInt(program.attr("data-aist-active"), 10);
        const end = parseInt(program.attr("data-aien-active"), 10);
        chlogo.off("error").on("error", function () {
            chlogo.hide();
        });

        // If same program but different channel, update only logo, channel name, and airdate
        if (
            (lastProgramId === programId && lastChannelName !== channelName) ||
            (lastProgramId === programId && lastChannelNum !== channelNum)
        ) {
            console.log("dif chan but same prog");
            //Update active program
            activeProgram.channel = {
                name: program.attr("data-chna"),
                number: channelNum,
                logo: program.attr("data-chlo"),
                networkName: program.attr("data-chnn"),
                networkId: program.attr("data-chid"),
                sourceId: program.attr("data-chsid"),
                fullName: channelName,
            };
            activeProgram.time = { start: start, end: end };
            chlogo.show();
            chlogo.attr("src", logoSrc);

            const chnumElem = programDetails.find(".chnum");
            const chnumText = chnumElem.text();
            console.log(lastChannelName, channelName);
            const updatedChnumText = chnumText.replace(
                lastChannelName,
                channelName
            );
            chnumElem.text(updatedChnumText);

            const timeStr = formatAMPMWithDate(start, end);
            programDetails.find(".date").text(timeStr);
            programDetails.attr("data-chnufoc", channelNum);
            programDetails.attr("data-chfoc", channelName); // update new channel
            return;
        }

        // Otherwise: fetch new program details
        programDetails.hide();
        vino.loading_setIconRect(165, 180, 110, 110);
        vino.loading_setIconAppear(true);
        chlogo.show();
        chlogo.attr("src", logoSrc);
        //Expecting that miiverse post WILL be shown after requesting
        showMiiversePostPreview(false);

        tvii.requestProgramDetails(
            programId,
            "episode",
            function (details) {
                var chfn = program.attr("data-chfn") || "";
                if (chfn.length > 25 && details.seasonNumber != null) {
                    chfn = chfn.slice(0, 22) + "...";
                } else if (
                    chfn.length > 36 &&
                    details.releaseYear &&
                    !details.tvRating
                ) {
                    chfn = chfn.slice(0, 33) + "...";
                } else if (
                    chfn.length > 30 &&
                    details.releaseYear &&
                    details.tvRating
                ) {
                    chfn = chfn.slice(0, 27) + "...";
                }

                var seasonEpisodeText = "";
                if (details.seasonNumber != null) {
                    seasonEpisodeText =
                        " · S" +
                        details.seasonNumber +
                        " E" +
                        details.episodeNumber;
                }

                programDetails
                    .find(".chnum")
                    .text(
                        chfn +
                        (details.tvRating
                            ? " · " +
                            details.tvRating
                                .toString()
                                .replace(/\s+/g, "")
                            : "") +
                        (details.releaseYear
                            ? " · " + details.releaseYear
                            : "") +
                        seasonEpisodeText
                    );

                programDetails.find(".pname").text(details.name);

                if (details.episodeTitle && details.episodeTitle !== "") {
                    programDetails
                        .find(".channel-detail")
                        .removeClass("no-episode");
                    programDetails.find(".pepisode").text(details.episodeTitle);
                } else {
                    programDetails
                        .find(".channel-detail")
                        .addClass("no-episode");
                    programDetails.find(".pepisode").text("");
                }

                const timeStr = formatAMPMWithDate(start, end);
                programDetails.find(".date").text(timeStr);

                const desc =
                    details.description || details.episodeTitle || details.name;
                programDetails.find(".program-description > p").text(desc);

                console.log(details);
                // Update active program info
                activeProgram.info = {
                    id: details.id,
                    name: details.name,
                    episodeTitle: details.episodeTitle,
                    parentId: details.parentId,
                    airingAttrib: parseInt(
                        program.attr("data-aiat-active"),
                        10
                    ),
                };
                activeProgram.time = { start: start, end: end };
                activeProgram.channel = {
                    name: program.attr("data-chna"),
                    number: channelNum,
                    logo: program.attr("data-chlo"),
                    networkName: program.attr("data-chnn"),
                    networkId: program.attr("data-chid"),
                    sourceId: program.attr("data-chsid"),
                    fullName: channelName,
                };

                requestMiiversePostProgPreview(programId);
                programDetails.attr("data-chnufoc", channelNum);
                programDetails.attr("data-chfoc", channelName);
                programDetails.attr("data-prfoc", programId);
                vino.loading_setIconAppear(false);
                programDetails.show();
                details = null;
            },
            function () {
                // Optional error handler
            }
        );
    }

    function showMiiversePostPreview(show) {
        $(".bottom .miiverse-preview").css("display", show ? "" : "none");
    }

    var isHeaderButtonBlocked = false;

    function disableTopBotHeaders(disable) {
        isHeaderButtonBlocked = disable;
        $(".footer").css("pointer-events", disable ? "none" : "auto");
        $(".top").css("pointer-events", disable ? "none" : "auto");
    }

    function getFeelingQueryFromPostXml(feeling) {
        var feelingQuery = "normal";
        switch (feeling) {
            case 1:
                feelingQuery = "smile_open_mouth";
                break;
            case 2:
                feelingQuery = "like_wink_left";
                break;
            case 3:
                feelingQuery = "surprise_open_mouth";
                break;
            case 4:
                feelingQuery = "frustrated";
                break;
            case 5:
                feelingQuery = "sorrow";
                break;
            default:
                break;
        }
        return feelingQuery;
    }

    // Keep a global/current request id
    var currentMiiversePreviewReq = 0;

    function requestMiiversePostProgPreview(programId) {
        var miiversePrev = $(".bottom .miiverse-preview");
        showMiiversePostPreview(false);

        miiversePrev.find("span").text("");
        miiversePrev.find("img").attr("src", "/img/noMiiPost.png");

        // Increment request counter each time function is called
        var thisReq = ++currentMiiversePreviewReq;

        tvii.posts.requestPosts(
            "1",
            ["PR" + programId],
            function (posts) {
                // If this is not the latest request, ignore it
                if (thisReq !== currentMiiversePreviewReq) return;

                const firstPost = posts[0];
                if (!firstPost) {
                    miiversePrev.find("span").addClass("placeholder");
                    miiversePrev
                        .find("span")
                        .text("No posts for this program. Be the first!");
                    showMiiversePostPreview(true);
                    return;
                }

                miiversePrev.find("span").removeClass("placeholder");
                var body = firstPost.body;
                if (!body || body.length < 1) {
                    miiversePrev.find("span").addClass("placeholder");
                    body = "Handwritten message";
                }
                miiversePrev.find("span").text(body);

                var miiData = firstPost.mii_data;
                var feeling = firstPost.feeling_id;
                var feelingQ = getFeelingQueryFromPostXml(feeling);
                var miiUrl =
                    tvii.clientUrl +
                    "/api/v1/miis?width=75&expression=" +
                    feelingQ +
                    "&data=" +
                    encodeURIComponent(miiData) +
                    "&type=face";

                var img = new Image();
                img.onload = function () {
                    // Only set image if this is still the latest request
                    if (thisReq === currentMiiversePreviewReq) {
                        miiversePrev.find("img").attr("src", miiUrl);
                    }
                };
                img.onerror = function () {
                    if (thisReq === currentMiiversePreviewReq) {
                        miiversePrev
                            .find("img")
                            .attr("src", "/img/noMiiPost.png");
                    }
                };
                img.src = miiUrl;

                showMiiversePostPreview(true);
            },
            function () {
                if (thisReq === currentMiiversePreviewReq) {
                    showMiiversePostPreview(true);
                }
            }
        );
    }

    function drawLyt() {
        vino.lyt_drawFixedFrame(430 - 3, 217 - 3, 360 + 3, 77 + 4);
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
            return catId === tvii.tvgAirGenre.NEWS
                ? C_NEWS
                : catId === tvii.tvgAirGenre.MOVIES
                    ? C_MOVIES
                    : catId === tvii.tvgAirGenre.SPORTS
                        ? C_SPORTS
                        : catId === tvii.tvgAirGenre.FAMILY
                            ? C_FAMILY
                            : C_GEN;
        };

        var getCategoryText = function (catId) {
            return catId === tvii.tvgAirGenre.NEWS
                ? T_NEWS
                : catId === tvii.tvgAirGenre.MOVIES
                    ? T_MOVIES
                    : catId === tvii.tvgAirGenre.SPORTS
                        ? T_SPORTS
                        : catId === tvii.tvgAirGenre.FAMILY
                            ? T_FAMILY
                            : T_GEN;
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
                    program.airingAttrib = parseInt(
                        $a.attr("data-aiat-" + index),
                        10
                    );
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
                    infoText =
                        STR_STARTED +
                        (hours > 0
                            ? hours +
                            STR_HOUR +
                            (minutes > 0
                                ? " " + minutes + STR_MIN_AGO2
                                : STR_AGO)
                            : minutes + STR_MIN_AGO);
                }

                var infoSpan = dom.querySelector("span.info");
                var textSpan = infoSpan
                    ? infoSpan.querySelector(".text")
                    : null;
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
                infoText =
                    STR_STARTED +
                    (hours > 0
                        ? hours +
                        STR_HOUR +
                        (minutes > 0 ? " " + minutes + STR_MIN_AGO2 : STR_AGO)
                        : minutes + STR_MIN_AGO);
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
                genre.querySelector("span").innerHTML = getCategoryText(
                    program.catId
                );
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

                chNet = chNet && chNet !== "null" ? chNet : "";
                chNum = chNum && chNum !== "null" ? chNum : "";

                var stationText =
                    chName + " (" + (chNet ? chNet + " " : "") + chNum + ")";
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
        $(".pagi-menu .prev, .pagi-menu .next").on("click", function () {
            if (requested) return;

            var isPrev = $(this).hasClass("prev");
            var isNext = $(this).hasClass("next");

            if (isPrev && offset === 0) return;
            if (isNext && offset + limit >= total) return;

            if (!vino.navi_getRect()) {
                vino.lyt_startTouchEffect();
            }
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
            var currentTime = tvii.getLockedHourTimestamp();
            tvii.requestProgramGuide(
                currentTime,
                lineup,
                duration,
                limit,
                offset,
                function (guide) {
                    setProgramDivAttribute(guide);
                    updateTabListProgram();
                    window.setListenerToProgram();
                    updatePagiMenuState();
                    $button.removeClass("selected");
                    $(".program-list .content")
                        .stop()
                        .animate({ scrollTop: 0 }, 300, function () {
                            window.snapToClosestProgram(true);
                        });
                    vino.lyt_setFixedFrameSemitransparency(false);
                    vino.loading_setIconAppear(false);
                    guide = null;
                    requested = false;
                    vino.requestGarbageCollect();
                },
                function () {
                    vino.loading_setIconAppear(false);
                    $button.removeClass("selected");
                    requested = false;
                }
            );
        }

        function updatePagiMenuState() {
            var $prev = $(".pagi-menu .prev");
            var $next = $(".pagi-menu .next");
            var $counter = $(".pagi-menu > span");

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

        // Initialize PagiMenu state on first load
        updatePagiMenuState();
    }

    function programConfirmSel(program, isTriggered) {
        var programDetails = $(".program-central .program-details");
        if (!programDetails.is(":visible")) {
            return;
        }
        if (!isTriggered) {
            vino.lyt_startTouchEffect();
        }
        vino.lyt_decideFixedFrame();
        vino.soundPlayVolume("SE_APPEAR_DETAIL", 30);
        setupProgramPageWithAnim();
    }

    function cleanProgramPage() {
        $(".trailer-modal p").text("");
        $(".trailer-modal video").attr("src", "");
        $(".trailer-modal video").attr("poster", "");
        var prodet = document.querySelector(
            ".program-fulldetails-page .program-details"
        );
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
        $(".program-fulldetails-page .program-extra .info>span .text").text("");
        document
            .querySelector(".program-fulldetails-page .program-image>img")
            .setAttribute("src", "/img/noimg.png");
    }

    var isMovingPrgmPage = false;

    function setupProgramPage() {
        if (!activeProgram) return;
        tvii.pushStateWithQuery("scene", "pprev", true, {
            program: activeProgram,
        });
        //Now start
        cleanProgramPage();
        vino.loading_setIconRect(360, 160, 120, 120);
        vino.loading_setIconAppear(true);

        $(".prev-page").stop(true, true).fadeOut(0);
        $(".next-page").stop(true, true).fadeIn(0);
        console.log(activeProgram);

        $(".program-fulldetails-page .content").stop(true, true).scrollLeft(0);

        if (!$(".next-page").data("pagimove")) {
            $(".trailer-modal .back-modal").on("click", function (e) {
                if (isHeaderButtonBlocked) return;
                if ($(this).hasClass("disabled")) return;
                if (e.originalEvent && !vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }

                vino.soundPlayVolume("SE_CLOSE", 30);

                $(".trailer-modal").hide();
            });

            $(".related-buttons .trailer").on("click", function (e) {
                if (isHeaderButtonBlocked) return;
                if ($(this).hasClass("disabled")) return;
                if (e.originalEvent && !vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }
                vino.soundPlayVolume("SE_POPUP", 30);

                $(".trailer-modal").show();
            });

            $(".prev-page").on("click", function (e) {
                if (isMovingPrgmPage) return;
                if (isHeaderButtonBlocked) return;
                isMovingPrgmPage = true;
                if (e.originalEvent && !vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }
                vino.soundPlayVolume("SE_MOVEPAGE_PLAY", 30);
                $(".prev-page").fadeOut(200);
                $(".program-fulldetails-page .content").animate(
                    {
                        scrollLeft: 0,
                    },
                    350,
                    function () {
                        $(".next-page").fadeIn(200);
                        isMovingPrgmPage = false;
                    }
                );
            });

            $(".next-page").on("click", function (e) {
                if (isMovingPrgmPage) return;
                if (isHeaderButtonBlocked) return;
                isMovingPrgmPage = true;
                if (e.originalEvent && !vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }
                vino.soundPlayVolume("SE_MOVEPAGE_PLAY", 30);
                $(".next-page").fadeOut(200);
                $(".program-fulldetails-page .content").animate(
                    {
                        scrollLeft: 854,
                    },
                    350,
                    function () {
                        $(".prev-page").fadeIn(200);
                        isMovingPrgmPage = false;
                    }
                );
            });
            $(".next-page").data("pagimove", true);
        }

        tvii.requestProgramDetails(
            activeProgram.info.id,
            "episode",
            function (details) {
                var prodet = $(".program-fulldetails-page .program-details");
                console.log(details);

                var airFlags = tvii.getAiringFlags(
                    activeProgram.info.airingAttrib
                );
                var timeStr = formatAMPMWithDate(
                    activeProgram.time.start,
                    activeProgram.time.end
                );

                var chlogo = prodet.find(".chlogo");
                chlogo[0].onerror = function () {
                    $(this).hide();
                };

                chlogo.show();
                chlogo.attr("src", activeProgram.channel.logo + "?width=56");

                var seasonEpisodeText = "";
                if (
                    details.seasonNumber != null &&
                    details.episodeNumber != null
                ) {
                    seasonEpisodeText =
                        " · S" +
                        details.seasonNumber +
                        " E" +
                        details.episodeNumber;
                }

                var rating = details.tvRating
                    ? details.tvRating.toString().replace(/\s+/g, "")
                    : "";
                var year = details.releaseYear
                    ? (rating ? " · " : "") + details.releaseYear
                    : "";

                prodet
                    .find(".prinfo .info")
                    .text(rating + year + seasonEpisodeText);

                head2.querySelector("span").innerText = details.name;
                prodet.find(".date").text(timeStr);
                prodet.find(".chname").text(activeProgram.channel.fullName);
                prodet
                    .find(".chnumber")
                    .text("Ch " + activeProgram.channel.number);

                var tag = prodet.find(".prinfo > .tag");
                tag.removeClass("tagn");
                tag.removeClass("tagl");

                if (airFlags.isNew) {
                    tag.addClass("tagn");
                    tag.text("New");
                    tag.show();
                } else if (airFlags.isLive) {
                    tag.addClass("tagl");
                    tag.text("Live");
                    tag.show();
                } else {
                    tag.text("");
                    tag.hide();
                }

                if (details.metacriticSummary) {
                    prodet.find(".scoreinfo>.text").text("Metascore: ");
                    var scoreEl = prodet.find(".scoreinfo>.metascore");
                    var scoreN = details.metacriticSummary.score;
                    scoreEl.show();
                    scoreEl.text(details.metacriticSummary.score);
                    scoreEl.removeClass("green");
                    scoreEl.removeClass("yellow");
                    scoreEl.removeClass("red");
                    if (scoreN >= 61) {
                        scoreEl.addClass("green");
                    } else if (scoreN >= 40) {
                        scoreEl.addClass("yellow");
                    } else {
                        scoreEl.addClass("red");
                    }
                }

                prodet
                    .find(".program-description>span")
                    .text(details.episodeTitle || "");
                prodet
                    .find(".program-description>p")
                    .text(details.description || "");

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

                    $(".program-fulldetails-page .program-image>img").attr(
                        "src",
                        tvii.clientUrl +
                        "/images/catalog" +
                        bucketPath +
                        "?height=225"
                    );
                }

                var genreString = "";

                if (details.genres && details.genres.length) {
                    for (var i = 0; i < details.genres.length; i++) {
                        var genre = details.genres[i].genres[0];
                        if (i === 0) {
                            genreString += genre; // no slash before the first genre
                        } else {
                            genreString += "/" + genre;
                        }
                    }
                } else {
                    genreString = "No genre information.";
                }

                var prgextra = $(".program-fulldetails-page .program-extra");

                prgextra.find(".info .genre .text").text(genreString);

                var formattedDate = "";

                if (details.episodeAirDate) {
                    var timestampMatch = details.episodeAirDate.match(/\d+/);
                    if (timestampMatch) {
                        var timestamp = parseInt(timestampMatch[0], 10);
                        var date = new Date(timestamp);

                        // Manual zero-padding (safe for old browsers)
                        var mm = date.getMonth() + 1;
                        var dd = date.getDate();
                        var yyyy = date.getFullYear();

                        if (mm < 10) mm = "0" + mm;
                        if (dd < 10) dd = "0" + dd;

                        formattedDate = mm + "/" + dd + "/" + yyyy;
                    } else {
                        formattedDate = "No original air date.";
                    }
                } else {
                    formattedDate = "No original air date.";
                }

                prgextra.find(".info .og-airdate .text").text(formattedDate);

                prgextra.find(".info .og-airdate .text").text(formattedDate);

                if (details.video) {
                    prgextra.find("a.trailer").removeClass("disabled");
                    prgextra.find("a.trailer").attr("navi_target", "");
                    
                    $(".trailer-modal p").text(details.video.videoTitle);
                    $(".trailer-modal video").attr("src", details.video.url);
                } else {
                    prgextra.find("a.trailer").addClass("disabled");
                    prgextra.find("a.trailer").removeAttr("navi_target");
                }

                vino.loading_setIconAppear(false);
            },
            function () {
                vino.loading_setIconAppear(false);
            }
        );
    }

    var top = $(".top");
    var footer = $(".footer");
    var hdrAnimSp = 300;

    function setupProgramPageWithAnim() {
        disableTopBotHeaders(true);
        cleanProgramPage();
        programListScroll = $(".program-list .content").scrollTop();

        cent.style.display = "none";

        top.animate(
            {
                scrollTop: top[0].scrollHeight,
                opacity: 0,
            },
            hdrAnimSp
        );

        footer.animate(
            {
                scrollTop: 0,
                opacity: 0,
            },
            hdrAnimSp
        );

        setTimeout(function () {
            head.style.display = "none";
            head2.style.display = "";
            bott.classList.add("prfuldet");
            top.scrollTop(top[0].scrollHeight);
            $(det).fadeIn(190);
            $(".program-fulldetails-page .content")
                .stop(true, true)
                .scrollLeft(0);
            $(".prev-page").stop(true, true).fadeOut(0);
            $(".next-page").stop(true, true).fadeIn(0);

            top.animate(
                {
                    scrollTop: 0,
                    opacity: 1,
                },
                hdrAnimSp - 100
            );

            footer.animate(
                {
                    scrollTop: footer[0].scrollHeight,
                    opacity: 1,
                },
                hdrAnimSp,
                function () {
                    //Actually set up Program Page
                    setupProgramPage();
                    disableTopBotHeaders(false);
                }
            );
        }, hdrAnimSp);
    }

    function closeProgramPageWithAnim() {
        disableTopBotHeaders(true);

        top.animate(
            {
                scrollTop: top[0].scrollHeight,
                opacity: 0,
            },
            hdrAnimSp
        );

        footer.animate(
            {
                scrollTop: 0,
                opacity: 0,
            },
            hdrAnimSp
        );

        $(det).fadeOut(190);

        setTimeout(function () {
            cleanProgramPage();
            det.style.display = "none";
            head2.style.display = "none";
            head.style.display = "";
            bott.classList.remove("prfuldet");

            top.scrollTop(top[0].scrollHeight);

            top.animate(
                {
                    scrollTop: 0,
                    opacity: 1,
                },
                hdrAnimSp - 100,
                function () {
                    cent.style.display = "";
                    $(".program-list .content").scrollTop(programListScroll);
                    drawLyt();
                    disableTopBotHeaders(false);
                }
            );

            footer.animate(
                {
                    scrollTop: footer[0].scrollHeight,
                    opacity: 1,
                },
                hdrAnimSp
            );
        }, hdrAnimSp);
    }

    function openMiiversePageWithAnim() {
        disableTopBotHeaders(true);
        cleanMiiversePage();
        vino.lyt_reset();
        //If is program list, hide program list stuff,
        //Else we assume its program page
        var isProgramList = $(".program-list").is(":visible");

        if (isProgramList) {
            programListScroll = $(".program-list .content").scrollTop();
            cent.style.display = "none";
        } else {
            programPreviewScroll = $(
                ".program-fulldetails-page .content"
            ).scrollLeft();
            $(det).fadeOut(190);
        }

        top.animate(
            {
                scrollTop: top[0].scrollHeight,
                opacity: 0,
            },
            hdrAnimSp
        );

        footer.animate(
            {
                scrollTop: 0,
                opacity: 0,
            },
            hdrAnimSp
        );

        setTimeout(function () {
            if (isProgramList) {
                head.style.display = "none";
            } else {
                head2.style.display = "none";
                $(".program-fulldetails-page .content")
                    .stop(true, true)
                    .scrollLeft(0);
            }
            headOlv.style.display = "";
            bott.classList.remove("prfuldet");
            bott.classList.add("miiverse");
            //Same thing done when requesting posts but we do repeat the action in case
            //This type of thing is done multiple times
            $(".miiverse-post").addClass("disabled");
            top.scrollTop(top[0].scrollHeight);
            //$(det).fadeIn(190);

            top.animate(
                {
                    scrollTop: 0,
                    opacity: 1,
                },
                hdrAnimSp - 100
            );

            footer.animate(
                {
                    scrollTop: footer[0].scrollHeight,
                    opacity: 1,
                },
                hdrAnimSp,
                function () {
                    setupMiiversePage();
                    disableTopBotHeaders(false);
                }
            );
        }, hdrAnimSp);
    }

    function cleanMiiversePage() {
        headOlv.querySelector("span").innerText = "";
        $(".miiverse-modal").html("");
        $(".miiverse-post-modal .dialog-container .popup-header").text("");
    }

    function closeMiiversePageWithAnim(page) {
        disableTopBotHeaders(true);
        var isLiveTab = page === "livetab";
        var isProgramPreview = page === "pprev";

        console.log("closing miiverse with livetab: ", isLiveTab);
        console.log("closing miiverse with progprev: ", isProgramPreview);

        //Clean HTML for memory managment
        cleanMiiversePage();
        $(".miiverse-modal").hide();
        vino.requestGarbageCollect();

        top.animate(
            {
                scrollTop: top[0].scrollHeight,
                opacity: 0,
            },
            hdrAnimSp
        );

        footer.animate(
            {
                scrollTop: 0,
                opacity: 0,
            },
            hdrAnimSp
        );

        setTimeout(function () {
            headOlv.style.display = "none";
            bott.classList.remove("miiverse");

            if (isProgramPreview) {
                head2.style.display = "";
                $(det).fadeIn(190, function () {
                    disableTopBotHeaders(false);
                });
                $(".program-fulldetails-page .content").scrollLeft(
                    programPreviewScroll
                );
                bott.classList.add("prfuldet");
            } else if (isLiveTab) {
                head.style.display = "";
            }

            top.scrollTop(top[0].scrollHeight);

            top.animate(
                {
                    scrollTop: 0,
                    opacity: 1,
                },
                hdrAnimSp - 100,
                function () {
                    if (isLiveTab) {
                        cent.style.display = "";
                        $(".program-list .content").scrollTop(
                            programListScroll
                        );
                        drawLyt();
                        disableTopBotHeaders(false);
                    }
                }
            );

            footer.animate(
                {
                    scrollTop: footer[0].scrollHeight,
                    opacity: 1,
                },
                hdrAnimSp
            );
        }, hdrAnimSp);
    }

    var miiverseContainer = new tvii.makeScrollContainer(
        $(".miiverse-modal"),
        false
    );

    function setupMiiversePage() {
        vino.loading_setIconRect(360, 160, 120, 120);
        vino.loading_setIconAppear(true);
        tvii.pushStateWithQuery("scene", "olvview", true);
        cleanMiiversePage();
        $(".miiverse-modal").show();
        headOlv.querySelector("span").innerText =
            activeProgram.info.name +
            (activeProgram.info.episodeTitle &&
                activeProgram.info.episodeTitle != activeProgram.info.name
                ? ": " + activeProgram.info.episodeTitle
                : "");

        $(".miiverse-post-modal .dialog-container .popup-header").text(
            'Post about "' + activeProgram.info.name + '"'
        );
        requestPostsMiiversePage();
    }

    function parseDateWithOffset(dateString, offsetSeconds) {
        // Remove milliseconds and Z, replace T with space
        dateString = dateString.replace("T", " ").replace("Z", "");
        dateString = dateString.replace(/\.\d+$/, ""); // remove .sss if present

        var parts = dateString.split(/[- :]/);
        var year = parseInt(parts[0], 10);
        var month = parseInt(parts[1], 10) - 1; // JS months are 0-based
        var day = parseInt(parts[2], 10);
        var hour = parseInt(parts[3], 10);
        var minute = parseInt(parts[4], 10);
        var second = parseInt(parts[5], 10) || 0; // default to 0 if missing

        // Treat as UTC, then apply custom offset
        var utcTime = Date.UTC(year, month, day, hour, minute, second);
        return new Date(utcTime + offsetSeconds * 1000);
    }

    function timeAgo(dateString) {
        var offsetSeconds = tvii.profile.UTCOffset;
        // "now" also adjusted by offset
        var now = new Date(new Date().getTime() + offsetSeconds * 1000);
        var date = parseDateWithOffset(dateString, offsetSeconds);
        var diffSeconds = Math.floor((now - date) / 1000);

        if (diffSeconds < 60) {
            return "less than a minute ago";
        } else if (diffSeconds < 120) {
            return "a minute ago";
        } else if (diffSeconds < 3600) {
            return Math.floor(diffSeconds / 60) + " minutes ago";
        } else if (diffSeconds < 7200) {
            return "an hour ago";
        } else if (diffSeconds < 86400) {
            return Math.floor(diffSeconds / 3600) + " hours ago";
        } else if (diffSeconds < 172800) {
            return "a day ago";
        } else if (diffSeconds < 604800) {
            return Math.floor(diffSeconds / 86400) + " days ago";
        } else {
            var m = date.getMonth() + 1;
            var d = date.getDate();
            var y = date.getFullYear();
            var hh = date.getHours();
            var mm = date.getMinutes();
            if (m < 10) m = "0" + m;
            if (d < 10) d = "0" + d;
            if (hh < 10) hh = "0" + hh;
            if (mm < 10) mm = "0" + mm;
            return m + "/" + d + "/" + y + " " + hh + ":" + mm;
        }
    }

    function disablePostEmpathyButton(disable) {
        if (disable) {
            $(".miiverse-modal .post .yeah").addClass("disabled");
        } else {
            $(".miiverse-modal .post .yeah").removeClass("disabled");
        }
    }

    function requestPostsMiiversePage() {
        $(".miiverse-post").addClass("disabled");
        $(".miiverse-modal").html("");

        tvii.posts.requestPosts(
            100,
            ["PR" + activeProgram.info.id],
            function (posts) {
                if (!posts || !posts.length) {
                    var noPosts = $("<div>")
                        .addClass("no-posts")
                        .html(
                            "No posts for this program.<br>Make the first post about it!"
                        );
                    $(".miiverse-modal").append(noPosts);
                    $(".miiverse-post").removeClass("disabled");
                    vino.loading_setIconAppear(false);
                    return;
                }

                for (var i = 0; i < posts.length; i++) {
                    var post = posts[i];
                    var miiData = post.mii_data;
                    var postId = post.post_id;
                    var replyAmount = 0;
                    var miitooAmount = 0;
                    var feeling = post.feeling_id;
                    var feelingQ = getFeelingQueryFromPostXml(feeling);
                    var postText = post.body;
                    var painting = post.painting;
                    var screenName = post.mii_name;
                    var postDate = post.create_time;
                    var empathies = post.empathies;
                    var isSpoiler = post.is_spoiler;

                    var content = null;

                    if (postText && postText.length) {
                        content = $("<p>");
                        content.text(postText);
                    } else if (painting && painting.length) {
                        content = new Image();
                        content.classList.add("memo"); // Native way to add a class
                        content.src =
                            "https://cdn.projectrose.cafe/tvii-jp/" + painting;
                    }

                    var postEl = $("<div>").addClass("post");

                    var miiImg = new Image();
                    miiImg.src =
                        tvii.clientUrl +
                        "/api/v1/miis?width=75&expression=" +
                        feelingQ +
                        "&data=" +
                        encodeURIComponent(miiData) +
                        "&type=face";
                    var miiEl = (function () {
                        return $("<div>")
                            .addClass("mii")
                            .append(miiImg)
                            .attr("tabindex", 0)
                            .attr("navi_target", "")
                            .attr("navi_no_reset", "")
                            .on("mousedown", function () {
                                $(this).find("img").css("top", 3);
                                vino.soundPlayVolume("SE_WORD_MII", 30);
                            })
                            .on("mouseout", function () {
                                $(this).find("img").css("top", 0);
                            })
                            .on("mouseup", function () {
                                $(this).find("img").css("top", 0);
                            });
                    })();

                    var username = $("<span>")
                        .addClass("username")
                        .text(screenName);

                    var date = $("<span>")
                        .addClass("date")
                        .text(timeAgo(postDate));

                    var postCont = $("<div>").addClass("post-content");

                    var postRCont = $("<div>");
                    postRCont.addClass("content");
                    if (isSpoiler) {
                        postRCont.addClass("hidden");
                    }

                    postRCont.append(content);
                    postCont.append(postRCont);

                    var postMeta = $("<div>").addClass("post-meta");

                    //var replyCount = $("<span>").addClass("replies").text(replyAmount);

                    for (var a = 0; a < empathies.length; a++) {
                        miitooAmount++;
                    }

                    var yeahCount = $("<span>")
                        .addClass("yeahs")
                        .text(miitooAmount);

                    var hasYeahed = false;
                    for (var x = 0; x < empathies.length; x++) {
                        if (empathies[x].user_id === tvii.profile.user_id) {
                            hasYeahed = true;
                            break; // stop checking once we find a match
                        }
                    }

                    var spoilerBut = $("<button>")
                        .addClass("spoiler")
                        .attr("navi_target", "")
                        .attr("navi_no_reset", "")
                        .attr("tabindex", 0)
                        .text("Show Spoiler");

                    if (isSpoiler) {
                        (function ($spoilerbut, $postRCont) {
                            $spoilerbut.on("click", function () {
                                if (!vino.navi_getRect()) {
                                    vino.lyt_startTouchEffect();
                                }
                                vino.soundPlayVolume("SE_WAVE_OK_SUB", 30);
                                $postRCont.removeClass("hidden");
                                $spoilerbut.remove();
                            });
                        })(spoilerBut, postRCont);
                    }

                    var empathyAct = $("<button>")
                        .addClass("yeah")
                        .attr("tabindex", 0)
                        .text("Yeah!");
                    if (hasYeahed) {
                        empathyAct.text("Unyeah!");
                        empathyAct.addClass("yeahed");
                        yeahCount.addClass("added");
                    }

                    (function (id, $yeahCount, $empathyAct) {
                        empathyAct.on("click", function () {
                            if ($(this).hasClass("disabled")) return;
                            disablePostEmpathyButton(true);
                            disableTopBotHeaders(true);
                            if (!vino.navi_getRect()) {
                                vino.lyt_startTouchEffect();
                            }

                            if ($(this).hasClass("yeahed")) {
                                vino.soundPlayVolume("SE_WAVE_CANCEL", 30);
                                tvii.posts.addEmpathyToPost(
                                    true,
                                    id,
                                    function (success) {
                                        if (success) {
                                            // Always use jQuery .text() (not textContent)
                                            var current =
                                                parseInt(
                                                    $yeahCount.text(),
                                                    10
                                                ) || 0;
                                            $yeahCount.text(current - 1);
                                            $empathyAct.text("Yeah!");
                                            $empathyAct.removeClass("yeahed");
                                            $yeahCount.removeClass("added");
                                        }
                                        disablePostEmpathyButton(false);
                                        disableTopBotHeaders(false);
                                    }
                                );
                                return;
                            }

                            vino.soundPlayVolume("SE_REMOTE_FINISH2", 30);

                            tvii.posts.addEmpathyToPost(
                                false,
                                id,
                                function (success) {
                                    if (success) {
                                        // Always use jQuery .text() (not textContent)
                                        var current =
                                            parseInt($yeahCount.text(), 10) ||
                                            0;
                                        $yeahCount.text(current + 1);
                                        $empathyAct.text("Unyeah!");
                                        $empathyAct.addClass("yeahed");
                                        $yeahCount.addClass("added");
                                    }
                                    disablePostEmpathyButton(false);
                                    disableTopBotHeaders(false);
                                }
                            );
                        });
                    })(postId, yeahCount, empathyAct);

                    var jumpPost = $("<button>")
                        .addClass("jump-post")
                        .attr("tabindex", 0);
                    (function (id) {
                        jumpPost.on("click", function () {
                            if (!vino.navi_getRect()) {
                                vino.lyt_startTouchEffect();
                            }
                            vino.soundPlayVolume("SE_WAVE_OK", 30);
                            alert(
                                "This function is currently not available\nsince posts arent being crossposted\nto Miiverse for now."
                            );
                        });
                    })(postId);

                    if (isSpoiler) {
                        postCont.append(spoilerBut);
                    }

                    postMeta.append(empathyAct);
                    postMeta.append(jumpPost);
                    //postMeta.append(replyCount)
                    postMeta.append(yeahCount);

                    postCont.append(postMeta);

                    postEl.append(miiEl);
                    postEl.append(username);
                    postEl.append(date);
                    postEl.append(postCont);

                    $(".miiverse-modal").append(postEl);
                }
                setMiiverseModalNavi(false);
                vino.loading_setIconAppear(false);
                $(".miiverse-post").removeClass("disabled");
            },
            function () {
                vino.loading_setIconAppear(false);
                $(".miiverse-post").removeClass("disabled");
            }
        );
    }

    function setMiiverseModalNavi(setToModal) {
        var m = $(".miiverse-post-modal");
        var p = $(".miiverse-modal");

        var modalTargets = [
            ".feeling-buttons li input",
            ".textarea-menu-text input",
            ".textarea-text",
            ".spoiler-button",
            ".textarea-memo",
            ".dialog-buttons a",
        ];

        var postTargets = [
            ".post .yeah",
            ".post .jump-post",
            ".post .mii",
            ".post .spoiler",
        ];

        if (setToModal) {
            // Remove from posts
            for (var i = 0; i < postTargets.length; i++) {
                p.find(postTargets[i])
                    .removeAttr("navi_target")
                    .removeAttr("navi_no_reset");
            }
            // Add to modal
            for (var i = 0; i < modalTargets.length; i++) {
                m.find(modalTargets[i])
                    .attr("navi_target", "")
                    .attr("navi_no_reset", "");
            }
        } else {
            // Remove from modal
            for (var i = 0; i < modalTargets.length; i++) {
                m.find(modalTargets[i])
                    .removeAttr("navi_target")
                    .removeAttr("navi_no_reset");
            }
            // Add back to posts
            for (var i = 0; i < postTargets.length; i++) {
                p.find(postTargets[i])
                    .attr("navi_target", "")
                    .attr("navi_no_reset", "");
            }
        }
    }

    function actuallyInitHome() {
        initLiveTab();
        setMiiverseButton();
    }

    function initLiveTab() {
        disableTopBotHeaders(true);
        tvii.pushStateWithQuery("scene", "livetab", false);
        showMiiversePostPreview(false);
        $(".footer .bottom").removeClass("guideopt");
        $(".program-central").html(tvii.templates.get("prg_central"));
        //Set up template loc
        tvii.templates.setUpLocHTML();
        tvii.setUpPageTip();

        var footer = $(".footer");
        footer.scrollTop(footer[0].scrollHeight);
        vino.loading_setIconAppear(true);

        var currentTime = tvii.getLockedHourTimestamp();
        tvii.requestProgramGuide(
            currentTime,
            lineup,
            duration,
            limit,
            offset,
            function (guide) {
                setProgramDivAttribute(guide);
                total = guide.total;
                updateTabListProgram();
                setUpTitleScrollbar(programPreviewUpdate, programConfirmSel);
                window.setListenerToProgram();
                setupProgramTimer();
                setContainerPagination();
                vino.loading_setIconAppear(false);
                window.snapToClosestProgram(true);
                drawLyt();
                disableTopBotHeaders(false);
            },
            function () {
                disableTopBotHeaders(false);
                vino.loading_setIconAppear(false);
            }
        );
    }

    function initGuideTab() {
        tvii.posts.abortApiRequest();
        showMiiversePostPreview(false);
        $(".footer .bottom").addClass("guideopt");
        tvii.pushStateWithQuery("scene", "guidetab", false);
        clearInterval(window.infoUpdInterval);
        vino.lyt_reset();
        $(".program-central").html("");
        vino.requestGarbageCollect();
    }

    function initRecommendedTab() {
        tvii.posts.abortApiRequest();
        showMiiversePostPreview(false);
        $(".footer .bottom").addClass("guideopt");
        tvii.pushStateWithQuery("scene", "recomtab", false);
        clearInterval(window.infoUpdInterval);
        vino.lyt_reset();
        $(".program-central").html("");
        vino.requestGarbageCollect();
    }

    function onProgramPreviewPopstate(e) {
        var canProgramDetailsBeSeen = $(".program-fulldetails-page").is(
            ":visible"
        );
        var canMiiverseViewBeSeen = $(".miiverse-modal").is(":visible");
        if (canProgramDetailsBeSeen) {
            console.log(e.state);
        } else if (canMiiverseViewBeSeen) {
            closeMiiversePageWithAnim("pprev");
        }
    }

    function onLiveTabPopstate(e) {
        var canProgramDetailsBeSeen = $(".program-fulldetails-page").is(
            ":visible"
        );
        var canMiiverseViewBeSeen = $(".miiverse-modal").is(":visible");
        console.log(
            "live tab popstate",
            canProgramDetailsBeSeen,
            canMiiverseViewBeSeen
        );
        if (canProgramDetailsBeSeen) {
            closeProgramPageWithAnim();
        } else if (canMiiverseViewBeSeen) {
            closeMiiversePageWithAnim("livetab");
        }
    }

    function setMiiverseButton() {
        var miiverseModal = $(".miiverse-post-modal");
        var miiData = vino.act_getMiiData(tvii.userSlot);
        $(".miiverse-button").on("click", function (e) {
            if (!activeProgram) return;
            if (isHeaderButtonBlocked) return;
            if (e.originalEvent) {
                if (!vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }
                vino.soundPlayVolume("SE_POPUP_TOUCH_OFF", 30);
            } else {
                vino.soundPlayVolume("SE_POPUP", 30);
            }
            openMiiversePageWithAnim();
        });

        $(".miiverse-post").on("click", function (e) {
            if (isHeaderButtonBlocked) return;
            if ($(this).hasClass("disabled")) return;
            if (e.originalEvent) {
                if (!vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }
                vino.soundPlayVolume("SE_POST_BTN_TOUCH_OFF", 30);
            } else {
                vino.soundPlayVolume("SE_POST_BTN", 30);
            }
            setMiiverseModalNavi(true);
            miiverseModal.show();
        });

        //Back button on post modal
        miiverseModal.find(".btn-1").on("click", function (e) {
            if (isHeaderButtonBlocked) return;
            if ($(this).hasClass("disabled")) return;

            if (e.originalEvent) {
                if (!vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }
            }

            vino.soundPlayVolume("SE_WAVE_CANCEL", 30);
            miiverseModal.hide();
            setMiiverseModalNavi(false);
        });

        function lockPostModal(lock) {
            if (lock) {
                miiverseModal.find(".btn-1, .btn-2").addClass("disabled");
            } else {
                miiverseModal.find(".btn-1, .btn-2").removeClass("disabled");
            }
            miiverseModal
                .find(".post-menu")
                .css("pointer-events", lock ? "none" : "auto");
        }

        //Post button on post modal
        miiverseModal.find(".btn-2").on("click", function (e) {
            if (isHeaderButtonBlocked) return;
            if ($(this).hasClass("disabled")) return;

            if (vino.pc_getMiiverseControlLevel() === 1) {
                alert(
                    "Miiverse posting is disabled on Parental\nControls for this profile."
                );
                return;
            }

            lockPostModal(true);

            if (e.originalEvent) {
                if (!vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }
            }

            vino.soundPlayVolume("SE_WAVE_OK_SUB", 30);

            var postType = miiverseModal
                .find('input[name="_post_type"]:checked')
                .val();
            var feeling = parseInt(
                miiverseModal.find(".feeling-buttons li input:checked").val(),
                10
            );
            var isSpoiler = miiverseModal
                .find(".spoiler-button input")
                .prop("checked");
            var searchKey1 = ("PR" + activeProgram.info.id).trim();
            var searchKey2 = activeProgram.info.parentId
                ? ("PP" + activeProgram.info.parentId).trim()
                : "";
            var searchKey3 = ("CH" + activeProgram.channel.sourceId).trim();
            var searchKey4 = "vino_search_key";

            var topicTag = activeProgram.info.name;

            if (postType === "body") {
                var text = miiverseModal.find(".textarea-text-input").val();
                if (!text || !text.length) {
                    alert("Please write a message.");
                    lockPostModal(false);
                    return;
                }
                tvii.posts.sendPostToApi(
                    "text",
                    text,
                    topicTag,
                    null,
                    feeling,
                    false,
                    isSpoiler,
                    searchKey1,
                    searchKey2,
                    searchKey3,
                    searchKey4,
                    "",
                    onPostSendFinishAlt
                );
            } else {
                //var painting = vino.memo_getImageTgaCompressed();
                var painting = vino.memo_getImagePng();
                if (!painting || !painting.length) {
                    alert("Please draw something.");
                    lockPostModal(false);
                    return;
                }
                tvii.posts.sendPostToApi(
                    "memo",
                    painting,
                    topicTag,
                    null,
                    feeling,
                    false,
                    isSpoiler,
                    searchKey1,
                    searchKey2,
                    searchKey3,
                    searchKey4,
                    "",
                    onPostSendFinishAlt
                );
            }

            function onPostSendFinishAlt(isSuccess, apiResponse) {
                if (isSuccess) {
                    alert("The content you entered\nwas sent successfully.");
                    //Reset post modal
                    miiverseModal
                        .find(".feeling-buttons li:first-child input")
                        .prop("checked", true)
                        .trigger("change");
                    miiverseModal
                        .find(".feeling-buttons li")
                        .removeClass("checked");
                    miiverseModal
                        .find(".feeling-buttons li:first-child")
                        .addClass("checked");
                    miiverseModal.find(".mii img").attr("src", feelImgs[0].src);
                    miiverseModal
                        .find(".spoiler-button input")
                        .prop("checked", false)
                        .trigger("change");

                    miiverseModal
                        .find(".textarea-menu label")
                        .removeClass("checked");

                    miiverseModal
                        .find(".textarea-menu li:first-child label input")
                        .prop("checked", true)
                        .trigger("change");

                    miiverseModal
                        .find(".textarea-menu li:first-child label")
                        .addClass("checked");

                    miiverseModal
                        .find(".textarea-text-input")
                        .val("")
                        .trigger("change");
                    miiverseModal.find(".textarea-memo").hide();
                    miiverseModal.find(".textarea-text").show();
                    miiverseModal
                        .find(".textarea-memo-preview")
                        .css("background-image", "url(/img/noimg.png)");
                    vino.memo_reset();
                    lockPostModal(false);
                    miiverseModal.hide();
                    setTimeout(function () {
                        requestPostsMiiversePage();
                    }, 0);
                } else {
                    lockPostModal(false);
                }
            }
        });

        $(".textarea-text-input").on("change input", function () {
            $(".textarea-text-preview").text($(this).val());
            if ($(this).val().length != 0) {
                $(".textarea-text-preview").removeClass("placeholder");
            } else {
                $(".textarea-text-preview").addClass("placeholder");
                $(".textarea-text-preview").text(
                    $(".textarea-text-preview").attr("data-placeholder")
                );
            }
        });

        // Preload feeling images into an array
        var feelImgs = [];
        for (var i = 0; i <= 5; i++) {
            var img = new Image();
            img.src =
                tvii.clientUrl +
                "/api/v1/miis?width=68&expression=" +
                getFeelingQueryFromPostXml(i) +
                "&data=" +
                encodeURIComponent(miiData) +
                "&type=face";
            feelImgs[i] = img;
        }

        // Attach click handler
        miiverseModal
            .find(".feeling-buttons li input")
            .on("click", function () {
                if (!vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }
                vino.soundPlayVolume("SE_WAVE_MII_FACE", 30);
                $(".feeling-buttons li").removeClass("checked");
                $(this).parent().addClass("checked");

                var feelingIndex = parseInt($(this).val(), 10);

                // Swap to preloaded image src
                miiverseModal
                    .find(".mii>img")
                    .attr("src", feelImgs[feelingIndex].src);
            });

        // Set initial face to "normal" (or feeling 0 if that’s normal)
        miiverseModal
            .find(".mii>img")
            .attr(
                "src",
                tvii.clientUrl +
                "/api/v1/miis?width=68&expression=normal" +
                "&data=" +
                encodeURIComponent(miiData) +
                "&type=face"
            );

        miiverseModal
            .find(".textarea-text-preview")
            .text(
                miiverseModal
                    .find(".textarea-text-preview")
                    .attr("data-placeholder")
            );

        miiverseModal
            .find(".textarea-menu li label input")
            .on("click", function () {
                if (!vino.navi_getRect()) {
                    vino.lyt_startTouchEffect();
                }
                vino.soundPlayVolume("SE_WAVE_TOGGLE_CHECK", 30);
                $(".textarea-menu li label").removeClass("checked");
                $(this).parent().addClass("checked");

                if ($(this).val() === "body") {
                    $(".textarea-memo").hide();
                    $(".textarea-text").show();
                    $(".textarea-text-input").focus();
                    vino.wakeKeyboard();
                } else {
                    $(".textarea-text").hide();
                    $(".textarea-memo").show();
                    memoStart();
                }
            });

        miiverseModal.find(".spoiler-button input").on("click", function (e) {
            // If the actual clicked element is the input, skip the touch effect
            if (!e.originalEvent) {
                return;
            }

            if (!vino.navi_getRect()) {
                vino.lyt_startTouchEffect();
            }
        });

        miiverseModal.find(".spoiler-button input").on("change", function (e) {
            if (!e.originalEvent) return; // ignore script-triggered

            if (this.checked) {
                vino.soundPlayVolume("SE_WAVE_CHECKBOX_CHECK", 30);
            } else {
                vino.soundPlayVolume("SE_WAVE_CHECKBOX_UNCHECK", 30);
            }
        });

        function memoStart() {
            setTimeout(checkMemoResult, 100);
            vino.memo_open(false);
        }

        $(".textarea-memo-preview").on("click", function () {
            memoStart();
        });

        function checkMemoResult() {
            if (!vino.memo_isFinish()) {
                setTimeout(checkMemoResult, 100);
            } else {
                var memo_image = vino.memo_getImagePng();
                if (memo_image != "") {
                    var bgImage = "url(" + memo_image + ")";
                    miiverseModal
                        .find(".textarea-memo-preview")
                        .css("background-image", bgImage);
                }
            }
        }
    }

    //Init live tab action
    actuallyInitHome();
}

window.addEventListener("load", function () {
    tvii.initialize();
});
