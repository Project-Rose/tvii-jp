/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-undef */
var tvii = {
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
    setLoadingScreenBG: function () {
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
    }
}

window.addEventListener("load", function () {
    tvii.setLoadingScreenBG();

    (function () {
        var container = document.getElementsByClassName("error-container")[0];
        var isDown = false;
        var startX, startY, scrollLeft, scrollTop;
        var velX = 0, velY = 0;
        var lastX = 0, lastY = 0;
        var inertiaTimer;

        function clearInertia() {
            if (inertiaTimer) {
                clearInterval(inertiaTimer);
                inertiaTimer = null;
            }
        }

        container.onmousedown = function (e) {
            isDown = true;
            startX = e.clientX;
            startY = e.clientY;
            scrollLeft = container.scrollLeft;
            scrollTop = container.scrollTop;
            lastX = e.clientX;
            lastY = e.clientY;
            clearInertia();
            container.style.cursor = "grabbing";
            return false;
        };

        document.onmousemove = function (e) {
            if (!isDown) return;
            var dx = e.clientX - startX;
            var dy = e.clientY - startY;
            container.scrollLeft = scrollLeft - dx;
            container.scrollTop = scrollTop - dy;

            velX = e.clientX - lastX;
            velY = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;
        };

        document.onmouseup = function () {
            if (!isDown) return;
            isDown = false;
            container.style.cursor = "grab";

            // inertia effect
            inertiaTimer = setInterval(function () {
                container.scrollLeft -= velX;
                container.scrollTop -= velY;

                velX *= 0.9; // friction
                velY *= 0.9;

                if (Math.abs(velX) < 0.5 && Math.abs(velY) < 0.5) {
                    clearInertia();
                }
            }, 16); // ~60fps
        };
    })();

    document
        .querySelector(".exit")
        .addEventListener("click", function () {
            this.classList.add("hover");
            vino.soundPlayVolume("SE_COMMON_TOUCH_ON", 30);
            setTimeout(function () {
                vino.soundPlayVolume("SE_COMMON_FINISH_TOUCH_OFF", 30);
                vino.exit();
            }, 50)
        });
});
