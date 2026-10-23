(() => {
    const root = document.documentElement;

    function init() {
        root.dataset.theme = read("theme") ?? preferredTheme();
        root.lang = read("lang") ?? preferredLang();
        if (!root.dataset.page) startAtTop();
        new MutationObserver(remember).observe(root, { attributes: true, attributeFilter: ["data-theme", "lang"] });
    }

    function preferredTheme() {
        return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    function preferredLang() {
        return navigator.language.toLowerCase().startsWith("hu") ? "hu" : "en";
    }

    function read(key) {
        try {
            return sessionStorage.getItem(key);
        } catch {
            return null;
        }
    }

    function write(key, value) {
        try {
            if (value === null) sessionStorage.removeItem(key);
            else sessionStorage.setItem(key, value);
        } catch {}
    }

    function remember() {
        write("theme", root.dataset.theme);
        write("lang", root.lang);
    }

    function startAtTop() {
        history.scrollRestoration = "manual";
        if (location.hash) history.replaceState(null, "", location.pathname + location.search);
        const back = performance.getEntriesByType("navigation")[0]?.type === "back_forward";
        const place = back ? read("place") : null;
        if (place !== null) root.dataset.entry = place;
        addEventListener("pagehide", keepPlace);
    }

    function keepPlace() {
        write("place", document.querySelector(".home") ? null : String(Math.round(scrollY)));
    }

    init();
})();
