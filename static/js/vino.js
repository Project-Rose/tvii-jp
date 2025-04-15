/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-undef */
function setLoadingScreenBG() {
    if (
        vino.title_getImageCount() >= 1 &&
        !vino.title_hasImage("vino_blue") &&
        !vino.title_hasImage("vino_orange") &&
        !vino.title_hasImage("vino_pink")
    ) {
        vino.title_clearImage();
        vino.title_setFixedImage(
            window.location.origin + "/img/title/blue.png",
            "vino_blue",
            "",
            "",
            "",
            2
        );
        vino.title_setFixedImage(
            window.location.origin + "/img/title/orange.png",
            "vino_orange",
            "",
            "",
            "",
            2
        );
        vino.title_setFixedImage(
            window.location.origin + "/img/title/pink.png",
            "vino_pink",
            "",
            "",
            "",
            2
        );
    }
}

document.addEventListener("DOMContentLoaded", function () {
    document
        .querySelector(".exit-button")
        .addEventListener("click", function () {
            if (window.vino) {
                vino.soundPlay("SE_COMMON_FINISH_TOUCH_OFF");
                vino.exit();
            } else {
                alert("Exit app");
            }
        });
});

window.addEventListener("load", function () {
    setLoadingScreenBG();
});
