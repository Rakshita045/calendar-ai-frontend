import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Subject Deployment Planning title', () => {
  render(<App />);
  const headerElements = screen.getAllByText(/Subject Deployment Planning/i);
  expect(headerElements.length).toBeGreaterThan(0);
});
