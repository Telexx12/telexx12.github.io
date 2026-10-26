(() => {
    const root = document.documentElement;

    function init() {
        fill(document).then(ready, fail);
    }

    async function fill(scope) {
        await Promise.all([...scope.querySelectorAll("[data-component]")].map(load));
    }

    async function load(slot) {
        const response = await fetch(`components/${slot.dataset.component}.html`);
        if (!response.ok) throw new Error(`Component not found: ${slot.dataset.component}`);

        const template = document.createElement("template");
        template.innerHTML = await response.text();
        await window.I18n.translate(template.content);
        await fill(template.content);
        slot.replaceWith(template.content);
    }

    function ready() {
        delete root.dataset.fallback;
        document.dispatchEvent(new Event("components:loaded"));
    }

    function fail(error) {
        root.dataset.fallback = "";
        throw error;
    }

    init();
})();
