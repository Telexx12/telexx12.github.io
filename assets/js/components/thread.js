window.Thread = (() => {
    const SVG = "http://www.w3.org/2000/svg";
    const KNOB = [[0.35, 0], [0.42, 0], [0.45, 0.05], [0.42, 0.09], [0.2, 0.34], [0.8, 0.34], [0.58, 0.09], [0.55, 0.05], [0.58, 0], [0.65, 0]];
    const BOARD = 120;
    const INSET = 10;
    const ROWS = 3;
    const SEAMS = [[0.26, 1], [0.72, 1]];
    const TAB = 0.42;
    const TRACE = 1.3;
    const SHOW = 0.15;
    const FILL = 0.3;
    const STAGGER = 0.15;
    const ROUTE = 0.2;
    const OUTLINE = 0.06;
    const APPEAR = 0.02;
    const BANDS = 0.04;
    const REVEAL = OUTLINE + APPEAR + BANDS;
    const SNAP = 0.08;
    const TAIL = 0.03;
    const MARGIN = 0.04;
    const SLOW = 2;
    const LIFT = 1.06;
    const passes = new Map();
    const lines = [];

    function start() {
        document.querySelectorAll("[data-thread]").forEach(build);
    }

    function build(section) {
        const host = section.querySelector("[data-thread-layer]") || section;
        const goal = section.querySelector("[data-thread-board]");
        const line = {
            section,
            host,
            ...sketch(host),
            intro: section.dataset.thread === "intro",
            start: section.querySelector("[data-thread-start]"),
            axis: section.querySelector("[data-thread-axis]"),
            shelf: section.querySelector("[data-thread-shelf]"),
            stops: [...section.querySelectorAll("[data-thread-stop]")],
            followers: [...section.querySelectorAll("[data-thread-follow]")],
            end: section.querySelector("[data-thread-end]"),
            placed: section.querySelector("[data-thread-placed]"),
            board: goal,
            piece: goal && goal.querySelector(".board-piece"),
            bands: goal ? [...goal.querySelectorAll(".board-band")] : [],
            previous: lines.at(-1),
            eyelets: [],
            knot: null,
            at: {},
            course: [],
            covered: 0,
        };

        lines.push(line);
        line.flow = flow(line);
        if (line.intro) line.prelude = intro(line);
        if (line.board) cut(line);
        layout(line);
        watch(() => layout(line), host, ...[line.start, line.axis, line.shelf, line.board, line.end, ...line.stops].filter(Boolean));
    }

    function sketch(host) {
        const root = document.createElement("div");
        const svg = shape("svg");
        const track = shape("path");
        const trace = shape("path");
        const marks = shape("g");
        const dot = document.createElement("i");

        root.className = "thread-line";
        root.setAttribute("aria-hidden", "true");
        track.setAttribute("class", "thread-track");
        trace.setAttribute("class", "thread-trace");
        trace.setAttribute("pathLength", "1");
        marks.setAttribute("class", "thread-marks");
        dot.className = "thread-dot";
        svg.append(track, trace, marks);
        root.append(svg, dot);
        host.append(root);
        return { svg, track, trace, dot };
    }

    function flow(line) {
        return gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
                trigger: line.section,
                start: () => (line.intro ? "top top" : `top ${reading()}`),
                end: () => `bottom ${reading()}`,
                scrub: true,
                onEnter: () => greet(line),
            },
        });
    }

    function cut(line) {
        board(line.board, Number(line.board.dataset.threadBoard));
        line.band = Number(line.bands[0].getAttribute("height"));
        gsap.set(line.bands, { attr: { height: 0 } });
        gsap.set(line.piece, { ...lifted(line), autoAlpha: 0 });
    }

    function lifted(line) {
        return { x: number(line.board, "--lift-x"), y: number(line.board, "--lift-y"), rotation: number(line.board, "--lift-rotate"), scale: LIFT, transformOrigin: "50% 50%" };
    }

    function layout(line) {
        line.flow.progress(0, true);

        const route = plan(line);

        line.route = route;
        line.track.setAttribute("d", route.d);
        line.trace.setAttribute("d", route.d);
        line.dot.style.offsetPath = `path("${route.d}")`;
        line.at = measure(line, route.marks);
        route.eyelets.forEach((point, i) => place(line.eyelets[i] ||= addMark(line, "thread-eyelet"), point, line.at[point.key]));
        if (route.knot) place(line.knot ||= addMark(line, "thread-knot"), route.knot, line.at.knot);
        line.stops.forEach((stop, k) => span(stop, line.at[`entry${k}`], line.at[`exit${k}`]));
        if (line.prelude) prepare(line);
        compose(line);
    }

    function plan(line) {
        const radius = number(line.section, "--thread-radius");
        const { height } = size(line);
        const axis = axisOf(line);
        const stops = line.stops.map((el) => pass(line, el));
        const sides = sidesOf(line, stops);
        const origin = originOf(line, stops, axis);
        const offset = offsetOf(line);
        const points = [origin];
        const keys = [["origin", 0]];

        stops.forEach((stop, k) => {
            connect(points, stop.entry, sides);
            keys.push([`entry${k}`, points.length - 1]);
            points.push(midpoint(stop), stop.exit);
            keys.push([`middle${k}`, points.length - 2], [`exit${k}`, points.length - 1]);
        });

        const head = `M${origin.x} ${origin.y}`;
        const marks = keys.map(([key, i]) => [key, `${head} ${rounded(points.slice(0, i + 1), radius)}`]);
        const eyelets = [...(line.start ? [{ ...origin, key: "origin" }] : []), ...stops.flatMap((stop, k) => [{ ...stop.entry, key: `entry${k}` }, { ...stop.exit, key: `exit${k}` }])];
        const anchors = stops.map((stop, k) => [`middle${k}`, midpoint(stop).y + offset]);
        const finish = line.board ? toBoard(line, points, head, marks, radius, axis, sides, height) : toEnd(line, origin, marks);

        const exits = stops.map((stop) => stop.exit.y + offset);

        return { ...finish, marks, eyelets, anchors, exits, origin: { ...origin, y: origin.y + offset } };
    }

    function toBoard(line, points, head, marks, radius, axis, sides, height) {
        const frame = box(line, line.board);
        const contour = jigsaw(art(frame), Number(line.board.dataset.threadBoard), number(line.board, "--thread-corner"));
        const slot = { ...contour.start, heading: "down" };

        approach(points, slot, frame, sides, axis, radius, text(line.board, "--thread-approach"));

        const towards = `${head} ${rounded(points, radius)}`;
        const around = `${towards} ${contour.d.replace(/^M[^LC]+/, "").replace(/Z$/, `L${slot.x} ${slot.y}`)}`;
        const exit = depart(line, slot, frame, axis, height);
        const d = `${around} ${rounded(exit.points, radius)}`;

        marks.push(["slot", towards], ["outline", around]);
        if (exit.knot) marks.push(["knot", `${around} ${rounded(exit.points.slice(0, exit.points.indexOf(exit.knot) + 1), radius)}`]);
        marks.push(["end", d]);
        return { d, knot: exit.knot, low: lowest(line, contour.d) + offsetOf(line) };
    }

    function toEnd(line, origin, marks) {
        const target = box(line, line.end);
        const to = { x: target.x, y: target.y - line.end.offsetHeight * number(line.end, "--thread-reach") };
        const bow = (to.y - origin.y) / 2;
        const d = `M${origin.x} ${origin.y} C${origin.x} ${origin.y + bow} ${to.x} ${to.y - bow} ${to.x} ${to.y}`;

        marks.push(["end", d]);
        return { d, knot: null };
    }

    function axisOf(line) {
        const mode = text(line.section, "--thread-axis");
        if (mode === "center") return size(line).width / 2;
        if (mode === "previous") return axisOf(line.previous);
        return box(line, line.axis).left + number(line.axis, "--thread-inset");
    }

    function originOf(line, stops, axis) {
        if (!line.start) return { x: axis, y: Math.max(0, -parseFloat(getComputedStyle(line.section).marginTop)) - offsetOf(line), heading: "down" };
        return { x: stops[0].entry.x - number(line.start, "--thread-lead"), y: box(line, line.start).y, heading: "down" };
    }

    function offsetOf(line) {
        return line.host.getBoundingClientRect().top - line.section.getBoundingClientRect().top;
    }

    function pass(line, el) {
        const frame = box(line, el);
        const raw = text(el, "--thread-inset");
        const inset = raw.endsWith("%") ? (frame.height * parseFloat(raw)) / 100 : parseFloat(raw) || 0;
        const trim = number(el, "--thread-trim");

        if (text(el, "--thread-pass") !== "across") {
            return { frame, entry: { x: frame.left + inset, y: frame.top, heading: "down" }, exit: { x: frame.left + inset, y: frame.bottom, heading: "down" } };
        }

        const y = frame.top + inset;
        const left = { x: frame.left + trim, y };
        const right = { x: frame.right - trim, y };
        return text(el, "--thread-dir") === "rtl"
            ? { frame, entry: { ...right, heading: "west" }, exit: { ...left, heading: "west" } }
            : { frame, entry: { ...left, heading: "east" }, exit: { ...right, heading: "east" } };
    }

    function midpoint(stop) {
        return { x: (stop.entry.x + stop.exit.x) / 2, y: (stop.entry.y + stop.exit.y) / 2, heading: stop.entry.heading };
    }

    function sidesOf(line, stops) {
        if (line.shelf) {
            const frame = box(line, line.shelf);
            return { west: frame.left + number(line.shelf, "--thread-left"), east: frame.right - number(line.shelf, "--thread-right"), low: frame.bottom };
        }
        const frames = stops.map((stop) => stop.frame);
        return { west: Math.min(...frames.map((f) => f.left)), east: Math.max(...frames.map((f) => f.right)), low: Math.max(...frames.map((f) => f.bottom)) };
    }

    function connect(points, to, sides) {
        const from = points.at(-1);
        if (from.x !== to.x && from.y !== to.y) points.push(...bend(from, to, sides));
        points.push(to);
    }

    function bend(from, to, sides) {
        if (from.heading === "down" && to.heading === "down") {
            const middle = (from.y + to.y) / 2;
            return [{ x: from.x, y: middle }, { x: to.x, y: middle }];
        }
        if (from.heading === "down") return [{ x: from.x, y: to.y }];
        const side = from.heading === "east" ? sides.east : sides.west;
        return [{ x: side, y: from.y }, { x: side, y: to.y }];
    }

    function approach(points, slot, frame, sides, axis, radius, mode) {
        const from = points.at(-1);
        const side = from.heading === "east" ? sides.east : sides.west;

        if (mode === "side") {
            const x = from.heading === "down" ? from.x : side;
            if (from.heading !== "down") points.push({ x, y: from.y });
            points.push({ x, y: sides.low }, { x: axis, y: sides.low }, { x: axis, y: slot.y }, slot);
            return;
        }

        const y = Math.max(from.y + radius, frame.top - radius);
        if (from.heading === "down") points.push({ x: from.x, y });
        else points.push({ x: side, y: from.y }, { x: side, y });
        points.push({ x: slot.x, y }, slot);
    }

    function depart(line, slot, frame, axis, height) {
        const tie = number(line.board, "--thread-tie");

        if (text(line.board, "--thread-exit") === "down") {
            const floor = frame.bottom + tie;
            return { points: [slot, { x: slot.x, y: floor }, { x: axis, y: floor }, { x: axis, y: height + 1 }], knot: null };
        }

        const side = Math.min(axis, frame.left - number(line.board, "--thread-turn"));
        const knot = { x: axis, y: height - tie, sharp: true };
        return { points: [slot, { x: side, y: slot.y }, ...(side === axis ? [] : [{ x: side, y: knot.y }]), knot, { x: axis, y: height + 1 }], knot };
    }

    function rounded(points, radius) {
        return points.slice(1).map((corner, i) => {
            const before = points[i];
            const after = points[i + 2];
            if (!after || corner.sharp) return `L${corner.x} ${corner.y}`;
            const r = Math.min(radius, distance(before, corner) / 2, distance(corner, after) / 2);
            const enter = toward(corner, before, r);
            const leave = toward(corner, after, r);
            return `L${enter.x} ${enter.y} Q${corner.x} ${corner.y} ${leave.x} ${leave.y}`;
        }).join(" ");
    }

    function distance(a, b) {
        return Math.hypot(b.x - a.x, b.y - a.y);
    }

    function toward(from, to, r) {
        const length = distance(from, to) || 1;
        return { x: from.x + ((to.x - from.x) / length) * r, y: from.y + ((to.y - from.y) / length) * r };
    }

    function measure(line, marks) {
        const probe = shape("path");
        line.svg.append(probe);
        const length = (d) => {
            probe.setAttribute("d", d);
            return probe.getTotalLength();
        };
        const total = length(marks.at(-1)[1]);
        const at = Object.fromEntries(marks.map(([key, d]) => [key, length(d) / total]));
        probe.remove();
        return at;
    }

    function lowest(line, d) {
        const probe = shape("path");
        probe.setAttribute("d", d);
        line.svg.append(probe);
        const { y, height } = probe.getBBox();
        probe.remove();
        return y + height;
    }

    function place(mark, point, at) {
        center(mark, point);
        mark.style.setProperty("--at", at);
    }

    function span(el, from, to) {
        el.style.setProperty("--thread-from", from);
        el.style.setProperty("--thread-to", to);
    }

    function follow(line, view, edge) {
        const offset = offsetOf(line);
        let free = -Infinity;

        line.followers.forEach((el) => {
            const key = el.dataset.threadFollow;
            const [from, to] = key === "board" ? ["slot", "outline"] : [`entry${key}`, `exit${key}`];
            const start = Math.max(timeOf(line, from), box(line, el).bottom + offset - edge + MARGIN * view, free);

            free = start + timeOf(line, to) - timeOf(line, from);
            span(el, threadAt(line, start), threadAt(line, free));
        });
    }

    function timeOf(line, key) {
        const value = line.at[key];
        const [start, end, from, to] = line.course.find(([, , a, b]) => value >= a && value <= b) || line.course.at(-1);
        return start + (end - start) * ((value - from) / (to - from || 1));
    }

    function threadAt(line, time) {
        const [start, end, from, to] = line.course.findLast(([begin]) => begin <= time) || line.course[0];
        return from + (to - from) * Math.min(1, Math.max(0, (time - start) / (end - start || 1)));
    }

    function chain(line) {
        const keys = ["origin", ...line.stops.flatMap((_, k) => [`entry${k}`, `middle${k}`, `exit${k}`]), line.board ? "slot" : "end"];
        const rest = line.board ? ["outline", ...(line.route.knot ? ["knot"] : []), "end"] : [];
        return {
            pass: keys.slice(1).map((to, i) => ({ from: keys[i], to, slow: to.startsWith("middle") || to.startsWith("exit") })),
            tail: rest.slice(1).map((to, i) => ({ from: rest[i], to })),
        };
    }

    function compose(line) {
        const trigger = line.flow.scrollTrigger;
        const progress = trigger ? trigger.progress : 0;
        const view = innerHeight;
        const below = view * (1 - parseFloat(reading()) / 100);
        const shift = line.intro ? view - below : 0;
        const end = line.section.offsetHeight - shift;
        const { pass, tail } = chain(line);
        const rest = pass.slice(line.covered);
        let settle = rest.length ? Math.max(0, end - below) : 0;

        line.flow.clear();
        line.course = [];
        if (rest.length) {
            const from = line.intro ? 0 : line.route.origin.y;
            const arrive = arrival(line, from, settle, end, view, below + shift);
            pace(line, rest, from, arrive, shift);
            if (line.board) settle = Math.max(settle, reveal(line, arrive, view));
        }
        if (line.board) addSnap(line, tail, settle, end, view);
        redraw(line.flow.set({}, {}, end), progress);
        follow(line, view, below + shift);
    }

    function arrival(line, from, settle, end, view, edge) {
        if (!line.board) return Math.max(from + 1, settle);
        const visible = Math.max(from + ROUTE * view, settle - REVEAL * view, line.route.low - edge + MARGIN * view);
        return Math.max(from + 1, Math.min(visible, end - (TAIL + REVEAL + SNAP) * view));
    }

    function pace(line, pieces, from, until, shift) {
        let start = from;
        let rest = pieces;

        line.route.anchors.forEach(([key, time]) => {
            const moment = time - shift;
            const cut = rest.findIndex((piece) => piece.to === key) + 1;
            if (!cut || moment <= start || moment >= until) return;
            stretch(line, line.flow, rest.slice(0, cut), start, moment);
            rest = rest.slice(cut);
            start = moment;
        });
        stretch(line, line.flow, rest, start, until);
    }

    function reveal(line, at, view) {
        const shown = at + OUTLINE * view;

        advance(line.flow, line, "slot", "outline", OUTLINE * view, at);
        line.flow.fromTo(line.piece, { autoAlpha: 0 }, { autoAlpha: 1, duration: APPEAR * view, immediateRender: false }, shown)
          .fromTo(line.bands, { attr: { height: 0 } }, { attr: { height: line.band }, duration: (BANDS * view) / 2, stagger: (BANDS * view) / 4, ease: "power2.out", immediateRender: false }, shown + APPEAR * view);
        return shown + (APPEAR + BANDS) * view;
    }

    function addSnap(line, tail, settle, end, view) {
        const snap = SNAP * view;

        line.flow.fromTo(line.piece, lifted(line), { x: 0, y: 0, rotation: 0, scale: 1, duration: snap, ease: "back.out(3)", immediateRender: false }, settle)
          .fromTo(line.board, { "--lifted": 1 }, { "--lifted": 0, duration: snap, immediateRender: false }, settle);
        if (line.placed) line.flow.fromTo(line.placed, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: snap / 2, immediateRender: false }, settle + snap / 2);
        stretch(line, line.flow, tail, settle + snap, Math.max(settle + snap + 1, end));
    }

    function stretch(line, timeline, pieces, from, until) {
        const weights = pieces.map((piece) => (line.at[piece.to] - line.at[piece.from]) * (piece.slow ? SLOW : 1));
        const sum = weights.reduce((a, b) => a + b, 0) || 1;
        let at = from;

        pieces.forEach((piece, i) => {
            const time = (weights[i] / sum) * (until - from);
            advance(timeline, line, piece.from, piece.to, time, at);
            at += time;
            if (piece.to.startsWith("exit") && timeline === line.prelude) timeline.call(announce, [line.board], at);
        });
        return at;
    }

    function intro(line) {
        const timeline = gsap.timeline({ paused: true, defaults: { ease: "none" } });

        define(line.section, () => timeline);
        document.addEventListener("story:arrived", () => timeline.progress(1, true), { once: true });
        return timeline;
    }

    function prepare(line) {
        const progress = line.prelude.progress();
        const { pass } = chain(line);

        if (progress) {
            redraw(line.prelude, progress);
            return;
        }
        line.covered = coverage(line, pass);
        line.prelude.clear().call(phase, [line.dot], 0);
        if (line.covered < pass.length || !line.board) {
            stretch(line, line.prelude, pass.slice(0, line.covered), 0, TRACE);
            return;
        }
        const at = stretch(line, line.prelude, [...pass, { from: "slot", to: "outline" }], 0, TRACE);
        line.prelude.fromTo(line.piece, { autoAlpha: 0 }, { autoAlpha: 1, duration: SHOW, immediateRender: false }, at)
          .fromTo(line.bands, { attr: { height: 0 } }, { attr: { height: line.band }, duration: FILL, ease: "power2.out", stagger: STAGGER, immediateRender: false }, at + SHOW);
    }

    function coverage(line, pass) {
        const limit = innerHeight * (1 - MARGIN);
        const hidden = line.route.exits.findIndex((y) => y > limit);

        if (hidden > -1) return pass.findIndex((piece) => piece.to === `exit${hidden - 1}`) + 1;
        return !line.board || line.route.low <= limit ? pass.length : pass.length - 1;
    }

    function redraw(timeline, progress) {
        timeline.invalidate().progress(0, true).progress(progress, true);
    }

    function advance(timeline, line, from, to, duration, at) {
        if (timeline === line.flow) line.course.push([at, at + duration, line.at[from], line.at[to]]);
        timeline.fromTo(line.section, { "--thread": () => line.at[from] }, { "--thread": () => line.at[to], duration, ease: "none", immediateRender: false }, at);
    }

    function greet(line) {
        if (!line.intro) phase(line.dot);
    }

    function announce(goal) {
        document.dispatchEvent(new CustomEvent("thread:pass", { detail: goal }));
    }

    function phase(bead) {
        document.dispatchEvent(new CustomEvent("story:phase", { detail: bead }));
    }

    function reading() {
        return text(document.documentElement, "--thread-read");
    }

    function addMark(line, name) {
        const mark = shape("circle");
        mark.classList.add(name);
        line.svg.querySelector(".thread-marks").append(mark);
        return mark;
    }

    function shape(name) {
        return document.createElementNS(SVG, name);
    }

    function center(mark, point) {
        mark.setAttribute("cx", point.x);
        mark.setAttribute("cy", point.y);
    }

    function box(line, el) {
        const frame = line.svg.getBoundingClientRect();
        const scale = line.host.offsetWidth ? line.host.getBoundingClientRect().width / line.host.offsetWidth : 1;
        const rect = el.getBoundingClientRect();
        const left = (rect.left - frame.left) / scale;
        const top = (rect.top - frame.top) / scale;
        const width = rect.width / scale;
        const height = rect.height / scale;
        return { left, top, width, height, right: left + width, bottom: top + height, x: left + width / 2, y: top + height / 2 };
    }

    function size(line) {
        return { width: line.host.offsetWidth, height: line.host.offsetHeight };
    }

    function watch(layout, ...elements) {
        const observer = new ResizeObserver(layout);
        elements.forEach((el) => observer.observe(el));
    }

    function art(frame) {
        const scale = frame.width / BOARD;
        const x = frame.left + INSET * scale;
        const y = frame.top + INSET * scale;
        const size = (BOARD - INSET * 2) * scale;
        return { x, y, size, right: x + size, bottom: y + size };
    }

    function jigsaw(square, row, from = 0) {
        const unit = square.size / ROWS;
        const top = square.y + (row - 1) * unit;
        const corners = [[square.x, top], [square.right, top], [square.right, top + unit], [square.x, top + unit]];
        const knob = square.size * TAB;
        const above = SEAMS[row - 2];
        const below = SEAMS[row - 1];
        const seams = [above && [above[0], -above[1], knob], null, below && [1 - below[0], below[1], knob], null];
        const order = [0, 1, 2, 3].map((k) => (k + from) % 4);
        const d = order.reduce((path, i) => path + edge(corners[i], corners[(i + 1) % 4], seams[i]), `M${corners[from].join(" ")}`) + " Z";
        return { d, start: { x: corners[from][0], y: corners[from][1] } };
    }

    function edge([ax, ay], [bx, by], seam) {
        if (!seam) return ` L${bx} ${by}`;
        const [at, side, knob] = seam;
        const length = Math.hypot(bx - ax, by - ay);
        const ux = (bx - ax) / length;
        const uy = (by - ay) / length;
        const spot = ([t, h]) => {
            const along = at * length + (t - 0.5) * knob;
            const out = h * side * knob;
            return `${ax + ux * along + uy * out} ${ay + uy * along - ux * out}`;
        };
        const [neck, ...curve] = KNOB.map(spot);
        return ` L${neck} C${curve.slice(0, 3).join(" ")} C${curve.slice(3, 6).join(" ")} C${curve.slice(6).join(" ")} L${bx} ${by}`;
    }

    function board(el, row) {
        const square = art({ left: 0, top: 0, width: BOARD });
        const unit = square.size / ROWS;
        const reach = square.size * TAB * Math.max(...KNOB.map(([, h]) => h));
        const rows = Array.from({ length: ROWS }, (_, i) => i + 1);
        const outline = (r) => jigsaw(square, r).d;
        const shapes = [rows.filter((r) => r < row).map(outline).join(" "), outline(row)];
        const bands = el.querySelectorAll(".board-band");
        const band = (unit + reach * 2) / bands.length;
        const top = square.y + (row - 1) * unit - reach;

        el.querySelectorAll(".board-cut").forEach((cut, i) => cut.setAttribute("d", shapes[i]));
        el.querySelectorAll(".board-line").forEach((line, i) => line.setAttribute("d", shapes[i]));
        el.querySelector(".board-ghost").setAttribute("d", rows.filter((r) => r > row).map(outline).join(" "));
        bands.forEach((rect, i) => gsap.set(rect, { attr: { x: 0, y: top + i * band, width: BOARD, height: band } }));
        el.querySelectorAll(".board-label").forEach((label, i) => label.style.setProperty("--y", `${((square.y + (row + i + 0.5) * unit) / BOARD) * 100}%`));
    }

    function text(el, name) {
        return getComputedStyle(el).getPropertyValue(name).trim();
    }

    function number(el, name) {
        return parseFloat(text(el, name)) || 0;
    }

    function define(section, intro) {
        passes.set(section, { intro, claimed: false });
    }

    function claim(section) {
        const pass = passes.get(section);
        if (!pass || pass.claimed) return null;
        pass.claimed = true;
        return pass.intro();
    }

    document.addEventListener("components:loaded", start, { once: true });

    return { claim };
})();
