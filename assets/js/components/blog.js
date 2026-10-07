(() => {
    const LINE = 0.08;
    const START = 0.26;
    const STEP = 0.12;
    const TURN = 0.18;

    let section, lines, posts, tl;
    let played = false;

    function init() {
        section = document.querySelector(".blog");
        lines = [...section.querySelectorAll(".blog-line")];
        posts = [...section.querySelectorAll(".blog-post")];
        tl = gsap.timeline({ paused: true });

        lines.forEach(addLine);
        posts.forEach(addPost);

        ScrollTrigger.create({ trigger: section, start: "top 60%", onToggle: process });
    }

    function addLine(line, i) {
        tl.set(line, { attr: { "data-state": "done" } }, i * LINE);
    }

    function addPost(post, i) {
        const at = START + i * STEP;

        tl.set(post, { attr: { "data-state": "working" } }, at)
          .fromTo(post.querySelector(".station-card"), { scale: 0.96 }, { scale: 1, duration: 0.35, ease: "back.out(3)", immediateRender: false, clearProps: "transform" }, at)
          .set(post, { attr: { "data-state": "done" } }, at + TURN);
    }

    function process(self) {
        if (played || !self.isActive) return;
        played = true;
        tl.play();
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) tl.progress(1);
    }

    document.addEventListener("components:loaded", init, { once: true });
})();
