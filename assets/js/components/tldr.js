(() => {
    const RECAP = 0.1;
    const FINALE = 0.7;
    const BURST = 0.06;
    const FLIGHT = 0.55;
    const FOCUS = [
        { opacity: 0.5, filter: "grayscale(0.75) blur(4px)" },
        { opacity: 0.7, filter: "grayscale(0.5) blur(3px)" },
        { opacity: 0.85, filter: "grayscale(0.25) blur(1.5px)" },
        { opacity: 1, filter: "grayscale(0) blur(0px)" },
    ];

    let section, stage, loader, face, count, dock, photo, boot;
    let arcs, links, letters, contacts;
    let state = "idle";

    function init() {
        section = document.querySelector(".tldr");
        stage = find(".tldr-stage");
        loader = find(".tldr-loader");
        face = find(".tldr-face img");
        count = find(".tldr-count");
        dock = find(".tldr-dock");
        photo = find(".tldr-photo");
        arcs = [...section.querySelectorAll(".tldr-arc")];
        links = [...section.querySelectorAll(".tldr-link")];
        letters = [...section.querySelectorAll(".tldr-name span")];
        contacts = [...section.querySelectorAll(".tldr-contact")];
        boot = gsap.timeline({ paused: true, onComplete: ready });

        hideLanding();
        addRecap();
        addFinale();
        links.forEach(addLink);

        ScrollTrigger.create({ trigger: section, start: "top center", onLeaveBack: skip });
        links.forEach((link) => link.addEventListener("click", go));
        stage.addEventListener("click", skip);
        document.addEventListener("keydown", onKey);
        document.addEventListener("story:arrived", arrive, { once: true });
    }

    function hideLanding() {
        gsap.set(links, { autoAlpha: 0 });
        gsap.set(dock, { "--frame": 0 });
    }

    function addRecap() {
        boot.fromTo(loader, { scale: 0.85 }, { scale: 1, duration: 0.35, ease: "back.out(3)" }, 0)
            .call(pulse, [loader], 0);
        arcs.forEach((arc, i) => {
            const at = 0.1 + i * RECAP;

            boot.to(arc, { "--fill": 1, duration: 0.3, ease: "power2.out" }, at)
                .to(face, { ...FOCUS[i], duration: 0.3 }, at)
                .set(count, { textContent: i + 1 }, at + 0.3);
        });
    }

    function addFinale() {
        boot.to(find(".tldr-ring"), { "--gap": 0, duration: 0.3, ease: "power2.out" }, FINALE)
            .to(find(".tldr-loading"), { autoAlpha: 0, duration: 0.2 }, FINALE)
            .to(find(".tldr-done"), { autoAlpha: 1, duration: 0.2 }, FINALE + 0.1)
            .call(announceLoaded, null, FINALE + 0.15)
            .to(loader, { scale: 2.6, autoAlpha: 0, duration: 0.5, ease: "power3.in" }, FINALE + 0.35)
            .to(find(".tldr-face"), { autoAlpha: 0, scale: 0.7, duration: 0.2, ease: "power2.in" }, FINALE + 0.35)
            .to(find(".tldr-done"), { autoAlpha: 0, y: -10, duration: 0.2 }, FINALE + 0.6)
            .fromTo(photo, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.75, ease: "power3.out" }, FINALE + 0.5)
            .fromTo(letters, { autoAlpha: 0, yPercent: 60, rotation: -8 }, { autoAlpha: 1, yPercent: 0, rotation: 0, duration: 0.55, stagger: 0.07, ease: "back.out(1.8)" }, FINALE + 0.55)
            .to(dock, { "--frame": 1, duration: 0.45, ease: "power2.out" }, FINALE + 0.6)
            .fromTo(contacts, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.4, stagger: 0.08, ease: "back.out(2.6)" }, FINALE + 0.95);
    }

    function addLink(link, i) {
        const at = FINALE + 0.4 + i * BURST;
        const landed = at + FLIGHT;

        boot.set(link, { x: () => fromLoader(link).x, y: () => fromLoader(link).y, scale: 0.4, autoAlpha: 1 }, at)
            .to(link, { x: 0, duration: FLIGHT, ease: "power2.out" }, at)
            .to(link, { y: 0, duration: FLIGHT, ease: "power3.in" }, at)
            .to(link, { scale: 1, duration: FLIGHT, ease: "power1.out" }, at)
            .call(pulse, [link.querySelector(".tldr-tile")], landed)
            .fromTo(link, { scaleX: 1.2, scaleY: 0.75 }, { scaleX: 1, scaleY: 1, duration: 0.35, ease: "back.out(3)", immediateRender: false }, landed);
    }

    function arrive(e) {
        state = "booting";
        boot.play();
        if (e.detail === "instant" || matchMedia("(prefers-reduced-motion: reduce)").matches) skip();
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

    function pulse(from) {
        document.dispatchEvent(new CustomEvent("story:phase", { detail: from }));
    }

    function announceLoaded() {
        document.dispatchEvent(new CustomEvent("story:loaded", { detail: loader }));
    }

    function go(e) {
        const link = e.currentTarget;
        e.preventDefault();
        document.dispatchEvent(new CustomEvent("story:navigate", { detail: link.querySelector(".tldr-tile") }));
        window.scrollTo({ top: document.querySelector(link.hash).offsetTop, behavior: "smooth" });
    }

    function onKey(e) {
        if (e.key === "Escape" || (e.key === "Enter" && !e.target.closest("button"))) skip();
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
