(() => {
    const BAR = 20;
    const ROW = 0.04;
    const BEAT = 0.08;
    const PAUSE = 0.15;
    const OPEN = 0.2;
    const root = document.documentElement;

    let section, tl, installs, cursorLine;
    let state = "booting";
    let held = false;

    function init() {
        section = document.querySelector(".home");
        installs = steps("install");
        cursorLine = step("new");
        tl = gsap.timeline({ defaults: { ease: "none" }, onComplete: ready });

        addIntro();
        addInstall();
        addQuestions();
        addServe();
        addActions();

        section.addEventListener("pointerdown", press);
        find(".home-fetch").addEventListener("click", sendRequest);
        find(".home-tldr").addEventListener("click", jumpToStory);
        document.addEventListener("keydown", press);
        document.addEventListener("story:opened", leave, { once: true });
        section.focus({ preventScroll: true });
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) skip();
        if (root.dataset.entry) queueMicrotask(enter);
    }

    function addIntro() {
        tl.fromTo(find(".terminal"), { autoAlpha: 0, y: 14, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: "expo.out" }, 0);
        command(step("new"), 0.05, 0.8);
        const banner = after(BEAT);
        [...steps("banner"), step("blank")].forEach((line, i) => print(line, banner + i * ROW, { cursor: false }));
    }

    function addInstall() {
        const start = after(PAUSE);
        print(step("progress"), start);
        installs.forEach((line, i) => {
            const at = start + i * ROW;
            print(line, at, { cursor: false });
            showInstalled(i + 1, at);
        });
    }

    function addQuestions() {
        ask(steps("where"), after(PAUSE));
        ask(steps("when"), after(BEAT));
    }

    function addServe() {
        print(step("done"), after(BEAT));
        command(step("serve"), after(BEAT), 0.18);
        const live = after(BEAT);
        print(step("started"), live, { cursor: false });
        hideCursor(live);
    }

    function addActions() {
        tl.fromTo(find(".home-actions"), { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "back.out(1.7)" }, after(PAUSE));
    }

    function command(line, at, duration) {
        print(line, at);
        type(line, at + BEAT, duration);
    }

    function print(line, at, { cursor = true } = {}) {
        tl.set(line, { display: "block" }, at);
        if (!cursor) return;
        tl.set(cursorLine, { attr: { "data-cursor": "off" } }, at)
          .set(line, { attr: { "data-cursor": "on" } }, at);
        cursorLine = line;
    }

    function hideCursor(at) {
        tl.set(cursorLine, { attr: { "data-cursor": "off" } }, at);
    }

    function type(line, at, duration) {
        const text = line.querySelector(".term-type");
        const length = text.textContent.length;
        tl.fromTo(text, { "--chars": 0 }, { "--chars": length, duration, ease: `steps(${length})` }, at)
          .set(text, { "--chars": 999 }, at + duration);
    }

    function ask([question, answer, end], at) {
        print(question, at);
        print(answer, at + BEAT);
        type(answer, at + BEAT, 0.15);
        print(end, at + BEAT);
    }

    function showInstalled(count, at) {
        tl.set(find(".term-count"), { textContent: count }, at)
          .set(find(".term-percent"), { textContent: Math.round((count / installs.length) * 100) }, at)
          .set(step("progress"), { "--done": Math.round((count / installs.length) * BAR) }, at);
    }

    function after(gap) {
        return tl.duration() + gap;
    }

    function skip() {
        if (state === "booting") tl.progress(1);
    }

    function press(event) {
        held = event.type === "pointerdown" && state === "booting";
        skip();
    }

    function ready() {
        state = "ready";
        section.dataset.state = state;
    }

    function sendRequest() {
        if (state !== "ready" || held) return;
        state = "sent";
        section.dataset.state = state;
        document.dispatchEvent(new Event("story:request"));
        gsap.delayedCall(OPEN, openStory);
    }

    function openStory() {
        document.dispatchEvent(new Event("story:open"));
    }

    function jumpToStory() {
        if (state !== "ready" || held) return;
        document.dispatchEvent(new CustomEvent("story:open", { detail: "instant" }));
    }

    function enter() {
        skip();
        document.addEventListener("story:arrived", land, { once: true });
        jumpToStory();
    }

    function land() {
        const top = Number(root.dataset.entry);
        delete root.dataset.entry;
        window.scrollTo({ top, behavior: "instant" });
    }

    function leave() {
        document.removeEventListener("keydown", press);
        section.remove();
    }

    function find(selector) {
        return section.querySelector(selector);
    }

    function step(name) {
        return section.querySelector(`[data-step="${name}"]`);
    }

    function steps(name) {
        return [...section.querySelectorAll(`[data-step="${name}"]`)];
    }

    document.addEventListener("components:loaded", init, { once: true });
})();
