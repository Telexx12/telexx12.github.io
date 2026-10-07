(() => {
    const LENGTH = 13;
    const START = 0.6;
    const STEP = 3.2;
    const FOCUS = [
        { opacity: 0.45, filter: "grayscale(0.67) blur(4px)" },
        { opacity: 0.75, filter: "grayscale(0.33) blur(2px)" },
        { opacity: 1, filter: "grayscale(0) blur(0px)" },
    ];

    let section, tl, arcs, cards, browser, button;

    function init() {
        gsap.registerPlugin(ScrollTrigger);
        section = document.querySelector(".studies");
        arcs = [...section.querySelectorAll(".studies-ring g")];
        cards = [...section.querySelectorAll(".service")];
        browser = find(".browser");
        button = document.querySelector(".home-fetch");
        tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
                trigger: section,
                start: "top top",
                end: "bottom bottom",
                scrub: true,
                pin: find(".studies-stage"),
                pinSpacing: false,
                invalidateOnRefresh: true,
            },
        });

        hideBrowser();
        cards.forEach(addService);
        addBooted();
        addRest();

        document.addEventListener("story:open", open, { once: true });
    }

    function hideBrowser() {
        gsap.set(browser, { autoAlpha: 0 });
    }

    function open(e) {
        const opening = gsap.timeline({ defaults: { ease: "power2.inOut" }, onComplete: opened })
          .set(browser, { autoAlpha: 1 })
          .fromTo(browser, { scale: 0.03, xPercent: buttonX, yPercent: buttonY }, { scale: 1, xPercent: 0, yPercent: 0, duration: 1 }, 0)
          .fromTo(find(".browser-loading"), { scaleX: 0 }, { scaleX: 1, duration: 0.75, ease: "none" }, 0.15)
          .to(browser, { borderRadius: 0, "--edge": 0, duration: 0.15, ease: "none" }, 0.85)
          .to(find(".browser-bar"), { yPercent: -110, duration: 0.3 }, 1.05);

        if (e.detail === "instant") opening.progress(1);
    }

    function opened() {
        document.dispatchEvent(new Event("story:opened"));
    }

    function addService(card, i) {
        const at = START + i * STEP;

        register(card, i, at);
        boot(card, i, at + 0.6);
    }

    function register(card, i, at) {
        tl.set([arcs[i], card], { attr: { "data-state": "registered" } }, at);
    }

    function boot(card, i, at) {
        tl.set([arcs[i], card], { attr: { "data-state": "booting" } }, at)
          .to(arcs[i].querySelector(".ring-fill"), { "--fill": 1, duration: 2.2 }, at)
          .to(find(".studies-face img"), { ...FOCUS[i], duration: 2.2 }, at)
          .set([arcs[i], card], { attr: { "data-state": "booted" } }, at + 2.2)
          .set(find(".studies-count"), { textContent: i + 1 }, at + 2.2);
    }

    function addBooted() {
        const at = START + cards.length * STEP;

        tl.set(find(".studies-stage"), { attr: { "data-state": "done" } }, at)
          .to(find(".studies-ring"), { "--gap": 0, duration: 0.8 }, at + 0.2)
          .to(find(".studies-loading"), { autoAlpha: 0, duration: 0.4 }, at + 0.6)
          .to(find(".studies-done"), { autoAlpha: 1, y: 0, duration: 0.6 }, at + 1);
    }

    function addRest() {
        tl.to({}, { duration: LENGTH - tl.duration() });
    }

    function buttonX() {
        const b = button.getBoundingClientRect();
        return ((b.left + b.width / 2) / browser.offsetWidth - 0.5) * 100;
    }

    function buttonY() {
        const b = button.getBoundingClientRect();
        return ((b.top + b.height / 2) / browser.offsetHeight - 0.5) * 100;
    }

    function find(selector) {
        return section.querySelector(selector);
    }

    document.addEventListener("components:loaded", init, { once: true });
})();
