window.Track = (() => {
    const queue = [];
    const seen = new Set();

    function init() {
        document.addEventListener("click", click);
        window.addEventListener("load", flush);
    }

    function click(e) {
        const el = e.target.closest("[data-track]");
        if (el) event(el.dataset.track);
    }

    function event(name, data) {
        if (window.umami) window.umami.track(name, data);
        else queue.push([name, data]);
    }

    function once(name, data) {
        if (seen.has(name)) return;
        seen.add(name);
        event(name, data);
    }

    function flush() {
        if (!window.umami) return;
        queue.splice(0).forEach(([name, data]) => window.umami.track(name, data));
    }

    init();
    return { event, once };
})();
