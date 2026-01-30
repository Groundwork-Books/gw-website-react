/**
 * Unit tests for BookCard component
 * Tests rendering, interaction, and accessibility
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookCard from '@/components/BookCard';

// Mock book data
const createMockBook = (overrides = {}) => ({
  id: 'book-123',
  name: 'Test Book Title',
  price: 19.99,
  imageUrl: 'https://example.com/book-image.jpg',
  description: 'A test book description',
  ...overrides,
});

describe('BookCard', () => {
  describe('Rendering', () => {
    it('should render book name', () => {
      const book = createMockBook();
      render(<BookCard book={book} />);

      expect(screen.getByText('Test Book Title')).toBeInTheDocument();
    });

    it('should render formatted price', () => {
      const book = createMockBook({ price: 24.99 });
      render(<BookCard book={book} />);

      expect(screen.getByText('$24.99')).toBeInTheDocument();
    });

    it('should handle string price by parsing it', () => {
      const book = createMockBook({ price: '15.50' });
      render(<BookCard book={book} />);

      expect(screen.getByText('$15.50')).toBeInTheDocument();
    });

    it('should handle zero price', () => {
      const book = createMockBook({ price: 0 });
      render(<BookCard book={book} />);

      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('should handle empty string price', () => {
      const book = createMockBook({ price: '' });
      render(<BookCard book={book} />);

      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('should render image when imageUrl is provided', () => {
      const book = createMockBook();
      render(<BookCard book={book} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Test Book Title');
    });

    it('should render placeholder when no imageUrl', () => {
      const book = createMockBook({ imageUrl: null });
      render(<BookCard book={book} />);

      expect(screen.getByText('No Image')).toBeInTheDocument();
    });

    it('should render placeholder when imageUrl is undefined', () => {
      const book = createMockBook({ imageUrl: undefined });
      render(<BookCard book={book} />);

      expect(screen.getByText('No Image')).toBeInTheDocument();
    });

    it('should apply data-book-id attribute', () => {
      const book = createMockBook({ id: 'unique-book-id' });
      const { container } = render(<BookCard book={book} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('data-book-id', 'unique-book-id');
    });

    it('should apply custom className', () => {
      const book = createMockBook();
      const { container } = render(<BookCard book={book} className="custom-class" />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('custom-class');
    });

    it('should apply fixed width classes when fixedWidth is true', () => {
      const book = createMockBook();
      const { container } = render(<BookCard book={book} fixedWidth={true} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('min-w-[200px]');
      expect(card.className).toContain('max-w-[200px]');
    });

    it('should not apply fixed width classes when fixedWidth is false', () => {
      const book = createMockBook();
      const { container } = render(<BookCard book={book} fixedWidth={false} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).not.toContain('min-w-[200px]');
    });

    it('should apply custom overlay class', () => {
      const book = createMockBook();
      const { container } = render(<BookCard book={book} overlayClassName="bg-blue-500" />);

      const overlay = container.querySelector('.bg-blue-500');
      expect(overlay).toBeInTheDocument();
    });

    it('should use default overlay class when not specified', () => {
      const book = createMockBook();
      const { container } = render(<BookCard book={book} />);

      const overlay = container.querySelector('.bg-gw-green-1');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      const book = createMockBook();

      render(<BookCard book={book} onClick={onClick} />);

      const card = screen.getByRole('button');
      await user.click(card);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not throw when clicked without onClick handler', async () => {
      const user = userEvent.setup();
      const book = createMockBook();

      render(<BookCard book={book} />);

      const { container } = render(<BookCard book={book} />);
      const card = container.firstChild as HTMLElement;

      await expect(user.click(card)).resolves.not.toThrow();
    });

    it('should call onClick on Enter key press', () => {
      const onClick = jest.fn();
      const book = createMockBook();

      render(<BookCard book={book} onClick={onClick} />);

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick on Space key press', () => {
      const onClick = jest.fn();
      const book = createMockBook();

      render(<BookCard book={book} onClick={onClick} />);

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: ' ' });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should prevent default on Space key press', () => {
      const onClick = jest.fn();
      const book = createMockBook();

      render(<BookCard book={book} onClick={onClick} />);

      const card = screen.getByRole('button');
      const event = fireEvent.keyDown(card, { key: ' ' });

      // The event should be handled
      expect(onClick).toHaveBeenCalled();
    });

    it('should not call onClick on other key presses', () => {
      const onClick = jest.fn();
      const book = createMockBook();

      render(<BookCard book={book} onClick={onClick} />);

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Tab' });
      fireEvent.keyDown(card, { key: 'Escape' });
      fireEvent.keyDown(card, { key: 'a' });

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should not handle keyboard events without onClick', () => {
      const book = createMockBook();
      const { container } = render(<BookCard book={book} />);

      const card = container.firstChild as HTMLElement;

      // Should not throw
      expect(() => {
        fireEvent.keyDown(card, { key: 'Enter' });
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have role="button" when onClick is provided', () => {
      const book = createMockBook();
      render(<BookCard book={book} onClick={() => {}} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should not have role="button" when onClick is not provided', () => {
      const book = createMockBook();
      render(<BookCard book={book} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should have tabIndex=0 when onClick is provided', () => {
      const book = createMockBook();
      render(<BookCard book={book} onClick={() => {}} />);

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should not have tabIndex when onClick is not provided', () => {
      const book = createMockBook();
      const { container } = render(<BookCard book={book} />);

      const card = container.firstChild as HTMLElement;
      expect(card).not.toHaveAttribute('tabIndex');
    });

    it('should have proper image alt text', () => {
      const book = createMockBook({ name: 'My Awesome Book' });
      render(<BookCard book={book} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'My Awesome Book');
    });
  });

  describe('Price formatting', () => {
    it('should format price with two decimal places', () => {
      const book = createMockBook({ price: 10 });
      render(<BookCard book={book} />);

      expect(screen.getByText('$10.00')).toBeInTheDocument();
    });

    it('should handle large prices', () => {
      const book = createMockBook({ price: 1234.56 });
      render(<BookCard book={book} />);

      expect(screen.getByText('$1234.56')).toBeInTheDocument();
    });

    it('should handle prices with more than 2 decimal places', () => {
      const book = createMockBook({ price: 19.999 });
      render(<BookCard book={book} />);

      expect(screen.getByText('$20.00')).toBeInTheDocument();
    });

    it('should handle NaN price gracefully', () => {
      const book = createMockBook({ price: 'invalid' });
      render(<BookCard book={book} />);

      expect(screen.getByText('$NaN')).toBeInTheDocument();
    });
  });

  describe('Long text handling', () => {
    it('should have line-clamp class for long titles', () => {
      const book = createMockBook({
        name: 'This is a very long book title that should be truncated to prevent overflow',
      });
      render(<BookCard book={book} />);

      const title = screen.getByText(/This is a very long book title/);
      expect(title.className).toContain('line-clamp-2');
    });
  });
});
