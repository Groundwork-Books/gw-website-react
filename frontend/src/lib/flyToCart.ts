// lib/flyToCart.ts

let stylesInjected = false;

function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.id = 'fly-to-cart-styles';
  style.textContent = `
/* optional soft shadow for the ghost icon */
.fly-bag-shadow { filter: drop-shadow(0 4px 6px rgba(0,0,0,.15)); }
  `;
  document.head.appendChild(style);
}

type FlyOptions = {
  /** Flight duration in ms (default 1000) */
  duration?: number;
  /** Timing function (default 'cubic-bezier(.2,.7,.2,1)'; use 'linear' for constant speed) */
  easing?: string;
  /** Path shape: 'line' (straight) or 'arc' (default 'line' to match your current use) */
  path?: 'line' | 'arc';
  /** Arc height (px) if path = 'arc'; default auto based on distance */
  arcHeight?: number;
  /** Respect OS reduced-motion? (default true) */
  respectReducedMotion?: boolean;
  /** Ignore OS reduced-motion just for this micro-interaction? (default false) */
  ignoreReducedMotion?: boolean;

  /** Element to measure the starting size from (e.g., the modal image). Falls back to fromEl */
  startSizeFromEl?: HTMLElement;
  /** Element to measure the ending size from (defaults to the cart's <svg> if found) */
  endSizeFromEl?: HTMLElement;
  /** Clamp the scale to avoid absurdly huge/small ghosts (defaults shown below) */
  minScale?: number; // default 0.5
  maxScale?: number; // default 8
  ghostImageSrc?: string;
  ghostBorderRadius?: number;
};

function prefersReduced(): boolean {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  } catch {
    return false;
  }
}

