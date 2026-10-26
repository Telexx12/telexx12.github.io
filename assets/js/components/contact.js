(() => {
    const GUARD = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    const PASSING = ["contact.wait", "contact.tick", "contact.blocked"];
    const TIMEOUT = 30000;
    const BLANKS = [
        { id: "letter-name", error: "contact.name.error" },
        { id: "letter-email", error: "contact.email.error" },
        { id: "letter-message", error: "contact.message.error" },
    ];
    const REDUCED = matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.documentElement;

    let form, name, message, paper, sign, button, busy, status, guard, envelope, flap, sent, blanks;
    let widget = null;
    let blocked = false;
    let shown = "";

    function init() {
        form = document.querySelector(".letter");
        name = form.querySelector("#letter-name");
        message = form.querySelector("#letter-message");
        paper = form.querySelector("[data-paper]");
        sign = form.querySelector("[data-sign]");
        button = form.querySelector(".letter-send");
        busy = form.querySelector("[data-busy]");
        status = form.querySelector("[data-status]");
        guard = form.querySelector("[data-guard]");
        envelope = document.querySelector(".envelope");
        flap = envelope.querySelector(".envelope-flap");
        sent = document.querySelector("[data-sent]");
        blanks = BLANKS.map(findBlank);

        name.addEventListener("input", mirror);
        message.addEventListener("input", fit);
        message.addEventListener("focus", fit);
        blanks.forEach(watch);
        form.addEventListener("submit", submit);
        form.addEventListener("focusin", loadGuard, { once: true });
        sent.querySelector("[data-again]").addEventListener("click", again);
    }

    function findBlank(spec) {
        const input = form.querySelector(`#${spec.id}`);
        return { input, box: input.closest(".letter-blank, .letter-paper"), note: form.querySelector(`#${spec.id}-error`), error: spec.error };
    }

    function watch(blank) {
        blank.input.addEventListener("input", () => recheck(blank));
    }

    function recheck(blank) {
        if (blank.box.hasAttribute("data-invalid") && filled(blank)) flag(blank, false);
    }

    function filled(blank) {
        const value = blank.input.value.trim();
        if (!value || !blank.input.checkValidity()) return false;
        return blank.input.type !== "email" || value.split("@").pop().includes(".");
    }

    function check(blank) {
        const ok = filled(blank);
        flag(blank, !ok);
        return ok;
    }

    function flag(blank, wrong) {
        blank.input.setAttribute("aria-invalid", wrong);
        blank.box.toggleAttribute("data-invalid", wrong);
        write(blank.note, wrong ? blank.error : "");
    }

    function visit(blank) {
        blank.input.focus({ preventScroll: true });
        blank.box.scrollIntoView({ block: "nearest" });
    }

    function fit() {
        paper.dataset.value = message.value;
    }

    function mirror() {
        sign.textContent = name.value.trim() || "…";
    }

    function loadGuard() {
        if (!form.dataset.sitekey) return;
        const script = document.createElement("script");
        script.src = GUARD;
        script.async = true;
        script.addEventListener("load", renderGuard);
        script.addEventListener("error", block);
        document.head.append(script);
    }

    function renderGuard() {
        widget = window.turnstile.render(guard, {
            sitekey: form.dataset.sitekey,
            appearance: "interaction-only",
            theme: root.dataset.theme === "dark" ? "dark" : "light",
            language: root.lang,
            callback: pass,
            "error-callback": block,
            "before-interactive-callback": ask,
        });
    }

    function pass() {
        blocked = false;
        if (PASSING.includes(shown)) say("");
    }

    function block() {
        blocked = true;
        if (shown) say("contact.blocked");
        return true;
    }

    function ask() {
        guard.classList.add("is-open");
        say("contact.tick");
    }

    async function submit(e) {
        e.preventDefault();
        if (button.hasAttribute("aria-busy")) return;
        const missing = blanks.filter((blank) => !check(blank));
        if (missing.length) return visit(missing[0]);
        if (form.elements._gotcha.value) return fold();
        if (!form.dataset.endpoint) return say("contact.off");
        if (form.dataset.sitekey && blocked) return say("contact.blocked");
        if (form.dataset.sitekey && (widget === null || !window.turnstile.getResponse(widget))) return say("contact.wait");
        say("");
        button.setAttribute("aria-busy", "true");
        write(busy, "contact.sending");
        try {
            const response = await fetch(form.dataset.endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" }, signal: AbortSignal.timeout(TIMEOUT) });
            if (!response.ok) throw new Error(response.status);
            fold();
        } catch {
            release();
            say("contact.error");
        } finally {
            rearm();
        }
    }

    function release() {
        button.removeAttribute("aria-busy");
        write(busy, "");
    }

    function rearm() {
        if (widget === null) return;
        window.turnstile.reset(widget);
        guard.classList.remove("is-open");
    }

    function say(key) {
        shown = key;
        write(status, key);
    }

    function write(note, key) {
        note.innerHTML = key ? `<span data-i18n="${key}"></span>` : "";
        if (key) window.I18n.translate(note);
    }

    function fold() {
        if (REDUCED.matches) {
            gsap.set(form, { autoAlpha: 0 });
            return reveal();
        }
        gsap.set(flap, { transformOrigin: "50% 0%", scaleY: -1 });
        gsap.timeline({ onComplete: reveal })
            .to(form, { scale: 0.4, y: 40, rotation: 0, duration: 0.55, ease: "power3.inOut" })
            .fromTo(envelope, { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 40, duration: 0.35, ease: "power2.out" }, "-=0.25")
            .to(form, { y: 140, autoAlpha: 0, duration: 0.35, ease: "power2.in" })
            .to(flap, { scaleY: 1, duration: 0.35, ease: "power2.inOut" })
            .to(envelope, { x: "+=320", y: "-=220", rotation: 16, autoAlpha: 0, duration: 0.75, ease: "power2.in" }, "+=0.1");
    }

    function reveal() {
        sent.hidden = false;
        gsap.fromTo(sent, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: REDUCED.matches ? 0 : 0.45, ease: "power2.out" });
        sent.focus({ preventScroll: true });
    }

    function again() {
        gsap.set([form, envelope, flap, sent], { clearProps: "all" });
        form.reset();
        release();
        blanks.forEach((blank) => flag(blank, false));
        mirror();
        fit();
        say("");
        sent.hidden = true;
        name.focus();
    }

    document.addEventListener("components:loaded", init, { once: true });
})();
