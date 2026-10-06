(() => {
    const BAR = 20;

    let section, tl, installs, cursorLine;

    function init() {
        gsap.registerPlugin(ScrollTrigger);
        section = document.querySelector(".first-steps");
        installs = steps("install");
        cursorLine = steps("command")[0];
        tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
                trigger: section,
                start: "top -20%",
                end: "bottom bottom",
                scrub: true,
                pin: find(".opening"),
                pinSpacing: false,
            },
        });

        resetTerminal();
        addInstall();
        addRequest();
    }

    function resetTerminal() {
        section.querySelectorAll(".term-total").forEach((el) => { el.textContent = installs.length; });
        gsap.set(section.querySelectorAll(".term-line"), { display: "none", attr: { "data-cursor": "off" } });
        gsap.set(cursorLine, { display: "block", attr: { "data-cursor": "on" } });
        gsap.set([find(".term-count"), find(".term-percent")], { textContent: 0 });
        gsap.set(steps("progress"), { "--done": 0 });
        gsap.set([find(".term-pointer"), find(".term-link")], { attr: { "data-state": "idle" } });
    }

    function addInstall() {
        type(steps("command")[0], 0.45, 1.55);
        printEach(steps("resolve"), 2.4);

        print(steps("progress")[0], 4);
        installs.forEach((line, i) => {
            print(line, 4 + i * 0.55, { cursor: false });
            showInstalled(i + 1, 4 + (i + 0.6) * 0.55);
        });

        printEach(steps("autoload"), 12.55);
        ask(steps("where"), 13.85, { typed: true });
        ask(steps("edition"), 15.4);
        ask(steps("when"), 16.5, { typed: true });
        print(steps("done")[0], 18.05);
        print(steps("serve")[0], 18.7);
        type(steps("serve")[0], 18.7, 1.1);
        printEach(steps("started"), 20.45, 0);
    }

    function addRequest() {
        const pointer = find(".term-pointer");
        const link = find(".term-link");

        tl.fromTo(pointer, { autoAlpha: 0, x: 150, y: 200 }, { autoAlpha: 1, x: 0, y: 0, duration: 2.4, ease: "power3.out" }, 22)
          .set([pointer, link], { attr: { "data-state": "hover" } }, 24.4)
          .to(pointer, { scale: 0.85, duration: 0.4 }, 25.3)
          .to(pointer, { scale: 1, duration: 0.4 }, 25.7)
          .set(link, { attr: { "data-state": "active" } }, 25.3)
          .set(link, { attr: { "data-state": "hover" } }, 26.8)
          .fromTo(find(".term-ripple"), { scale: 0, autoAlpha: 1 }, { scale: 1, autoAlpha: 0, duration: 1.5 }, 25.3)
          .fromTo(find(".term-loading"), { scaleX: 0 }, { scaleX: 1, duration: 2.4 }, 25.6);
    }

    function print(line, at, { cursor = true } = {}) {
        tl.set(line, { display: "block" }, at);
        if (!cursor) return;
        tl.set(cursorLine, { attr: { "data-cursor": "off" } }, at)
          .set(line, { attr: { "data-cursor": "on" } }, at);
        cursorLine = line;
    }

    function printEach(lines, at, gap = 0.45) {
        lines.forEach((line, i) => print(line, at + i * gap));
    }

    function type(line, at, duration) {
        const text = line.querySelector(".term-type");
        const length = text.textContent.length;
        tl.fromTo(text, { "--chars": 0 }, { "--chars": length, duration, ease: `steps(${length})` }, at)
          .set(text, { "--chars": 999 }, at + duration);
    }

    function ask([question, answer, end], at, { typed = false } = {}) {
        print(question, at);
        print(answer, at + 0.45);
        if (typed) type(answer, at + 0.45, 0.65);
        print(end, at + 0.45);
    }

    function showInstalled(count, at) {
        tl.set(find(".term-count"), { textContent: count }, at)
          .set(find(".term-percent"), { textContent: Math.round((count / installs.length) * 100) }, at)
          .set(steps("progress"), { "--done": Math.round((count / installs.length) * BAR) }, at);
    }

    function find(selector) {
        return section.querySelector(selector);
    }

    function steps(name) {
        return [...section.querySelectorAll(`[data-step="${name}"]`)];
    }

    document.addEventListener("components:loaded", init, { once: true });
})();
