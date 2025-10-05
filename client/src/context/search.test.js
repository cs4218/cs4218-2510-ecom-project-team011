import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { SearchProvider, useSearch } from './search';
import '@testing-library/jest-dom/extend-expect';

// Test component that uses the useSearch hook
const FakeComponent = () => {
  const [searchState, setSearchState] = useSearch();
  
  return (
    <div>
      <div data-testid="keyword">{searchState.keyword}</div>
      <div data-testid="results-count">{searchState.results.length}</div>
      <button 
        data-testid="update-keyword" 
        onClick={() => setSearchState(prev => ({ ...prev, keyword: 'test keyword' }))}
      >
        Update Keyword
      </button>
      <button 
        data-testid="update-results" 
        onClick={() => setSearchState(prev => ({ ...prev, results: [{ id: 1, name: 'Test Product' }] }))}
      >
        Update Results
      </button>
      <button 
        data-testid="reset-search" 
        onClick={() => setSearchState({ keyword: '', results: [] })}
      >
        Reset Search
      </button>
    </div>
  );
};

describe('SearchContext', () => {
  describe('SearchProvider', () => {
    test('renders children', () => {
      // Arrange
      render(
        <SearchProvider>
          <div data-testid="child">Test Child</div>
        </SearchProvider>
      );
      
      // Act & Assert
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    test('provides initial empty keyword', () => {
      // Arrange
      render(
        <SearchProvider>
          <FakeComponent />
        </SearchProvider>
      );
      
      // Act & Assert
      expect(screen.getByTestId('keyword')).toHaveTextContent('');
    });

    test('provides initial empty results', () => {
      // Arrange
      render(
        <SearchProvider>
          <FakeComponent />
        </SearchProvider>
      );
      
      // Act & Assert
      expect(screen.getByTestId('results-count')).toHaveTextContent('0');
    });

    test('provides keyword state', () => {
      // Arrange
      render(
        <SearchProvider>
          <FakeComponent />
        </SearchProvider>
      );
      
      // Act & Assert
      expect(screen.getByTestId('keyword')).toBeInTheDocument();
    });

    test('provides results state', () => {
      // Arrange
      render(
        <SearchProvider>
          <FakeComponent />
        </SearchProvider>
      );
      
      // Act & Assert
      expect(screen.getByTestId('results-count')).toBeInTheDocument();
    });

    test('provides keyword setter function', () => {
      // Arrange
      render(
        <SearchProvider>
          <FakeComponent />
        </SearchProvider>
      );
      
      // Act & Assert
      expect(screen.getByTestId('update-keyword')).toBeInTheDocument();
    });

    test('provides results setter function', () => {
      // Arrange
      render(
        <SearchProvider>
          <FakeComponent />
        </SearchProvider>
      );
      
      // Act & Assert
      expect(screen.getByTestId('update-results')).toBeInTheDocument();
    });

    test('provides reset function', () => {
      // Arrange
      render(
        <SearchProvider>
          <FakeComponent />
        </SearchProvider>
      );
      
      // Act & Assert
      expect(screen.getByTestId('reset-search')).toBeInTheDocument();
    });
  });

  describe('useSearch hook', () => {
    test('returns search state and setter function', () => {
      // Arrange
      render(
        <SearchProvider>
          <FakeComponent />
        </SearchProvider>
      );
      
      // Act & Assert
      expect(screen.getByTestId('keyword')).toHaveTextContent('');
      expect(screen.getByTestId('results-count')).toHaveTextContent('0');
    });

    test('updates keyword when setter is called', () => {
      // Arrange
      render(
        <SearchProvider>
          <FakeComponent />
        </SearchProvider>
      );
      
      // Act
      act(() => {
        screen.getByTestId('update-keyword').click();
      });
      
      // Assert
      expect(screen.getByTestId('keyword')).toHaveTextContent('test keyword');
    });

    test('updates results when setter is called', () => {
      // Arrange
      render(
        <SearchProvider>
          <FakeComponent />
        </SearchProvider>
      );
      
      // Act
      act(() => {
        screen.getByTestId('update-results').click();
      });
      
      // Assert
      expect(screen.getByTestId('results-count')).toHaveTextContent('1');
    });

    test('resets search state when reset button is clicked', () => {
      // Arrange
      render(
        <SearchProvider>
          <FakeComponent />
        </SearchProvider>
      );
      
      // Act
      act(() => {
        screen.getByTestId('update-keyword').click();
        screen.getByTestId('update-results').click();
        screen.getByTestId('reset-search').click();
      });
      
      // Assert
      expect(screen.getByTestId('keyword')).toHaveTextContent('');
      expect(screen.getByTestId('results-count')).toHaveTextContent('0');
    });

    test('maintains state updates across multiple setter calls', () => {
      // Arrange
      render(
        <SearchProvider>
          <FakeComponent />
        </SearchProvider>
      );
      
      // Act
      act(() => {
        screen.getByTestId('update-keyword').click();
      });
      
      // Assert
      expect(screen.getByTestId('keyword')).toHaveTextContent('test keyword');
      expect(screen.getByTestId('results-count')).toHaveTextContent('0');
      
      // Second cycle of act assert to verify state transition
      // Act
      act(() => {
        screen.getByTestId('update-results').click();
      });
      
      // Assert
      expect(screen.getByTestId('keyword')).toHaveTextContent('test keyword');
      expect(screen.getByTestId('results-count')).toHaveTextContent('1');
    });

    test('provides an array with state and setter', () => {
      // Arrange
      let contextValue;
      
      const ContextInspector = () => {
        contextValue = useSearch();
        return <div data-testid="context-inspector">Context Inspector</div>;
      };
      
      render(
        <SearchProvider>
          <ContextInspector />
        </SearchProvider>
      );
      
      // Act & Assert
      expect(Array.isArray(contextValue)).toBe(true);
      expect(contextValue).toHaveLength(2);
      expect(typeof contextValue[0]).toBe('object');
      expect(typeof contextValue[1]).toBe('function');
    });

    test('has correct initial state structure', () => {
      // Arrange
      let contextValue;
      
      const ContextInspector = () => {
        contextValue = useSearch();
        return <div data-testid="context-inspector">Context Inspector</div>;
      };
      
      render(
        <SearchProvider>
          <ContextInspector />
        </SearchProvider>
      );
      
      // Act
      const [state] = contextValue;
      
      // Assert
      expect(state).toHaveProperty('keyword');
      expect(state).toHaveProperty('results');
      expect(state.keyword).toBe('');
      expect(Array.isArray(state.results)).toBe(true);
      expect(state.results).toHaveLength(0);
    });

    test('throws error when useSearch is used outside provider', () => {
      // Arrange
      // temp suppress console.error
      const originalError = console.error;
      console.error = jest.fn();
      
      // Act & Assert
      expect(() => {
        render(<FakeComponent />);
      }).toThrow();
      
      // unsuppress console.error
      console.error = originalError;
    });
  });
});
