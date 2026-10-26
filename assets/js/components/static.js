(() => {
    const PATIENCE = 8000;
    const root = document.documentElement;

    function init() {
        setTimeout(reveal, PATIENCE);
    }

    function reveal() {
        if (document.querySelector("[data-component]")) root.dataset.fallback = "";
    }

    init();
})();
