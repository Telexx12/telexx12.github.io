(() => {
    const START = 0.12;
    const STEP = 0.12;
    const TURN = 0.18;

    let section, route, projects, tl;
    let played = false;

    function init() {
        section = document.querySelector(".work");
        route = section.querySelector(".work-route");
        projects = [...section.querySelectorAll(".work-project")];
        tl = gsap.timeline({ paused: true });

        addRoute();
        projects.forEach(addProject);

        ScrollTrigger.create({ trigger: section, start: "top 60%", onToggle: process });
    }

    function addRoute() {
        tl.set(route, { attr: { "data-state": "working" } }, 0);
    }

    function addProject(project, i) {
        const at = START + i * STEP;

        tl.set(project, { attr: { "data-state": "working" } }, at)
          .fromTo(project.querySelector(".station-card"), { scale: 0.96 }, { scale: 1, duration: 0.35, ease: "back.out(3)", immediateRender: false, clearProps: "transform" }, at)
          .set(project, { attr: { "data-state": "done" } }, at + TURN);
    }

    function process(self) {
        if (played || !self.isActive) return;
        played = true;
        tl.play();
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) tl.progress(1);
    }

    document.addEventListener("components:loaded", init, { once: true });
})();
