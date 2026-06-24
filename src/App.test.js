import { render, screen } from '@testing-library/react';
import App from './App';

test('renders academic lecture planner title', () => {
  render(<App />);
  const headerElement = screen.getByText(/Academic Lecture Planner/i);
  expect(headerElement).toBeInTheDocument();
});
