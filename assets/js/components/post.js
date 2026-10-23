(() => {
    const root = document.documentElement;
    const actions = {
        theme: () => { root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark"; },
        lang: () => window.I18n.set(root.lang === "en" ? "hu" : "en"),
    };

    let article, back;

    async function init() {
        article = document.querySelector(".post");
        back = document.querySelector(".post-back");
        document.addEventListener("click", runAction);
        back.addEventListener("click", goBack);
        try {
            await window.I18n.translate(document);
        } finally {
            article.dataset.ready = "";
        }
    }

    function runAction(e) {
        const el = e.target.closest("[data-action]");
        if (!el) return;
        actions[el.dataset.action]();
        if (e.detail) el.blur();
    }

    function goBack(e) {
        if (e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || !cameFromHome()) return;
        e.preventDefault();
        history.back();
    }

    function cameFromHome() {
        if (history.length < 2 || !document.referrer) return false;
        const from = new URL(document.referrer);
        return from.origin === location.origin && from.pathname === new URL(back.href).pathname;
    }

    document.addEventListener("components:loaded", init, { once: true });
})();
