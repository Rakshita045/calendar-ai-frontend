import { render, screen } from '@testing-library/react';
import App from './App';

test('renders My Calendar title', () => {
  render(<App />);
  const headerElement = screen.getByText(/My Calendar/i);
  expect(headerElement).toBeInTheDocument();
});
