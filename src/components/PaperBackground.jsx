import React, { useLayoutEffect, useRef } from "react";
import { createNoise4D } from "simplex-noise";

/**
 * PaperBackground — procedurally generates an old-book paper texture.
 *
 * Optimization strategy:
 *   1. Generate a small 256×256 noise TILE using 4D noise sampled on a torus,
 *      which guarantees the tile is seamlessly repeating (no visible grid).
 *   2. Use ctx.createPattern() to fill the full-size canvas with the tile —
 *      this is hardware-accelerated and ~300× faster than per-pixel noise on
 *      a full retina canvas.
 *   3. Foxing spots and vignette are drawn at full resolution on top, so
 *      they appear once (not tiled) and remain crisp.
 *   4. Canvas internal resolution = CSS size × devicePixelRatio, so the
 *      output is always crisp on retina/mobile screens.
 *
 * Parent must be position: relative (or any non-static).
 */
export default function PaperBackground({ seed = 1, className = "" }) {
    const canvasRef = useRef(null);
    const wrapperRef = useRef(null);

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const wrapper = wrapperRef.current;
        if (!canvas || !wrapper) return;

        const draw = () => {
            const dpr = window.devicePixelRatio || 1;
            const cssWidth = wrapper.clientWidth;
            const cssHeight = wrapper.clientHeight;
            if (cssWidth === 0 || cssHeight === 0) return;

            canvas.width = Math.floor(cssWidth * dpr);
            canvas.height = Math.floor(cssHeight * dpr);
            canvas.style.width = cssWidth + "px";
            canvas.style.height = cssHeight + "px";

            const ctx = canvas.getContext("2d");
            const w = canvas.width;
            const h = canvas.height;

            const seededRandom = mulberry32(seed);
            const noise4D = createNoise4D(seededRandom);

            // === STEP 1: Build a small seamless noise tile ===
            const TILE = 256;
            const tileCanvas = document.createElement("canvas");
            tileCanvas.width = TILE;
            tileCanvas.height = TILE;
            const tCtx = tileCanvas.getContext("2d");

            // Base cream fill
            tCtx.fillStyle = "#f0e6cc";
            tCtx.fillRect(0, 0, TILE, TILE);

            const tileData = tCtx.getImageData(0, 0, TILE, TILE);
            const td = tileData.data;

            // Two octaves of seamless noise: fine fiber + coarse mottling.
            // 4D-on-torus trick: sample (cos(u), sin(u), cos(v), sin(v)) so the
            // tile wraps perfectly. Different "radii" per octave give different
            // feature sizes without breaking seamlessness.
            const TWO_PI = Math.PI * 2;
            const fineRadius = 4;     // tighter loops → finer fiber detail
            const coarseRadius = 1.2; // wider loops → broad mottling

            for (let y = 0; y < TILE; y++) {
                for (let x = 0; x < TILE; x++) {
                    const u = (x / TILE) * TWO_PI;
                    const v = (y / TILE) * TWO_PI;

                    const fine = noise4D(
                        Math.cos(u) * fineRadius,
                        Math.sin(u) * fineRadius,
                        Math.cos(v) * fineRadius,
                        Math.sin(v) * fineRadius
                    );
                    const coarse = noise4D(
                        Math.cos(u) * coarseRadius + 100,
                        Math.sin(u) * coarseRadius + 100,
                        Math.cos(v) * coarseRadius + 100,
                        Math.sin(v) * coarseRadius + 100
                    );

                    const combined = fine * 0.55 + coarse * 0.45; // -1..1
                    const darken = Math.max(0, combined) * 0.20;  // strength

                    const idx = (y * TILE + x) * 4;
                    td[idx] = td[idx] * (1 - darken * 0.45);
                    td[idx + 1] = td[idx + 1] * (1 - darken * 0.55);
                    td[idx + 2] = td[idx + 2] * (1 - darken * 0.70);
                }
            }
            tCtx.putImageData(tileData, 0, 0);

            // === STEP 2: Paint the full canvas using the tile as a pattern ===
            // Pattern repeats automatically, hardware-accelerated.
            const pattern = ctx.createPattern(tileCanvas, "repeat");
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, w, h);

            // === STEP 3: Foxing spots — drawn once at full resolution ===
            const spotCount = Math.floor((cssWidth * cssHeight) / 25000);
            for (let i = 0; i < spotCount; i++) {
                const cx = seededRandom() * w;
                const cy = seededRandom() * h;
                const radius = (3 + seededRandom() * 12) * dpr;
                const alpha = 0.10 + seededRandom() * 0.18;

                const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
                g.addColorStop(0, `rgba(120, 75, 35, ${alpha})`);
                g.addColorStop(0.6, `rgba(140, 90, 50, ${alpha * 0.5})`);
                g.addColorStop(1, "rgba(140, 90, 50, 0)");
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, TWO_PI);
                ctx.fill();
            }

            // === STEP 4: Soft vignette ===
            const vignette = ctx.createRadialGradient(
                w / 2, h / 2, Math.min(w, h) * 0.35,
                w / 2, h / 2, Math.max(w, h) * 0.7
            );
            vignette.addColorStop(0, "rgba(120, 85, 45, 0)");
            vignette.addColorStop(1, "rgba(100, 65, 30, 0.22)");
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, w, h);

            // === STEP 5: Soft rough edge — the paper "fades out" near the boundary
            // with noise-modulated darkening, so the rectangular edge looks organic. ===
            const edgeData = ctx.getImageData(0, 0, w, h);
            const ed = edgeData.data;
            const edgeFreq = 0.04 * dpr;       // controls roughness — bigger = jaggier
            const edgeWidth = 8 * dpr;          // how far in from the edge the effect reaches
            const edgeStrength = 0.55;          // 0..1, how dark the edge gets

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    // Distance from the nearest edge in pixels
                    const distX = Math.min(x, w - 1 - x);
                    const distY = Math.min(y, h - 1 - y);
                    const dist = Math.min(distX, distY);
                    if (dist > edgeWidth) continue;

                    // Add noise to the effective distance so the edge wavers in/out
                    // instead of being a perfect ring.
                    const wobble = noise4D(
                        x * edgeFreq, y * edgeFreq,
                        Math.cos(x * edgeFreq * 0.3), Math.sin(y * edgeFreq * 0.3)
                    ) * edgeWidth * 0.6;

                    const effectiveDist = Math.max(0, dist + wobble);
                    if (effectiveDist > edgeWidth) continue;

                    // Falloff: closest to edge → strongest darkening
                    const t = 1 - effectiveDist / edgeWidth;
                    const darken = t * t * edgeStrength; // ease-in for soft transition

                    const idx = (y * w + x) * 4;
                    ed[idx] = ed[idx] * (1 - darken * 0.55);
                    ed[idx + 1] = ed[idx + 1] * (1 - darken * 0.65);
                    ed[idx + 2] = ed[idx + 2] * (1 - darken * 0.78);
                }
            }
            ctx.putImageData(edgeData, 0, 0);
        };

        draw();

        const ro = new ResizeObserver(draw);
        ro.observe(wrapper);

        return () => ro.disconnect();
    }, [seed]);

    return (
        <div
            ref={wrapperRef}
            className={`paper-bg-wrapper ${className}`}
            aria-hidden="true"
        >
            <canvas ref={canvasRef} className="paper-bg-canvas" />
        </div>
    );
}

function mulberry32(a) {
    return function () {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}