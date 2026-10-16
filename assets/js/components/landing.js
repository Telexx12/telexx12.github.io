(() => {
    const WRAP = 0.75;
    const BURST = 0.05;
    const FLIGHT = 0.45;
    const REDUCED = "(prefers-reduced-motion: reduce)";
    const FOCUS = [
        { opacity: 0.6, filter: "grayscale(0.66) blur(3.5px)" },
        { opacity: 0.8, filter: "grayscale(0.33) blur(2px)" },
        { opacity: 1, filter: "grayscale(0) blur(0px)" },
    ];

    let section, stage, loader, face, dock, photo, figure, boot;
    let links, letters, contacts;
    let state = "idle";

    function init() {
        section = document.querySelector(".tldr");
        stage = find(".tldr-stage");
        loader = find(".tldr-loader");
        face = find(".tldr-face img");
        dock = find(".tldr-dock");
        photo = find(".tldr-photo");
        figure = find(".tldr-figure");
        links = [...section.querySelectorAll(".tldr-link")];
        letters = [...section.querySelectorAll(".tldr-name span")];
        contacts = [...section.querySelectorAll(".tldr-contact")];
        boot = gsap.timeline({ paused: true, onComplete: ready });

        hideLanding();
        addWrap();
        addFinale();
        links.forEach(addLink);

        ScrollTrigger.create({ trigger: section, start: "top bottom", onLeaveBack: reset });
        ScrollTrigger.create({ trigger: section, endTrigger: document.body, start: "top center", toggleClass: { targets: dock, className: "is-shown" } });
        stage.addEventListener("click", tap);
        document.addEventListener("keydown", onKey);
        document.addEventListener("thread:landed", land);
        document.addEventListener("story:arrived", arrive, { once: true });
    }

    function hideLanding() {
        gsap.set(links, { autoAlpha: 0 });
        gsap.set(dock, { "--frame": 0 });
    }

    function addWrap() {
        boot.call(pulse, [loader], 0)
            .fromTo(find(".tldr-arc"), { "--fill": 0 }, { "--fill": 1, duration: WRAP, ease: "none" }, 0);
        FOCUS.forEach(addFocus);
    }

    function addFocus(focus, i) {
        const step = WRAP / FOCUS.length;

        boot.to(face, { ...focus, duration: step, ease: "none" }, i * step);
    }

    function addFinale() {
        boot.to(find(".tldr-done"), { autoAlpha: 1, duration: 0.15 }, WRAP)
            .call(announceLoaded, null, WRAP + 0.1)
            .to(loader, { scale: 2.6, autoAlpha: 0, duration: 0.4, ease: "power3.in" }, WRAP + 0.25)
            .to(find(".tldr-face"), { autoAlpha: 0, scale: 0.7, duration: 0.15, ease: "power2.in" }, WRAP + 0.25)
            .to(find(".tldr-done"), { autoAlpha: 0, y: -10, duration: 0.15 }, WRAP + 0.45)
            .fromTo(photo, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "power3.out" }, WRAP + 0.4)
            .fromTo(figure, { "--rise": 0 }, { "--rise": 1, duration: 0.9, ease: "power2.out" }, WRAP + 0.3)
            .fromTo(letters, { autoAlpha: 0, yPercent: 60, rotation: -8 }, { autoAlpha: 1, yPercent: 0, rotation: 0, duration: 0.45, stagger: 0.05, ease: "back.out(1.8)" }, WRAP + 0.45)
            .to(dock, { "--frame": 1, duration: 0.35, ease: "power2.out" }, WRAP + 0.5)
            .fromTo(contacts, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.35, stagger: 0.06, ease: "back.out(2.6)" }, WRAP + 0.75);
    }

    function addLink(link, i) {
        const at = WRAP + 0.3 + i * BURST;
        const landed = at + FLIGHT;

        boot.set(link, { x: () => fromLoader(link).x, y: () => fromLoader(link).y, scale: 0.4, autoAlpha: 1 }, at)
            .to(link, { x: 0, duration: FLIGHT, ease: "power2.out" }, at)
            .to(link, { y: 0, duration: FLIGHT, ease: "power3.in" }, at)
            .to(link, { scale: 1, duration: FLIGHT, ease: "power1.out" }, at)
            .call(pulse, [link.querySelector(".tldr-tile")], landed)
            .fromTo(link, { scaleX: 1.2, scaleY: 0.75 }, { scaleX: 1, scaleY: 1, duration: 0.3, ease: "back.out(3)", immediateRender: false }, landed);
    }

    function land(e) {
        if (e.detail === loader) start();
    }

    function arrive(e) {
        start(e.detail === "instant");
    }

    function start(instant) {
        if (state === "idle") play();
        if (instant || matchMedia(REDUCED).matches) skip();
    }

    function tap() {
        if (state === "idle") start();
        else skip();
    }

    function play() {
        state = "booting";
        boot.restart();
    }

    function skip() {
        if (state !== "booting") return;
        boot.progress(1, true);
        ready();
    }

    function ready() {
        state = "ready";
        stage.dataset.state = state;
        gsap.set(links, { clearProps: "transform" });
    }

    function reset() {
        if (state === "idle") return;
        state = "idle";
        boot.progress(0, true).pause().invalidate();
        stage.dataset.state = "booting";
    }

    function pulse(from) {
        document.dispatchEvent(new CustomEvent("story:phase", { detail: from }));
    }

    function announceLoaded() {
        stage.dataset.state = "loaded";
        document.dispatchEvent(new CustomEvent("story:loaded", { detail: loader }));
    }

    function onKey(e) {
        if (e.key === "Escape" || (e.key === "Enter" && !e.target.closest("a, button"))) skip();
    }

    function fromLoader(link) {
        const from = loader.getBoundingClientRect();
        const to = link.getBoundingClientRect();
        return { x: from.left + from.width / 2 - to.left - to.width / 2, y: from.top + from.height / 2 - to.top - to.height / 2 };
    }

    function find(selector) {
        return section.querySelector(selector);
    }

    document.addEventListener("components:loaded", init, { once: true });
})();
