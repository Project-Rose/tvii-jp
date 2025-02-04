/* eslint-disable no-undef */
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
