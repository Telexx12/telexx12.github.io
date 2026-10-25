(() => {
    const LEG = 1.2;
    const CALM = 0.25;
    const SIGHT = "-1px 0px";
    const REDUCED = "(prefers-reduced-motion: reduce)";
    const HURRY_KEYS = ["Escape", "Enter", " ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"];
    const root = document.documentElement;
    const page = document.scrollingElement;
    const actions = {
        theme: () => { root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark"; },
        lang: () => window.I18n.set(root.lang === "en" ? "hu" : "en").then(() => ScrollTrigger.refresh()),
    };

    let story, sections, thread, journey, calm;

    function init() {
        story = document.querySelector(".boot-story");
        sections = [...story.querySelectorAll(".boot-sections > section")];
        thread = story.querySelector(".bar-thread");

        addProgress();
        watchLanding();
        watchSight();
        story.addEventListener("click", runAction);
        story.addEventListener("click", navigate);
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
        ScrollTrigger.create({ trigger: sections.at(-1), endTrigger: story, start: "top center", toggleClass: { targets: thread, className: "is-away" } });
    }

    function watchSight() {
        const observer = new IntersectionObserver(rest, { rootMargin: SIGHT });

        story.querySelectorAll("section").forEach((section) => observer.observe(section));
    }

    function rest(entries) {
        entries.forEach((entry) => entry.target.classList.toggle("is-resting", !entry.isIntersecting));
    }

    function start(e) {
        thread.classList.add("is-visible");
        if (e.detail === "instant" || matchMedia(REDUCED).matches) land();
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
        if (calm) calm.kill();
        calm = gsap.delayedCall(CALM, arrive, ["instant"]);
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

    function navigate(e) {
        const link = e.target.closest("a[href^='#']");
        const target = link && link.hash && document.getElementById(link.hash.slice(1));
        if (!target || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        document.dispatchEvent(new CustomEvent("story:navigate", { detail: link }));
        target.scrollIntoView({ behavior: matchMedia(REDUCED).matches ? "auto" : "smooth" });
        target.focus({ preventScroll: true });
    }

    document.addEventListener("components:loaded", init, { once: true });
})();
