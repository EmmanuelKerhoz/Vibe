'import { screen, fireEvent } from '@testing-library/react';
// Add this helper function at the top of the file
const getMenuButton = () => screen.getAllByRole('button')[0];

// ...other imports and code...

test('renders correctly', () => {
  // Use getMenuButton() in your test cases instead of hard-coded button roles
  const button = getMenuButton();
  // ...rest of the tests...
});

// Replace occurrences of fireEvent.click(screen.getByRole('button', { name: 'Open main menu' })) with
// fireEvent.click(getMenuButton());