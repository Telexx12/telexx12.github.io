(() => {
    const TRAVEL = 0.45;
    const READ = 1;
    const DWELL = 0.5;
    const HURRY_KEYS = ["Escape", "Enter", " ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"];
    const root = document.documentElement;
    const page = document.scrollingElement;
    const actions = {
        theme: () => { root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark"; },
        lang: () => window.I18n.set(root.lang === "en" ? "hu" : "en").then(() => ScrollTrigger.refresh()),
    };

    let story, rail, track, nodes, sections, trace, step, journey;
    let starts = [];
    let away = { from: Infinity, to: Infinity };
    let frame = 0;
    let shown = -1;
    let traveling = false;

    function init() {
        story = document.querySelector(".boot-story");
        rail = story.querySelector(".boot-rail");
        track = rail.querySelector(".rail-track");
        nodes = [...rail.querySelectorAll(".rail-node")];
        sections = [...story.querySelectorAll(".boot-sections > section")];
        trace = story.querySelector(".bar-trace");
        step = trace.querySelector(".bar-step");

        story.addEventListener("click", runAction);
        nodes.forEach((node, i) => node.addEventListener("click", () => scrollPage(starts[i])));
        track.addEventListener("pointerdown", drag);
        window.addEventListener("scroll", scheduleUpdate);
        document.addEventListener("story:opened", start, { once: true });
        new ResizeObserver(layout).observe(story);
    }

    function layout() {
        const hidden = story.querySelector('.boot-sections > [data-rail="off"]');
        const max = maxScroll();
        starts = sections.map(stationTop);
        away = { from: hidden.offsetTop - page.clientHeight / 2, to: hidden.offsetTop + hidden.offsetHeight - page.clientHeight / 2 };

        const room = Math.min(nodes[0].offsetHeight, track.clientHeight / (nodes.length - 1));
        const gap = (room / track.clientHeight) * 100;
        let previous = -Infinity;
        nodes.forEach((node, i) => {
            previous = Math.max((starts[i] / max) * 100, previous + gap);
            node.style.top = previous + "%";
        });

        update();
    }

    function update() {
        frame = 0;
        const top = page.scrollTop;
        const max = maxScroll();
        const progress = Math.min(1, top / max);
        let current = 0;
        starts.forEach((start, i) => { if (top >= start - 2) current = i; });

        rail.classList.toggle("is-away", !traveling && top >= away.from && top < away.to);
        rail.style.setProperty("--progress", (progress * 100).toFixed(2) + "%");
        nodes.forEach((node, i) => {
            node.classList.toggle("is-passed", i <= current);
            node.classList.toggle("is-current", i === current);
        });
        if (current !== shown) showStep(current);
    }

    function showStep(i) {
        shown = i;
        step.textContent = nodes[i].dataset.step;
        if (traveling) light(i);
    }

    function light(i) {
        gsap.fromTo(nodes[i], { scale: 0.3 }, { scale: 1, duration: 0.5, ease: "back.out(3)", clearProps: "transform" });
        gsap.fromTo(step, { y: 6, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: "power2.out" });
        document.dispatchEvent(new CustomEvent("story:phase", { detail: nodes[i].firstElementChild }));
    }

    function scheduleUpdate() {
        frame ||= requestAnimationFrame(update);
    }

    function start(e) {
        if (e.detail === "instant" || matchMedia("(prefers-reduced-motion: reduce)").matches) land();
        else travel();
        rail.classList.add("is-visible");
        trace.classList.add("is-visible");
    }

    function land() {
        page.scrollTop = stationTop(sections.at(-1));
        update();
        arrive();
    }

    function travel() {
        traveling = true;
        root.classList.add("is-traveling");
        gsap.set(step, { autoAlpha: 0 });
        journey = gsap.timeline({ onComplete: arrive });
        sections.forEach(addStop);
        journey.call(light, [0], 0.35);
        window.addEventListener("wheel", hurry, { passive: true });
        window.addEventListener("touchmove", hurry, { passive: true });
        window.addEventListener("keydown", hurryKey);
        window.addEventListener("click", hurry);
    }

    function addStop(section, i) {
        if (i > 0) journey.to(page, { scrollTop: () => stationTop(section), duration: TRAVEL, ease: "power2.inOut" });
        if (section.offsetHeight > page.clientHeight * 1.25) journey.to(page, { scrollTop: () => section.offsetTop + section.offsetHeight - page.clientHeight, duration: READ, ease: "power1.inOut" });
        if (i < sections.length - 1) journey.to({}, { duration: DWELL });
    }

    function hurry(e) {
        if (e.target.closest(".boot-bar")) return;
        journey.progress(1, true);
        arrive("instant");
    }

    function hurryKey(e) {
        if (!HURRY_KEYS.includes(e.key) || e.target.closest(".boot-bar")) return;
        e.preventDefault();
        hurry(e);
    }

    function arrive(detail) {
        window.removeEventListener("wheel", hurry);
        window.removeEventListener("touchmove", hurry);
        window.removeEventListener("keydown", hurryKey);
        window.removeEventListener("click", hurry);
        root.classList.remove("is-traveling");
        document.dispatchEvent(new CustomEvent("story:arrived", { detail }));
        gsap.delayedCall(0.6, settle);
    }

    function settle() {
        traveling = false;
        update();
    }

    function stationTop(section) {
        return Math.min(section.offsetTop, maxScroll());
    }

    function maxScroll() {
        return page.scrollHeight - page.clientHeight;
    }

    function scrollPage(top) {
        window.scrollTo({ top, behavior: "smooth" });
    }

    function runAction(e) {
        const el = e.target.closest("[data-action]");
        if (!el) return;
        actions[el.dataset.action]();
        if (e.detail) el.blur();
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
