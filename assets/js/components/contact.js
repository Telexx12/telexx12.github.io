(() => {
    const GUARD = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    const PASSING = ["contact.wait", "contact.tick", "contact.blocked"];
    const REDUCED = matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.documentElement;

    let form, name, sign, button, status, guard, envelope, flap, sent;
    let widget = null;
    let blocked = false;
    let shown = "";

    function init() {
        form = document.querySelector(".letter");
        name = form.querySelector("#letter-name");
        sign = form.querySelector("[data-sign]");
        button = form.querySelector(".letter-send");
        status = form.querySelector("[data-status]");
        guard = form.querySelector("[data-guard]");
        envelope = document.querySelector(".envelope");
        flap = envelope.querySelector(".envelope-flap");
        sent = document.querySelector("[data-sent]");

        name.addEventListener("input", mirror);
        form.addEventListener("submit", submit);
        form.addEventListener("focusin", loadGuard, { once: true });
        sent.querySelector("[data-again]").addEventListener("click", again);
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
        if (form.elements._gotcha.value) return fold();
        if (!form.dataset.endpoint) return say("contact.off");
        if (form.dataset.sitekey && blocked) return say("contact.blocked");
        if (form.dataset.sitekey && (widget === null || !window.turnstile.getResponse(widget))) return say("contact.wait");
        say("");
        button.setAttribute("aria-busy", "true");
        try {
            const response = await fetch(form.dataset.endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
            if (!response.ok) throw new Error(response.status);
            fold();
        } catch {
            say("contact.error");
        } finally {
            button.removeAttribute("aria-busy");
            rearm();
        }
    }

    function rearm() {
        if (widget === null) return;
        window.turnstile.reset(widget);
        guard.classList.remove("is-open");
    }

    function say(key) {
        shown = key;
        status.innerHTML = key ? `<span data-i18n="${key}"></span>` : "";
        if (key) window.I18n.translate(status);
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
        mirror();
        say("");
        sent.hidden = true;
        name.focus();
    }

    document.addEventListener("components:loaded", init, { once: true });
})();
