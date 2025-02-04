/* eslint-disable @typescript-eslint/explicit-function-return-type */
document.addEventListener("DOMContentLoaded", function () {
    var container = document.querySelector(".program-list .content");
    var thumb = document.querySelector(".program-list .scrollbar .thumb");

    var minThumbTop = 20; // Minimum thumb position
    var maxThumbTop = 225; // Maximum thumb position

    function updateThumbPosition() {
        var maxScroll = container.scrollHeight - container.clientHeight;
        var scrollRatio = container.scrollTop / maxScroll;
        var newTop = minThumbTop + scrollRatio * (maxThumbTop - minThumbTop);
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
});
