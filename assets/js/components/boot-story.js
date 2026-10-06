(() => {
    const DURATION = 40;
    const INTERRUPTS = ["wheel", "touchstart", "keydown", "pointerdown"];
    const root = document.documentElement;
    const page = document.scrollingElement;
    const actions = {
        play,
        end: () => scrollPage(page.scrollHeight),
        start: () => scrollPage(0),
        theme: () => { root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark"; },
        lang: (el) => window.I18n.set(el.dataset.lang),
    };

    let story, rail, track, nodes;
    let starts = [];
    let frame = 0;
    let autoplay = 0;

    function init() {
        story = document.querySelector(".boot-story");
        rail = story.querySelector(".boot-rail");
        track = rail.querySelector(".rail-track");
        nodes = [...rail.querySelectorAll(".rail-node")];

        story.addEventListener("click", runAction);
        nodes.forEach((node, i) => node.addEventListener("click", () => scrollPage(starts[i], "smooth")));
        track.addEventListener("pointerdown", drag);
        window.addEventListener("scroll", scheduleUpdate, { passive: true });
        new ResizeObserver(layout).observe(story);
    }

    function layout() {
        starts = [];
        let top = 0;
        story.querySelectorAll(".boot-sections > section").forEach((section) => {
            const offsets = (section.dataset.railStops ?? "0").split(" ").map(Number);
            offsets.forEach((offset) => starts.push(top + (offset / 100) * page.clientHeight));
            top += section.offsetHeight;
        });

        const max = maxScroll();
        const room = Math.min(nodes[0].offsetHeight, track.clientHeight / (nodes.length - 1));
        const gap = (room / track.clientHeight) * 100;
        let previous = -Infinity;
        nodes.forEach((node, i) => {
            previous = Math.max(max > 0 ? (starts[i] / max) * 100 : 0, previous + gap);
            node.style.top = previous + "%";
        });

        update();
    }

    function update() {
        frame = 0;
        const top = page.scrollTop;
        const max = maxScroll();
        const progress = max > 0 ? Math.min(1, top / max) : 0;
        let current = 0;
        starts.forEach((start, i) => { if (top >= start - 2) current = i; });

        rail.classList.toggle("is-visible", top > page.clientHeight / 2);
        rail.style.setProperty("--progress", (progress * 100).toFixed(2) + "%");
        nodes.forEach((node, i) => {
            node.classList.toggle("is-passed", i <= current);
            node.classList.toggle("is-current", i === current);
        });
    }

    function scheduleUpdate() {
        frame ||= requestAnimationFrame(update);
    }

    function maxScroll() {
        return page.scrollHeight - page.clientHeight;
    }

    function scrollPage(top, behavior = "instant") {
        stop();
        window.scrollTo({ top, behavior });
    }

    function play() {
        stop();
        const max = maxScroll();
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return scrollPage(max);
        if (page.scrollTop >= max - 2) scrollPage(0);

        const speed = max / DURATION;
        let position = page.scrollTop;
        let last = performance.now();

        const step = (now) => {
            position += (speed * (now - last)) / 1000;
            last = now;
            page.scrollTop = Math.min(position, max);
            if (position >= max) return stop();
            autoplay = requestAnimationFrame(step);
        };

        autoplay = requestAnimationFrame(step);
        setTimeout(() => {
            if (autoplay) INTERRUPTS.forEach((type) => story.addEventListener(type, stop, { passive: true }));
        });
    }

    function stop() {
        if (!autoplay) return;
        cancelAnimationFrame(autoplay);
        autoplay = 0;
        INTERRUPTS.forEach((type) => story.removeEventListener(type, stop));
    }

    function runAction(e) {
        const el = e.target.closest("[data-action]");
        if (!el || !actions[el.dataset.action]) return;
        e.preventDefault();
        actions[el.dataset.action](el);
    }

    function drag(e) {
        if (e.target.closest(".rail-node")) return;
        e.preventDefault();
        stop();
        seek(e);
        window.addEventListener("pointermove", seek);
        window.addEventListener("pointerup", release);
        window.addEventListener("pointercancel", release);
    }

    function seek(e) {
        const rect = track.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
        page.scrollTop = p * maxScroll();
    }

    function release() {
        window.removeEventListener("pointermove", seek);
        window.removeEventListener("pointerup", release);
        window.removeEventListener("pointercancel", release);
    }

    document.addEventListener("components:loaded", init, { once: true });
})();
