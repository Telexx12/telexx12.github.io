(() => {
    const STEP = 0.12;

    let section, gates, next, tl;
    let played = false;

    function init() {
        section = document.querySelector(".cv");
        gates = [...section.querySelectorAll(".cv-gate")];
        next = section.querySelector(".cv-next");
        tl = gsap.timeline({ paused: true });

        gates.forEach(addGate);
        addNext();

        ScrollTrigger.create({ trigger: section, start: "top 60%", onToggle: process });
    }

    function addGate(gate, i) {
        tl.set(gate, { attr: { "data-state": "working" } }, i * STEP)
          .set(gate, { attr: { "data-state": "done" } }, (i + 1) * STEP);
    }

    function addNext() {
        tl.fromTo(next, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: "power2.out" }, gates.length * STEP);
    }

    function process(self) {
        if (played || !self.isActive) return;
        played = true;
        tl.play();
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) tl.progress(1);
    }

    document.addEventListener("components:loaded", init, { once: true });
})();
