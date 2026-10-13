(() => {
    const LEG = 1.8;
    const HURRY_KEYS = ["Escape", "Enter", " ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"];
    const root = document.documentElement;
    const page = document.scrollingElement;
    const actions = {
        theme: () => { root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark"; },
        lang: () => window.I18n.set(root.lang === "en" ? "hu" : "en").then(() => ScrollTrigger.refresh()),
    };

    let story, sections, thread, journey;

    function init() {
        story = document.querySelector(".boot-story");
        sections = [...story.querySelectorAll(".boot-sections > section")];
        thread = story.querySelector(".bar-thread");

        addProgress();
        watchLanding();
        story.addEventListener("click", runAction);
        document.addEventListener("story:opened", start, { once: true });
    }

    function addProgress() {
        gsap.to(thread, {
            "--progress": 1,
            ease: "none",
            scrollTrigger: { trigger: story.querySelector(".boot-sections"), start: "top top", end: "bottom bottom", scrub: true },
        });
    }

    function watchLanding() {
        ScrollTrigger.create({ trigger: sections.at(-1), start: "top center", toggleClass: { targets: thread, className: "is-away" } });
    }

    function start(e) {
        thread.classList.add("is-visible");
        if (e.detail === "instant" || matchMedia("(prefers-reduced-motion: reduce)").matches) land();
        else travel();
    }

    function land() {
        page.scrollTop = stationTop(sections.at(-1));
        arrive();
    }

    function travel() {
        const intro = Thread.claim(sections[0]);

        root.classList.add("is-traveling");
        journey = gsap.timeline({ onComplete: arrive });
        if (intro) journey.add(intro.paused(false));
        sections.slice(1).forEach(addLeg);
        window.addEventListener("wheel", hurry, { passive: true });
        window.addEventListener("touchmove", hurry, { passive: true });
        window.addEventListener("keydown", hurryKey);
        window.addEventListener("click", hurry);
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
    }

    function addLeg(section) {
        journey.to(page, { scrollTop: () => stationTop(section), duration: LEG, ease: "sine.inOut" });
    }

    function stationTop(section) {
        return Math.min(section.offsetTop, page.scrollHeight - page.clientHeight);
    }

    function runAction(e) {
        const el = e.target.closest("[data-action]");
        if (!el) return;
        actions[el.dataset.action]();
        if (e.detail) el.blur();
    }

    document.addEventListener("components:loaded", init, { once: true });
})();
