(() => {
    function init() {
        fill(document).then(() => document.dispatchEvent(new Event("components:loaded")));
    }

    async function fill(root) {
        await Promise.all([...root.querySelectorAll("[data-component]")].map(load));
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

    init();
})();
