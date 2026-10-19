(() => {
    const WIDE = matchMedia("(min-width: 1200px)");
    const BEND = 14;
    const FADE = 0.72;

    let box, figure, svg, threads, wide, ratio, width, frame, origin;

    function init() {
        box = document.querySelector(".about-branch");
        figure = document.querySelector(".about-figure");
        svg = layer();
        threads = group([...box.querySelectorAll("[data-lane]")]);

        new ResizeObserver(draw).observe(box);
        new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
        window.addEventListener("resize", draw);
        document.fonts.ready.then(draw);
        watchRatio();
    }

    function layer() {
        box.insertAdjacentHTML("afterbegin", `<svg class="about-lines" aria-hidden="true"></svg>`);
        return box.firstElementChild;
    }

    function group(stops) {
        const open = {};
        const found = [];
        stops.forEach((stop, index) => {
            const { lane, fork, merge } = stop.dataset;
            if (fork !== undefined || !open[lane]) {
                open[lane] = { lane, fork, older: stops[index - 1], stops: [] };
                found.push(open[lane]);
            }
            open[lane].stops.push(stop);
            if (merge === undefined) return;
            open[lane].merge = merge;
            open[lane].stops.forEach((member) => member.classList.add("is-done"));
            delete open[lane];
        });
        return found;
    }

    function watchRatio() {
        matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener("change", rescale, { once: true });
    }

    function rescale() {
        draw();
        watchRatio();
    }

    function draw() {
        wide = WIDE.matches;
        ratio = window.devicePixelRatio;
        width = Math.max(1, Math.floor(parseFloat(getComputedStyle(box).getPropertyValue("--track")) * ratio));
        frame = box.getBoundingClientRect();
        origin = { x: frame.left + window.scrollX, y: frame.top + window.scrollY };
        svg.style.setProperty("--stroke", `${width / ratio}px`);
        const measured = threads.map(measure);
        const lanes = Object.fromEntries(measured.map((thread) => [thread.lane, thread.points[0].c]));
        const floor = wide ? null : frame.top - figure.getBoundingClientRect().bottom;
        const lower = [];
        const upper = [];
        const gaps = [];

        measured.forEach((thread) => {
            const done = thread.merge !== undefined;
            const points = thread.points.slice();
            const last = done ? points.pop() : null;
            let path = "";
            if (thread.fork !== undefined) {
                const from = lanes[thread.fork];
                const first = points[0];
                const turn = Math.sign(first.c - from);
                path += move(thread.start, from) + line(thread.start, first.c - turn * BEND) + curve(thread.start, first.c, thread.start + BEND, first.c);
                if (done) gaps.push(...crossings(measured, thread.start, from, first.c, lanes));
            } else {
                path += move(points[0].t, points[0].c);
            }
            points.forEach((point) => { path += line(point.t, point.c); });
            if (done) {
                const target = lanes[thread.merge];
                const turn = Math.sign(target - last.c);
                path += line(last.t - BEND, last.c) + curve(last.t, last.c, last.t, last.c + turn * BEND) + line(last.t, target);
                gaps.push(...crossings(measured, last.t, last.c, target, lanes));
            }
            if (floor !== null && thread.lane === "0") {
                const c = points[points.length - 1].c;
                path += line(floor - BEND, c) + curve(floor, c, floor, c + BEND);
                upper.push(ground(floor, c + BEND, frame.width));
            }
            (done ? lower : upper).push(segment(path, done ? "about-line is-done" : "about-line"));
        });

        svg.innerHTML = lower.join("") + gaps.join("") + upper.join("");
    }

    function measure(thread) {
        const points = thread.stops.map(spot);
        const start = thread.fork === undefined ? points[0].t : forkAt(thread, points[0]);
        return { ...thread, points, start };
    }

    function ground(t, start, end) {
        return `<defs><linearGradient id="about-fade" gradientUnits="userSpaceOnUse" x1="${start}" y1="0" x2="${end}" y2="0"><stop offset="${FADE}" style="stop-color: var(--live)"></stop><stop offset="1" style="stop-color: var(--live); stop-opacity: 0"></stop></linearGradient></defs>` + segment(move(t, start) + line(t, end), "about-floor");
    }

    function crossings(measured, t, from, to, lanes) {
        const low = Math.min(from, to);
        const high = Math.max(from, to);
        const reach = width / ratio / 2 + 3;
        return measured
            .filter((other) => other.merge === undefined && other.start < t && lanes[other.lane] > low && lanes[other.lane] < high)
            .map((other) => segment(move(t, lanes[other.lane] - reach) + line(t, lanes[other.lane] + reach), "about-gap"));
    }

    function forkAt(thread, point) {
        if (wide) return thread.stops[0].getBoundingClientRect().left - frame.left;
        return (point.t + spot(thread.older).t) / 2;
    }

    function spot(stop) {
        const rect = stop.querySelector(".about-dot").getBoundingClientRect();
        const x = rect.left + rect.width / 2 - frame.left;
        const y = rect.top + rect.height / 2 - frame.top;
        return wide ? { t: x, c: y } : { t: -y, c: x };
    }

    function xy(t, c) {
        return wide ? `${snap(t, origin.x)} ${snap(c, origin.y)}` : `${snap(c, origin.x)} ${snap(-t, origin.y)}`;
    }

    function snap(value, offset) {
        const scaled = (value + offset) * ratio;
        const edge = width % 2 ? Math.floor(scaled) + 0.5 : Math.round(scaled);
        return Math.round((edge - Math.round(offset * ratio)) / ratio * 1000) / 1000;
    }

    function move(t, c) {
        return `M ${xy(t, c)} `;
    }

    function line(t, c) {
        return `L ${xy(t, c)} `;
    }

    function curve(ct, cc, t, c) {
        return `Q ${xy(ct, cc)} ${xy(t, c)} `;
    }

    function segment(path, name) {
        return `<path class="${name}" d="${path.trim()}"></path>`;
    }

    document.addEventListener("components:loaded", init, { once: true });
})();
