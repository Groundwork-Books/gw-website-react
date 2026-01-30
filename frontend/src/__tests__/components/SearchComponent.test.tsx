/**
 * Unit tests for SearchComponent
 * Tests form submission, navigation, and clearing functionality
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchComponent from '@/components/SearchComponent';

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('SearchComponent', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('Rendering', () => {
    it('should render search input', () => {
      render(<SearchComponent />);

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should render with default placeholder', () => {
      render(<SearchComponent />);

      const input = screen.getByPlaceholderText(/Search books/);
      expect(input).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(<SearchComponent placeholder="Find your next read" />);

      const input = screen.getByPlaceholderText('Find your next read');
      expect(input).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<SearchComponent className="custom-class" />);

      const form = screen.getByRole('textbox').closest('form');
      expect(form?.className).toContain('custom-class');
    });

    it('should not show clear button when input is empty', () => {
      render(<SearchComponent />);

      const clearButton = screen.queryByRole('button', { name: /clear/i });
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe('Input behavior', () => {
    it('should update input value when typing', async () => {
      const user = userEvent.setup();
      render(<SearchComponent />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test query');

      expect(input).toHaveValue('test query');
    });

    it('should show clear button when input has value', async () => {
      const user = userEvent.setup();
      render(<SearchComponent />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('should clear input when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<SearchComponent />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test query');

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(input).toHaveValue('');
    });

    it('should focus input after clearing', async () => {
      const user = userEvent.setup();
      render(<SearchComponent />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(input).toHaveFocus();
    });

    it('should hide clear button after clearing', async () => {
      const user = userEvent.setup();
      render(<SearchComponent />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
    });
  });

  describe('Form submission', () => {
    it('should navigate to search page on form submit', async () => {
      const user = userEvent.setup();
      render(<SearchComponent />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'javascript{enter}');

      expect(mockPush).toHaveBeenCalledWith('/search?q=javascript');
    });

    it('should encode special characters in search query', async () => {
      const user = userEvent.setup();
      render(<SearchComponent />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test & query{enter}');

      expect(mockPush).toHaveBeenCalledWith('/search?q=test%20%26%20query');
    });

    it('should trim whitespace from query', async () => {
      const user = userEvent.setup();
      render(<SearchComponent />);

      const input = screen.getByRole('textbox');
      await user.type(input, '  test query  {enter}');

      expect(mockPush).toHaveBeenCalledWith('/search?q=test%20query');
    });

    it('should not navigate when query is empty', async () => {
      const user = userEvent.setup();
      render(<SearchComponent />);

      const input = screen.getByRole('textbox');
      await user.type(input, '{enter}');

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should not navigate when query is only whitespace', async () => {
      const user = userEvent.setup();
      render(<SearchComponent />);

      const input = screen.getByRole('textbox');
      await user.type(input, '   {enter}');

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Custom onSearch handler', () => {
    it('should call onSearch instead of navigating when provided', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();
      render(<SearchComponent onSearch={onSearch} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'custom search{enter}');

      expect(onSearch).toHaveBeenCalledWith('custom search');
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should trim query before calling onSearch', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();
      render(<SearchComponent onSearch={onSearch} />);

      const input = screen.getByRole('textbox');
      await user.type(input, '  trimmed  {enter}');

      expect(onSearch).toHaveBeenCalledWith('trimmed');
    });

    it('should not call onSearch when query is empty', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn();
      render(<SearchComponent onSearch={onSearch} />);

      const input = screen.getByRole('textbox');
      await user.type(input, '{enter}');

      expect(onSearch).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible clear button with aria-label', async () => {
      const user = userEvent.setup();
      render(<SearchComponent />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      const clearButton = screen.getByLabelText('Clear search');
      expect(clearButton).toBeInTheDocument();
    });

    it('should have title attribute on clear button', async () => {
      const user = userEvent.setup();
      render(<SearchComponent />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      const clearButton = screen.getByTitle('Clear');
      expect(clearButton).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<SearchComponent />);

      const input = screen.getByRole('textbox');

      // Tab to focus input
      await user.tab();
      expect(input).toHaveFocus();
    });
  });

  describe('Form structure', () => {
    it('should be wrapped in a form element', () => {
      render(<SearchComponent />);

      const form = screen.getByRole('textbox').closest('form');
      expect(form).toBeInTheDocument();
    });

    it('should have type="text" on input', () => {
      render(<SearchComponent />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should have type="button" on clear button', async () => {
      const user = userEvent.setup();
      render(<SearchComponent />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toHaveAttribute('type', 'button');
    });
  });
});
