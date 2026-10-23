(() => {
    const CELLS = 36;

    let grid, count;

    function init() {
        grid = document.querySelector(".demo-grid");
        count = document.querySelector(".demo-count");

        grid.replaceChildren(...Array.from({ length: CELLS }, cell));
        grid.addEventListener("click", toggle);
    }

    function cell(_, index) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "demo-cell";
        button.setAttribute("aria-label", String(index + 1));
        button.setAttribute("aria-pressed", "false");
        return button;
    }

    function toggle(e) {
        const button = e.target.closest(".demo-cell");
        if (!button) return;
        button.setAttribute("aria-pressed", String(button.getAttribute("aria-pressed") !== "true"));
        count.textContent = grid.querySelectorAll('[aria-pressed="true"]').length;
    }

    document.addEventListener("components:loaded", init, { once: true });
})();
