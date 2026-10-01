"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * Slow dust motes on a canvas, for the bar's background.
 *
 * Deliberately cheap: one pre-rendered glow sprite blitted per mote instead of
 * a fresh radial gradient each frame, capped at 30fps, paused when the canvas
 * leaves the viewport, and static when the visitor asks for reduced motion.
 * The mote colour is read from the palette token, so it can never drift away
 * from the rest of the theme.
 */

type Mote = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  vx: number;
  vy: number;
  phase: number;
};

export type ParticleFieldProps = {
  /** Roughly one mote per this many CSS pixels of canvas. */
  density?: number;
  /** Hard ceiling, for very large viewports. */
  max?: number;
  /** Drift speed in CSS pixels per second. */
  speed?: number;
  style?: CSSProperties;
};

const FALLBACK_INK = "#c8a97e";
const FRAME_MS = 33; // ~30fps: enough for dust, half the work of 60fps

export default function ParticleField({ density = 14000, max = 70, speed = 5, style }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Soft glows gain nothing from a full retina buffer, and clearing one every
    // frame is the bulk of the cost.
    const ratio = Math.min(1.5, window.devicePixelRatio || 1);
    let disposed = false;
    let frame = 0;
    let last = 0;
    let onScreen = true;
    let width = 1;
    let height = 1;
    let motes: Mote[] = [];
    let sprite: HTMLCanvasElement | null = null;

    const between = (min: number, max: number) => min + Math.random() * (max - min);

    /** One soft dot, tinted with the palette's gold by keeping its alpha. */
    const buildSprite = () => {
      const size = 64;
      const dot = document.createElement("canvas");
      dot.width = size;
      dot.height = size;
      const paint = dot.getContext("2d");
      if (!paint) return null;
      const glow = paint.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      glow.addColorStop(0, "rgba(255,255,255,1)");
      glow.addColorStop(0.32, "rgba(255,255,255,.5)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      paint.fillStyle = glow;
      paint.fillRect(0, 0, size, size);
      paint.globalCompositeOperation = "source-in";
      paint.fillStyle = FALLBACK_INK;
      paint.fillStyle = getComputedStyle(canvas).getPropertyValue("--bar-accent").trim() || FALLBACK_INK;
      paint.fillRect(0, 0, size, size);
      return dot;
    };

    const seed = () => {
      const count = Math.max(12, Math.min(max, Math.round((width * height) / density)));
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: between(0.7, 2.1),
        alpha: between(0.16, 0.5),
        vx: between(-speed, speed) * 0.35,
        vy: between(-speed, speed),
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      sprite ??= buildSprite();
      seed();
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      if (!sprite) return;
      // Additive, so motes brighten the room instead of dulling it.
      context.globalCompositeOperation = "lighter";
      for (const mote of motes) {
        const size = mote.radius * 7;
        context.globalAlpha = mote.alpha * (0.7 + 0.3 * Math.sin(time / 1500 + mote.phase));
        context.drawImage(sprite, mote.x - size / 2, mote.y - size / 2, size, size);
      }
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
    };

    const advance = (time: number) => {
      if (time - last < FRAME_MS) return false;
      const delta = Math.min(64, time - last) / 1000;
      last = time;
      for (const mote of motes) {
        mote.x += mote.vx * delta;
        mote.y += mote.vy * delta;
        // Wrap instead of bouncing, so the field never thins out.
        if (mote.x < -8) mote.x = width + 8;
        else if (mote.x > width + 8) mote.x = -8;
        if (mote.y < -8) mote.y = height + 8;
        else if (mote.y > height + 8) mote.y = -8;
      }
      return true;
    };

    const loop = (time: number) => {
      frame = 0;
      // Stop instead of idling: sync() restarts the loop when the canvas comes
      // back on screen or the motion preference changes.
      if (disposed || motion.matches || !onScreen) return;
      if (advance(time)) draw(time);
      frame = requestAnimationFrame(loop);
    };

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const sync = () => {
      stop();
      if (disposed) return;
      if (motion.matches || !onScreen) draw(performance.now());
      else frame = requestAnimationFrame(loop);
    };

    const observer = new ResizeObserver(() => {
      resize();
      if (motion.matches || !onScreen) draw(performance.now());
    });
    observer.observe(canvas);
    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    visibility.observe(canvas);
    motion.addEventListener("change", sync);
    resize();
    sync();

    return () => {
      disposed = true;
      stop();
      observer.disconnect();
      visibility.disconnect();
      motion.removeEventListener("change", sync);
    };
  }, [density, max, speed]);

  return (
    <canvas
      ref={canvasRef}
      data-bar-particles
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        display: "block",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}
