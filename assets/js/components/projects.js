(() => {
    const WIDE = matchMedia("(min-width: 1200px) and (pointer: fine)");
    const REDUCED = matchMedia("(prefers-reduced-motion: reduce)");
    const EDGE = 32;
    const TOP = 96;
    const BOTTOM = 200;
    const NUDGE = 140;

    let section, field, plane, head, drag;

    function init() {
        section = document.querySelector(".projects");
        field = section.querySelector(".projects-field");
        if (!field) return;
        plane = field.querySelector(".projects-plane");
        head = field.querySelector(".projects-head");

        build();
        plane.addEventListener("focusin", reveal);
        WIDE.addEventListener("change", build);
        window.addEventListener("resize", fit);
        new IntersectionObserver(nudge, { threshold: 0.3 }).observe(field);
        document.fonts.ready.then(home);
    }

    function build() {
        if (drag) drag.kill();
        gsap.set(plane, { x: 0, y: 0 });
        drag = Draggable.create(plane, {
            type: WIDE.matches ? "x,y" : "x",
            bounds: field,
            inertia: !REDUCED.matches,
            edgeResistance: 0.88,
            zIndexBoost: false,
            minimumMovement: 6,
            allowContextMenu: true,
            cursor: "grab",
            activeCursor: "grabbing",
            onDragStart: () => field.classList.add("is-dragging"),
            onRelease: () => field.classList.remove("is-dragging"),
        })[0];
        home();
    }

    function home() {
        fit();
        const view = field.getBoundingClientRect();
        const box = head.getBoundingClientRect();
        const x = gsap.getProperty(plane, "x") + view.left + view.width / 2 - (box.left + box.width / 2);
        const y = WIDE.matches ? gsap.getProperty(plane, "y") + view.top + view.height * 0.44 - (box.top + box.height / 2) : 0;
        gsap.set(plane, { x: clamp(x, drag.minX, drag.maxX), y: clamp(y, drag.minY, drag.maxY) });
        drag.update();
    }

    function fit() {
        drag.update(true);
        const still = drag.maxX - drag.minX < 1 && drag.maxY - drag.minY < 1;
        field.classList.toggle("is-still", still);
        if (drag.enabled() === still) drag.enabled(!still);
    }

    function reveal(e) {
        const card = e.target.closest(".projects-card");
        if (card) requestAnimationFrame(() => glide(card));
    }

    function glide(card) {
        if (WIDE.matches) align();
        const view = field.getBoundingClientRect();
        const box = card.getBoundingClientRect();
        const top = Math.max(view.top, 0) + TOP;
        const bottom = Math.min(view.bottom, innerHeight) - BOTTOM;
        let dx = 0;
        let dy = 0;
        if (box.left < view.left + EDGE) dx = view.left + EDGE - box.left;
        else if (box.right > view.right - EDGE) dx = view.right - EDGE - box.right;
        if (WIDE.matches && box.top < top) dy = top - box.top;
        else if (WIDE.matches && box.bottom > bottom) dy = bottom - box.bottom;
        if (!dx && !dy) return;
        gsap.to(plane, {
            x: clamp(gsap.getProperty(plane, "x") + dx, drag.minX, drag.maxX),
            y: clamp(gsap.getProperty(plane, "y") + dy, drag.minY, drag.maxY),
            duration: REDUCED.matches ? 0 : 0.6,
            ease: "power3.out",
            onUpdate: () => drag.update(),
        });
    }

    function align() {
        const top = section.getBoundingClientRect().top;
        if (Math.abs(top) > 1) window.scrollBy(0, top);
    }

    function nudge(entries, observer) {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        if (REDUCED.matches) return;
        gsap.from(plane, { x: gsap.getProperty(plane, "x") + (WIDE.matches ? NUDGE : NUDGE / 2), duration: 1.6, ease: "power3.out", onUpdate: () => drag.update() });
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    document.addEventListener("components:loaded", init, { once: true });
})();
