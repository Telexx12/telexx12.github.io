(() => {
    const root = document.documentElement;

    function init() {
        root.dataset.theme = preferredTheme();
        root.lang = preferredLang();
        startAtTop();
    }

    function preferredTheme() {
        return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    function preferredLang() {
        return navigator.language.toLowerCase().startsWith("hu") ? "hu" : "en";
    }

    function startAtTop() {
        history.scrollRestoration = "manual";
        if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    }

    init();
})();
