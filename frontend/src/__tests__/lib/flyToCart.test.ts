/**
 * Unit tests for flyToCart.ts
 * Tests the fly-to-cart animation utility
 */

import { flyToCart } from '@/lib/flyToCart';

// Mock DOM elements and methods
const createMockElement = (rect: Partial<DOMRect> = {}): HTMLElement => {
  const element = document.createElement('div');
  element.getBoundingClientRect = jest.fn(() => ({
    top: 100,
    left: 100,
    bottom: 200,
    right: 200,
    width: 100,
    height: 100,
    x: 100,
    y: 100,
    toJSON: () => ({}),
    ...rect,
  }));
  return element;
};

describe('flyToCart', () => {
  let cartElement: HTMLElement;
  let sourceElement: HTMLElement;
  let dispatchEventSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';

    // Create cart element
    cartElement = document.createElement('div');
    cartElement.id = 'cart-icon-anchor';
    cartElement.getBoundingClientRect = jest.fn(() => ({
      top: 50,
      left: 500,
      bottom: 72,
      right: 522,
      width: 22,
      height: 22,
      x: 500,
      y: 50,
      toJSON: () => ({}),
    }));
    document.body.appendChild(cartElement);

    // Create source element
    sourceElement = createMockElement();
    document.body.appendChild(sourceElement);

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });

    // Mock dispatchEvent
    dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

    // Mock performance.now
    jest.spyOn(performance, 'now').mockReturnValue(0);

    // Reset matchMedia to not prefer reduced motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('Basic functionality', () => {
    it('should not throw when called with valid elements', () => {
      expect(() => {
        flyToCart(sourceElement);
      }).not.toThrow();
    });

    it('should do nothing when cart element is not found', () => {
      document.body.innerHTML = ''; // Remove cart element

      flyToCart(sourceElement);

      // Should not dispatch any events since cart is not found
      expect(dispatchEventSpy).not.toHaveBeenCalled();
    });

    it('should dispatch cart:ping when fromEl is null', () => {
      flyToCart(null);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'cart:ping' })
      );
    });

    it('should create a ghost element in the DOM', () => {
      flyToCart(sourceElement);

      // Ghost element should be added to body
      const ghost = document.body.querySelector('[aria-hidden="true"]');
      expect(ghost).toBeInTheDocument();
    });

    it('should set ghost element to fixed position', () => {
      flyToCart(sourceElement);

      const ghost = document.body.querySelector('[aria-hidden="true"]') as HTMLElement;
      expect(ghost?.style.position).toBe('fixed');
    });

    it('should set high z-index on ghost element', () => {
      flyToCart(sourceElement);

      const ghost = document.body.querySelector('[aria-hidden="true"]') as HTMLElement;
      expect(ghost?.style.zIndex).toBe('9999');
    });
  });

  describe('Reduced motion', () => {
    it('should respect OS reduced motion preference', () => {
      // Mock matchMedia to return reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      flyToCart(sourceElement);

      // Should just dispatch ping without animation
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'cart:ping' })
      );

      // Should not create ghost element
      const ghosts = document.body.querySelectorAll('[aria-hidden="true"]');
      expect(ghosts.length).toBe(0);
    });

    it('should ignore reduced motion when ignoreReducedMotion is true', () => {
      // Mock matchMedia to return reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      flyToCart(sourceElement, { ignoreReducedMotion: true });

      // Ghost element should be created
      const ghost = document.body.querySelector('[aria-hidden="true"]');
      expect(ghost).toBeInTheDocument();
    });

    it('should not respect reduced motion when respectReducedMotion is false', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      flyToCart(sourceElement, { respectReducedMotion: false });

      const ghost = document.body.querySelector('[aria-hidden="true"]');
      expect(ghost).toBeInTheDocument();
    });
  });

  describe('Viewport checks', () => {
    it('should dispatch ping when source is off screen (above)', () => {
      sourceElement.getBoundingClientRect = jest.fn(() => ({
        top: -200,
        left: 100,
        bottom: -100,
        right: 200,
        width: 100,
        height: 100,
        x: 100,
        y: -200,
        toJSON: () => ({}),
      }));

      flyToCart(sourceElement);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'cart:ping' })
      );
    });

    it('should dispatch ping when source is off screen (below)', () => {
      sourceElement.getBoundingClientRect = jest.fn(() => ({
        top: 900,
        left: 100,
        bottom: 1000,
        right: 200,
        width: 100,
        height: 100,
        x: 100,
        y: 900,
        toJSON: () => ({}),
      }));

      flyToCart(sourceElement);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'cart:ping' })
      );
    });

    it('should dispatch ping when source is off screen (left)', () => {
      sourceElement.getBoundingClientRect = jest.fn(() => ({
        top: 100,
        left: -200,
        bottom: 200,
        right: -100,
        width: 100,
        height: 100,
        x: -200,
        y: 100,
        toJSON: () => ({}),
      }));

      flyToCart(sourceElement);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'cart:ping' })
      );
    });

    it('should dispatch ping when source is off screen (right)', () => {
      sourceElement.getBoundingClientRect = jest.fn(() => ({
        top: 100,
        left: 1200,
        bottom: 200,
        right: 1300,
        width: 100,
        height: 100,
        x: 1200,
        y: 100,
        toJSON: () => ({}),
      }));

      flyToCart(sourceElement);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'cart:ping' })
      );
    });
  });

  describe('Options', () => {
    it('should accept custom duration', () => {
      expect(() => {
        flyToCart(sourceElement, { duration: 500 });
      }).not.toThrow();
    });

    it('should accept custom easing', () => {
      expect(() => {
        flyToCart(sourceElement, { easing: 'linear' });
      }).not.toThrow();
    });

    it('should accept path option "line"', () => {
      expect(() => {
        flyToCart(sourceElement, { path: 'line' });
      }).not.toThrow();
    });

    it('should accept path option "arc"', () => {
      expect(() => {
        flyToCart(sourceElement, { path: 'arc' });
      }).not.toThrow();
    });

    it('should accept custom arcHeight', () => {
      expect(() => {
        flyToCart(sourceElement, { path: 'arc', arcHeight: 200 });
      }).not.toThrow();
    });

    it('should accept minScale and maxScale options', () => {
      expect(() => {
        flyToCart(sourceElement, { minScale: 0.3, maxScale: 10 });
      }).not.toThrow();
    });

    it('should accept ghostImageSrc option', () => {
      expect(() => {
        flyToCart(sourceElement, { ghostImageSrc: 'https://example.com/image.jpg' });
      }).not.toThrow();
    });

    it('should accept ghostBorderRadius option', () => {
      expect(() => {
        flyToCart(sourceElement, { ghostBorderRadius: 10 });
      }).not.toThrow();
    });
  });

  describe('Ghost with image', () => {
    it('should use image from source element when available', () => {
      const img = document.createElement('img');
      img.src = 'https://example.com/book.jpg';
      sourceElement.appendChild(img);

      flyToCart(sourceElement);

      const ghost = document.body.querySelector('[aria-hidden="true"]') as HTMLElement;
      // The ghost should have a background image or contain the image
      expect(ghost).toBeInTheDocument();
    });

    it('should use ghostImageSrc when provided', () => {
      flyToCart(sourceElement, { ghostImageSrc: 'https://example.com/custom.jpg' });

      const ghost = document.body.querySelector('[aria-hidden="true"]') as HTMLElement;
      expect(ghost?.style.backgroundImage).toBe('url("https://example.com/custom.jpg")');
    });

    it('should use SVG ghost when no image is available', () => {
      flyToCart(sourceElement);

      const ghost = document.body.querySelector('[aria-hidden="true"]');
      const svg = ghost?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Style injection', () => {
    it('should inject styles', () => {
      flyToCart(sourceElement);

      // Check that styles are injected
      const styleElement = document.getElementById('fly-to-cart-styles');
      expect(styleElement).toBeInTheDocument();
    });

    it('should not duplicate styles on multiple calls', () => {
      flyToCart(sourceElement);
      flyToCart(sourceElement);
      flyToCart(sourceElement);

      const styles = document.querySelectorAll('#fly-to-cart-styles');
      expect(styles.length).toBe(1);
    });
  });

  describe('Ghost element properties', () => {
    it('should set aria-hidden on ghost', () => {
      flyToCart(sourceElement);

      const ghost = document.body.querySelector('[aria-hidden="true"]');
      expect(ghost).toHaveAttribute('aria-hidden', 'true');
    });

    it('should set pointer-events to none', () => {
      flyToCart(sourceElement);

      const ghost = document.body.querySelector('[aria-hidden="true"]') as HTMLElement;
      expect(ghost?.style.pointerEvents).toBe('none');
    });

    it('should set will-change for performance', () => {
      flyToCart(sourceElement);

      const ghost = document.body.querySelector('[aria-hidden="true"]') as HTMLElement;
      expect(ghost?.style.willChange).toContain('transform');
    });
  });
});
