/** Geometry of the circular product carousel. */
const ORBIT_RADIUS = 62; // % of a slide's own width
const ORBIT_TILT = 8; // % of a slide's own height; items at the back sit slightly higher

/** Wraps any integer into the range [0, count). */
export const wrapIndex = (index: number, count: number): number =>
  ((index % count) + count) % count;

/**
 * Places every slide on a circular orbit by writing styles straight to the DOM
 * (called on every animation frame, so it deliberately bypasses React).
 *
 * `rotation` is expressed in "slides": 0 = slide 0 in front, 1 = slide 1 in front, ...
 * It is continuous, so slides glide around the circle and pass behind each other.
 * Also sets `--glow` (0..1), which the slide uses to scale its shadow.
 */
export function layoutOrbit(
  nodes: readonly (HTMLElement | null)[],
  rotation: number,
): void {
  const count = nodes.length;

  nodes.forEach((node, i) => {
    if (!node) return;

    const angle = ((i - rotation) / count) * Math.PI * 2;
    const depth = Math.cos(angle); // 1 = front, -1 = back
    const t = (depth + 1) / 2; // 0..1
    const emphasis = Math.pow(t, 1.5);

    const x = Math.sin(angle) * ORBIT_RADIUS;
    const y = -(1 - t) * ORBIT_TILT;
    const scale = 0.5 + 0.5 * emphasis;

    node.style.transform = `translate(-50%, -50%) translate(${x}%, ${y}%) scale(${scale})`;
    node.style.opacity = String(0.25 + 0.75 * emphasis);
    node.style.zIndex = String(Math.round(t * 100));
    node.style.filter = `brightness(${0.45 + 0.55 * emphasis}) blur(${(1 - emphasis) * 2.5}px)`;
    node.style.setProperty("--glow", String(Math.pow(t, 4)));
  });
}