function makeGhostFromImage(src: string, radius = 6): HTMLDivElement {
  const ghost = document.createElement('div');
  ghost.setAttribute('aria-hidden', 'true');
  Object.assign(ghost.style, {
    position: 'fixed',
    left: '0', top: '0',
    width: '24px', height: '24px',
    pointerEvents: 'none',
    zIndex: '9999',
    willChange: 'transform, opacity',
    transform: 'translate(-50%, -50%)',
    backgroundImage: `url("${src}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: `${radius}px`,
    boxShadow: '0 4px 6px rgba(0,0,0,.15)',
  } as CSSStyleDeclaration);
  return ghost;
}

function inViewport(r: DOMRect): boolean {
  const vw = innerWidth, vh = innerHeight;
  return r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw;
}

function makeGhost(): HTMLDivElement {
  const ghost = document.createElement('div');
  ghost.setAttribute('aria-hidden', 'true');
  ghost.style.position = 'fixed';
  ghost.style.left = '0';
  ghost.style.top = '0';
  ghost.style.width = '24px';   // base size for scaling math
  ghost.style.height = '24px';
  ghost.style.pointerEvents = 'none';
  ghost.style.zIndex = '9999';
  ghost.style.willChange = 'transform, opacity';
  ghost.style.transform = 'translate(-50%, -50%)'; // keep centered on the point
  ghost.className = 'fly-bag-shadow';
  // simple bag/book icon
  ghost.innerHTML = `
<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style="color:#1D4825">
  <path d="M3 5.5C3 4.12 4.12 3 5.5 3H19a1 1 0 0 1 1 1v12.5a1 1 0 0 1-1 1h-12a2.5 2.5 0 0 0-2.5 2.5V5.5Z"/>
  <path d="M7 5h10v10H7a2 2 0 0 0-2 2V7a2 2 0 0 1 2-2Z" fill="white" opacity=".15"/>
</svg>`;
  return ghost;
}

// Quadratic bezier helper (used for 'arc')
const quad = (t: number, a: number, b: number, c: number) =>
  (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;

/**
 * Fly a small ghost icon from a source element to the cart icon (#cart-icon-anchor),
 * scaling from the start element's size to the cart icon size.
 */
export function flyToCart(fromEl: HTMLElement | null, options: FlyOptions = {}) {
  const {
    duration = 1000,
    easing = 'cubic-bezier(.2,.7,.2,1)',
    path = 'line',
    arcHeight,
    respectReducedMotion = true,
    ignoreReducedMotion = false,
    startSizeFromEl,
    endSizeFromEl,
    minScale = 0.5,
    maxScale = 8,
  } = options;

  const cart = document.querySelector('#cart-icon-anchor') as HTMLElement | null;
  if (!cart) return;

  // Respect OS setting unless explicitly overridden
  if (respectReducedMotion && !ignoreReducedMotion && prefersReduced()) {
    window.dispatchEvent(new CustomEvent('cart:ping'));
    return;
  }

  if (!fromEl) {
    window.dispatchEvent(new CustomEvent('cart:ping'));
    return;
  }

  const from = fromEl.getBoundingClientRect();
  const to = cart.getBoundingClientRect();

  // If source is offscreen, just ping
  if (!inViewport(from)) {
    window.dispatchEvent(new CustomEvent('cart:ping'));
    return;
  }

  injectStyles();
  const imgEl = (startSizeFromEl ?? fromEl).querySelector?.('img') as HTMLImageElement | null;
  const coverSrc = options.ghostImageSrc || imgEl?.currentSrc || imgEl?.src;

  const ghost = coverSrc ? makeGhostFromImage(coverSrc, options.ghostBorderRadius ?? 6)
                          : makeGhost(); // your existing SVG bag
  document.body.appendChild(ghost);

  const startX = from.left + from.width / 2;
  const startY = from.top + from.height / 2;
  const endX   = to.left   + to.width  / 2;
  const endY   = to.top    + to.height / 2;

  // --- SIZE MEASUREMENT ------------------------------------------------------
  const BASE = 24; // matches ghost's width/height above

  // Start size: measure from provided element (e.g., modal image) or fall back to fromEl
  const startSizeSource = (startSizeFromEl ?? fromEl);
  const startRect = startSizeSource.getBoundingClientRect();
  const startW = startRect.width;
  let startScale = startW / BASE;

  // End size: measure the cart's inner SVG if present, else the cart link itself
  const endSizeSource =
    endSizeFromEl ||
    (cart.querySelector('svg') as HTMLElement | null) ||
    cart;
  const endRect = endSizeSource.getBoundingClientRect();
  const endW = endRect.width || 22; // your cart svg is ~22px
  let endScale = endW / BASE;

  // clamp scales to keep things sane
  startScale = Math.max(minScale, Math.min(maxScale, startScale));
  endScale   = Math.max(minScale, Math.min(maxScale, endScale));

  // --- PATH GEOMETRY ---------------------------------------------------------
  // For 'arc', compute a nice control point above the higher endpoint
  const dx = endX - startX;
  const defaultLift = Math.max(160, Math.abs(dx) * 0.25);
  const lift = typeof arcHeight === 'number' ? arcHeight : defaultLift;
  const cx = startX + dx * 0.5;
  const cy = Math.min(startY, endY) - lift;

  // Position function for straight line vs arc
  const getPos = (t: number) => {
    if (path === 'line') {
      return {
        x: startX + (endX - startX) * t,
        y: startY + (endY - startY) * t,
      };
    }
    return {
      x: quad(t, startX, cx, endX),
      y: quad(t, startY, cy, endY),
    };
  };

  const finish = () => {
    ghost.remove();
    window.dispatchEvent(new CustomEvent('cart:ping'));
  };

  // --- Web Animations API branch (type-safe, no `any`) ---
  const element = ghost as Element;
  const maybeAnimate: typeof element.animate | undefined =
    typeof element.animate === 'function' ? element.animate.bind(element) : undefined;

  if (maybeAnimate) {
    const steps = 12; // lightweight + smooth
    const frames: Keyframe[] = Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps;
      const { x, y } = getPos(t);
      const s = startScale + (endScale - startScale) * t; // scale from start → end
      const o = 0.95; // keep visible (no fade)
      return {
        transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${s})`,
        opacity: o,
      };
    });

    let ended = false;
    const safeFinish = () => {
      if (ended) return;
      ended = true;
      window.clearTimeout(safety);
      finish();
    };

    // Safety ping in case animation is interrupted (tab switch, throttling, etc.)
    const safety = window.setTimeout(safeFinish, duration + 120);

    const anim: Animation = maybeAnimate(frames, { duration, easing, fill: 'forwards' });

    // Promise + events for maximum robustness
    anim.finished.then(safeFinish).catch(safeFinish);
    anim.onfinish = safeFinish;
    anim.oncancel = safeFinish;
    return;
  }

  // Fallback: requestAnimationFrame tween
  const startTime = performance.now();
  const ease = (t: number) => {
    if (easing === 'linear') return t;
    // approx ease-in-out if custom bezier isn't available here
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  };

  const tick = (now: number) => {
    const raw = Math.min(1, (now - startTime) / duration);
    const t = ease(raw);
    const { x, y } = getPos(t);
    const s = startScale + (endScale - startScale) * t;
    const o = 0.95;
    ghost.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${s})`;
    ghost.style.opacity = String(o);
    if (raw < 1) {
      requestAnimationFrame(tick);
    } else {
      finish();
    }
  };

  requestAnimationFrame(tick);
}
