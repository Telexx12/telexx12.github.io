(() => {
    const root = document.documentElement;
    const page = document.scrollingElement;
    const actions = {
        end: () => scrollPage(page.scrollHeight),
        theme: () => { root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark"; },
        lang: () => window.I18n.set(root.lang === "en" ? "hu" : "en").then(() => ScrollTrigger.refresh()),
    };

    let story, rail, track, nodes;
    let starts = [];
    let frame = 0;

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
        story.querySelectorAll(".boot-sections > section").forEach((section) => {
            const offsets = (section.dataset.railStops ?? "0").split(" ").map(Number);
            offsets.forEach((offset) => starts.push(section.offsetTop + (offset / 100) * page.clientHeight));
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
        window.scrollTo({ top, behavior });
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
