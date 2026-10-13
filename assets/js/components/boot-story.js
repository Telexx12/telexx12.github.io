(() => {
    const LEG = 1.8;
    const STEPS = ["ServiceProvider::boot()", "Router::dispatch()", "Middleware::handle()", "Response::send()"];
    const HURRY_KEYS = ["Escape", "Enter", " ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"];
    const root = document.documentElement;
    const page = document.scrollingElement;
    const actions = {
        theme: () => { root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark"; },
        lang: () => window.I18n.set(root.lang === "en" ? "hu" : "en").then(() => ScrollTrigger.refresh()),
    };

    let story, sections, trace, step, thread, journey;

    function init() {
        story = document.querySelector(".boot-story");
        sections = [...story.querySelectorAll(".boot-sections > section")];
        trace = story.querySelector(".bar-trace");
        step = trace.querySelector(".bar-step");
        thread = story.querySelector(".bar-thread");

        step.textContent = STEPS[0];
        addProgress();
        sections.forEach(watchStep);
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

    function watchStep(section, i) {
        ScrollTrigger.create({ trigger: section, start: "top center", end: "bottom center", onToggle: (self) => self.isActive && showStep(i) });
    }

    function showStep(i) {
        if (step.textContent === STEPS[i]) return;
        step.textContent = STEPS[i];
        gsap.fromTo(step, { y: 6, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: "power2.out" });
    }

    function start(e) {
        trace.classList.add("is-visible");
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
