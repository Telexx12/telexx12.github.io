(() => {
    const BAR = 20;
    const STEP = 0.045;

    let section, tl, installs, cursorLine;
    let state = "booting";

    function init() {
        section = document.querySelector(".home");
        installs = steps("install");
        cursorLine = steps("new")[0];
        tl = gsap.timeline({ defaults: { ease: "none" }, onComplete: ready });

        resetTerminal();
        addCommands();
        addInstall();
        addQuestions();
        addServe();
        addActions();

        find(".terminal").addEventListener("click", skip);
        find(".home-fetch").addEventListener("click", sendRequest);
        find(".home-tldr").addEventListener("click", jumpToStory);
        document.addEventListener("keydown", onKey);
        document.addEventListener("story:opened", leave, { once: true });
        section.focus({ preventScroll: true });
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) skip();
    }

    function resetTerminal() {
        section.querySelectorAll(".term-total").forEach((el) => { el.textContent = installs.length; });
        gsap.set(section.querySelectorAll(".term-line"), { display: "none", attr: { "data-cursor": "off" } });
        gsap.set([find(".term-count"), find(".term-percent")], { textContent: 0 });
        gsap.set(steps("progress"), { "--done": 0 });
    }

    function addCommands() {
        tl.fromTo(find(".terminal"), { autoAlpha: 0, y: 14, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: "expo.out" }, 0);
        print(steps("new")[0], 0.05);
        type(steps("new")[0], 0.15, 0.8);
        steps("banner").forEach((line, i) => print(line, 1.05 + i * 0.03, { cursor: false }));
        print(steps("blank")[0], 1.22, { cursor: false });
        print(steps("install-command")[0], 1.25);
        type(steps("install-command")[0], 1.28, 0.25);
    }

    function addInstall() {
        const [loading, resolving, operations] = steps("resolve");
        const start = 1.85;
        const autoload = start + installs.length * STEP + 0.04;

        print(loading, 1.6);
        print(resolving, 1.72);
        print(operations, 1.78);
        print(steps("progress")[0], start);
        installs.forEach((line, i) => {
            print(line, start + i * STEP, { cursor: false });
            showInstalled(i + 1, start + (i + 0.6) * STEP);
        });
        print(steps("autoload")[0], autoload);
        print(steps("autoload")[1], autoload + 0.07);
    }

    function addQuestions() {
        ask(steps("where"), 2.7, { typed: true });
        ask(steps("edition"), 2.95);
        ask(steps("when"), 3.17, { typed: true });
    }

    function addServe() {
        print(steps("done")[0], 3.45);
        print(steps("serve")[0], 3.53);
        type(steps("serve")[0], 3.55, 0.18);
        print(steps("started")[0], 3.8);
    }

    function addActions() {
        tl.fromTo(find(".home-actions"), { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "back.out(1.7)" }, 3.95);
    }

    function print(line, at, { cursor = true } = {}) {
        tl.set(line, { display: "block" }, at);
        if (!cursor) return;
        tl.set(cursorLine, { attr: { "data-cursor": "off" } }, at)
          .set(line, { attr: { "data-cursor": "on" } }, at);
        cursorLine = line;
    }

    function type(line, at, duration) {
        const text = line.querySelector(".term-type");
        const length = text.textContent.length;
        tl.fromTo(text, { "--chars": 0 }, { "--chars": length, duration, ease: `steps(${length})` }, at)
          .set(text, { "--chars": 999 }, at + duration);
    }

    function ask([question, answer, end], at, { typed = false } = {}) {
        print(question, at);
        print(answer, at + 0.06);
        if (typed) type(answer, at + 0.06, 0.15);
        print(end, at + 0.06);
    }

    function showInstalled(count, at) {
        tl.set(find(".term-count"), { textContent: count }, at)
          .set(find(".term-percent"), { textContent: Math.round((count / installs.length) * 100) }, at)
          .set(steps("progress"), { "--done": Math.round((count / installs.length) * BAR) }, at);
    }

    function skip() {
        if (state === "booting") tl.progress(1);
    }

    function ready() {
        state = "ready";
        section.dataset.state = state;
    }

    function sendRequest() {
        if (state !== "ready") return;
        state = "sent";
        section.dataset.state = state;
        find(".home-tldr").disabled = true;
        gsap.timeline()
          .call(showLatest)
          .set(cursorLine, { attr: { "data-cursor": "off" } })
          .set(steps("get"), { display: "block" })
          .set(steps("ok"), { display: "block" }, 0.35)
          .call(openStory, null, 0.9);
    }

    function showLatest() {
        section.scrollTo({ top: 0, behavior: "smooth" });
    }

    function openStory() {
        document.dispatchEvent(new CustomEvent("story:open"));
    }

    function jumpToStory() {
        document.dispatchEvent(new CustomEvent("story:open", { detail: "instant" }));
    }

    function leave() {
        document.removeEventListener("keydown", onKey);
        section.remove();
    }

    function onKey(e) {
        if (e.target.closest("button")) return;
        if (e.key === "Escape") skip();
        else if (e.key === "Enter") state === "booting" ? skip() : sendRequest();
        else if ((e.key === "t" || e.key === "T") && state !== "booting") find(".home-tldr").click();
    }

    function find(selector) {
        return section.querySelector(selector);
    }

    function steps(name) {
        return [...section.querySelectorAll(`[data-step="${name}"]`)];
    }

    document.addEventListener("components:loaded", init, { once: true });
})();
