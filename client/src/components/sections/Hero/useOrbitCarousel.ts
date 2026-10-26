import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { layoutOrbit, wrapIndex } from "./orbit";

const AUTOPLAY_MS = 5500;
const ROTATE_SECONDS = 1.8;

/**
 * Drives a circular carousel: GSAP animates a continuous rotation value and
 * `layoutOrbit` applies it to the slide nodes each frame.
 */
export function useOrbitCarousel(count: number) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  // True once the orbit has fully stopped; used to trigger the single glow breath.
  const [settled, setSettled] = useState(true);

  const nodes = useRef<(HTMLElement | null)[]>([]);
  const rotation = useRef({ value: 0 });
  const target = useRef(0); // unwrapped destination of the rotation, in slides

  useLayoutEffect(() => {
    layoutOrbit(nodes.current, 0);
    const state = rotation.current;
    return () => {
      gsap.killTweensOf(state);
    };
  }, []);

  const rotateTo = useCallback(
    (nextTarget: number) => {
      target.current = nextTarget;
      setCurrent(wrapIndex(nextTarget, count));
      setSettled(false);

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      gsap.to(rotation.current, {
        value: nextTarget,
        duration: reduceMotion ? 0 : ROTATE_SECONDS,
        ease: "power3.inOut",
        overwrite: "auto",
        onUpdate: () => layoutOrbit(nodes.current, rotation.current.value),
        onComplete: () => setSettled(true),
      });
    },
    [count],
  );

  /** Rotates by the shortest path to the given slide index. */
  const goTo = useCallback(
    (index: number) => {
      let delta = wrapIndex(index, count) - wrapIndex(target.current, count);
      if (delta > count / 2) delta -= count;
      if (delta < -count / 2) delta += count;
      if (delta !== 0) rotateTo(target.current + delta);
    },
    [count, rotateTo],
  );

  const step = useCallback(
    (direction: 1 | -1) => rotateTo(target.current + direction),
    [rotateTo],
  );

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => step(1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [current, paused, step]);

  /** Returns a ref callback that registers the node of slide `index`. */
  const registerSlide = useCallback(
    (index: number) => (node: HTMLElement | null) => {
      nodes.current[index] = node;
    },
    [],
  );

  return { current, settled, setPaused, goTo, step, registerSlide };
}

