(() => {
    const REDUCED = "(prefers-reduced-motion: reduce)";

    let section, browser, button;

    function init() {
        section = document.querySelector(".studies");
        browser = find(".browser");
        button = document.querySelector(".home-fetch");

        document.addEventListener("story:open", open, { once: true });
    }

    function open(e) {
        const opening = gsap.timeline({ defaults: { ease: "power2.inOut" }, onComplete: opened, onCompleteParams: [e.detail] })
          .set(browser, { autoAlpha: 1 })
          .fromTo(browser, { scale: 0.03, xPercent: buttonX, yPercent: buttonY }, { scale: 1, xPercent: 0, yPercent: 0, duration: 1 }, 0)
          .fromTo(find(".browser-loading"), { scaleX: 0 }, { scaleX: 1, duration: 0.75, ease: "none" }, 0.15)
          .to(browser, { borderRadius: 0, "--edge": 0, duration: 0.15, ease: "none" }, 0.85)
          .to(find(".browser-bar"), { yPercent: -110, duration: 0.3 }, 1.05);

        if (e.detail === "instant" || matchMedia(REDUCED).matches) opening.progress(1);
    }

    function opened(detail) {
        document.dispatchEvent(new CustomEvent("story:opened", { detail }));
        gsap.to(browser, { "--fill": 0, duration: 0.5, ease: "none" });
    }

    function buttonX() {
        const b = button.getBoundingClientRect();
        return ((b.left + b.width / 2 - browser.offsetLeft) / browser.offsetWidth - 0.5) * 100;
    }

    function buttonY() {
        const b = button.getBoundingClientRect();
        return ((b.top + b.height / 2 - browser.offsetTop) / browser.offsetHeight - 0.5) * 100;
    }

    function find(selector) {
        return section.querySelector(selector);
    }

    document.addEventListener("components:loaded", init, { once: true });
})();
