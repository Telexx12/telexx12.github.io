(() => {
    const CLOSING = 1.8;
    const root = document.documentElement;
    const calm = matchMedia("(prefers-reduced-motion: reduce)");
    const shows = new Map();

    let layer, triggers;
    let current = null;
    let leaving = false;

    function init() {
        layer = document.querySelector(".views");
        triggers = [...document.querySelectorAll("[data-view]")];
        layer.querySelectorAll(".view").forEach(addShow);
        forgetStale();

        triggers.forEach((trigger) => trigger.addEventListener("click", toggle));
        layer.querySelectorAll(".view-close").forEach((button) => button.addEventListener("click", close));
        document.addEventListener("keydown", onKey);
        window.addEventListener("popstate", sync);
    }

    function addShow(view) {
        const show = gsap.timeline({ paused: true })
            .fromTo(view, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power1.out" })
            .fromTo(view.querySelectorAll(".view-title, .view-text"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "power3.out" }, 0.05)
            .fromTo(view.querySelector(".view-close"), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "back.out(2.6)" }, 0.12);

        shows.set(view, show);
    }

    function forgetStale() {
        if (history.state?.view) history.replaceState(null, "");
    }

    function toggle(e) {
        const trigger = e.currentTarget;
        if (leaving) return;
        if (trigger.dataset.view === current) return close();
        history[current ? "replaceState" : "pushState"]({ view: trigger.dataset.view }, "");
        document.dispatchEvent(new CustomEvent("story:navigate", { detail: trigger }));
        show(trigger.dataset.view);
    }

    function close() {
        if (!current || leaving) return;
        if (!history.state?.view) return show(null);
        leaving = true;
        history.back();
    }

    function sync() {
        leaving = false;
        show(history.state?.view ?? null);
    }

    function onKey(e) {
        if (e.key === "Escape") close();
    }

    function show(name) {
        if (name === current) return;
        if (current) conceal(panel(current));
        else layer.scrollIntoView({ block: "end" });
        if (name) reveal(panel(name));
        current = name;
        root.classList.toggle("is-viewing", Boolean(name));
        triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", trigger.dataset.view === name));
    }

    function reveal(view) {
        gsap.set(view, { visibility: "inherit" });
        view.focus({ preventScroll: true });
        run(shows.get(view), true);
    }

    function conceal(view) {
        if (view.contains(document.activeElement)) triggerFor(view).focus({ preventScroll: true });
        run(shows.get(view), false);
    }

    function run(show, forward) {
        if (calm.matches) show.progress(forward ? 1 : 0).pause();
        else if (forward) show.timeScale(1).play();
        else show.timeScale(CLOSING).reverse();
    }

    function panel(name) {
        return document.getElementById(`view-${name}`);
    }

    function triggerFor(view) {
        return triggers.find((trigger) => trigger.getAttribute("aria-controls") === view.id);
    }

    document.addEventListener("components:loaded", init, { once: true });
})();
