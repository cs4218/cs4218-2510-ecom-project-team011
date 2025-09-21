import { render, screen } from '@testing-library/react';
import Policy from './Policy';

jest.mock('./../components/Layout', () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout" title={title}>
        {children}
      </div>
    );
  };
});

describe('Policy Component', () => {

  test('renders without crashing', () => {
    render(<Policy />);
  });

  test('renders Layout with correct title', () => {
    render(<Policy />);
    expect(screen.getByTestId('layout')).toHaveAttribute('title', 'Privacy Policy');
  });

  test('renders image with correct attributes', () => {
    render(<Policy />);
    const image = screen.getByAltText('contactus');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/contactus.jpeg');
    expect(image).toHaveAttribute('class', 'img-fluid');
  });

  test('does not render any placeholder privacy policy paragraphs', () => {
    render(<Policy />);
    const paragraph = screen.queryByText('add privacy policy'); 
    expect(paragraph).not.toBeInTheDocument();
  });
});