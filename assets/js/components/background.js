(() => {
    const GAP = 22;
    const REACH = 180;
    const BAND = 70;
    const SHADES = 24;
    const GLOW = 0.55;

    const root = document.documentElement;
    const light = { x: 0, y: 0, power: 0 };
    const waves = [];

    let canvas, ctx, width, height, shades, moveX, moveY;
    let dirty = false;

    function init() {
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        canvas = document.querySelector(".background");
        ctx = canvas.getContext("2d");
        moveX = gsap.quickTo(light, "x", { duration: 0.5, ease: "power3", onUpdate: invalidate });
        moveY = gsap.quickTo(light, "y", { duration: 0.5, ease: "power3", onUpdate: invalidate });

        new ResizeObserver(resize).observe(canvas);
        new MutationObserver(recolor).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
        window.addEventListener("pointermove", follow);
        window.addEventListener("touchmove", followTouch, { passive: true });
        window.addEventListener("touchend", fade);
        root.addEventListener("mouseleave", fade);
        document.addEventListener("story:request", requestWave);
        document.addEventListener("thread:pass", passWave);
        document.addEventListener("story:navigate", navigateWave);
        document.addEventListener("story:phase", phaseWave);
        document.addEventListener("story:loaded", loadedWave);
        gsap.ticker.add(draw);
    }

    function resize() {
        const ratio = Math.min(devicePixelRatio, 2);
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        recolor();
    }

    function recolor() {
        const styles = getComputedStyle(root);
        const from = rgb(styles.getPropertyValue("--fg"));
        const to = rgb(styles.getPropertyValue("--accent"));
        shades = Array.from({ length: SHADES }, (_, i) => shade(from, to, i / (SHADES - 1)));
        invalidate();
    }

    function follow(e) {
        moveTo(e.clientX, e.clientY);
    }

    function followTouch(e) {
        moveTo(e.touches[0].clientX, e.touches[0].clientY);
    }

    function moveTo(x, y) {
        if (!light.power) {
            moveX(x, x);
            moveY(y, y);
        } else {
            moveX(x);
            moveY(y);
        }
        if (light.power < 1) gsap.to(light, { power: 1, duration: 0.4, overwrite: "auto", onUpdate: invalidate });
    }

    function fade() {
        gsap.to(light, { power: 0, duration: 0.6, overwrite: "auto", onUpdate: invalidate });
    }

    function requestWave() {
        ripple(document.querySelector(".home-fetch"), Math.hypot(width, height), 1.6);
    }

    function passWave(e) {
        ripple(e.detail, 320, 1);
    }

    function navigateWave(e) {
        ripple(e.detail, Math.hypot(width, height) * 0.6, 1.4);
    }

    function phaseWave(e) {
        ripple(e.detail, 260, 0.9);
    }

    function loadedWave(e) {
        ripple(e.detail, Math.hypot(width, height) * 0.8, 1.6);
    }

    function ripple(from, reach, duration) {
        const box = from.getBoundingClientRect();
        const wave = { x: box.left + box.width / 2, y: box.top + box.height / 2, r: 0, power: 1 };
        waves.push(wave);
        gsap.to(wave, { power: 0, duration, ease: "power2.in" });
        gsap.to(wave, { r: reach, duration, ease: "power1.out", onUpdate: invalidate, onComplete: forget, onCompleteParams: [wave] });
    }

    function forget(wave) {
        waves.splice(waves.indexOf(wave), 1);
        invalidate();
    }

    function draw() {
        if (!dirty) return;
        dirty = false;
        ctx.clearRect(0, 0, width, height);
        for (let y = GAP / 2; y < height; y += GAP) {
            for (let x = GAP / 2; x < width; x += GAP) {
                const level = levelAt(x, y);
                if (level > 0.02) dot(x, y, level);
            }
        }
    }

    function levelAt(x, y) {
        let level = light.power * Math.max(0, 1 - Math.hypot(x - light.x, y - light.y) / REACH) ** 2;
        for (const wave of waves) {
            level = Math.max(level, wave.power * Math.max(0, 1 - Math.abs(Math.hypot(x - wave.x, y - wave.y) - wave.r) / BAND));
        }
        return Math.min(level, 1);
    }

    function dot(x, y, level) {
        ctx.fillStyle = shades[Math.round(level * (SHADES - 1))];
        ctx.beginPath();
        ctx.arc(x, y, 1 + level * 1.2, 0, Math.PI * 2);
        ctx.fill();
    }

    function shade(from, to, t) {
        const mix = from.map((c, i) => Math.round(c + (to[i] - c) * t));
        return `rgba(${mix.join(", ")}, ${(t * GLOW).toFixed(3)})`;
    }

    function rgb(hex) {
        const n = parseInt(hex.trim().slice(1), 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    function invalidate() {
        dirty = true;
    }

    document.addEventListener("components:loaded", init, { once: true });
})();
