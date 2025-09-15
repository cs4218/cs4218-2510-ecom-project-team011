import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { SearchProvider, useSearch } from './search';
import '@testing-library/jest-dom/extend-expect';

// Test component that uses the useSearch hook
const TestComponent = () => {
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

// Test component that renders children
const TestWrapper = ({ children }) => (
  <SearchProvider>
    {children}
  </SearchProvider>
);

describe('SearchContext', () => {
  describe('SearchProvider', () => {
    it('should render children without crashing', () => {
      render(
        <SearchProvider>
          <div data-testid="child">Test Child</div>
        </SearchProvider>
      );
      
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should provide initial search state', () => {
      render(
        <SearchProvider>
          <TestComponent />
        </SearchProvider>
      );
      
      expect(screen.getByTestId('keyword')).toHaveTextContent('');
      expect(screen.getByTestId('results-count')).toHaveTextContent('0');
    });

    it('should provide search state and setter function', () => {
      render(
        <SearchProvider>
          <TestComponent />
        </SearchProvider>
      );
      
      // Check that the state is accessible
      expect(screen.getByTestId('keyword')).toBeInTheDocument();
      expect(screen.getByTestId('results-count')).toBeInTheDocument();
      
      // Check that setter functions are available (buttons are rendered)
      expect(screen.getByTestId('update-keyword')).toBeInTheDocument();
      expect(screen.getByTestId('update-results')).toBeInTheDocument();
      expect(screen.getByTestId('reset-search')).toBeInTheDocument();
    });
  });

  describe('useSearch hook', () => {
    it('should return search state and setter function', () => {
      render(
        <SearchProvider>
          <TestComponent />
        </SearchProvider>
      );
      
      // Initial state should be empty
      expect(screen.getByTestId('keyword')).toHaveTextContent('');
      expect(screen.getByTestId('results-count')).toHaveTextContent('0');
    });

    it('should update keyword when setter is called', () => {
      render(
        <SearchProvider>
          <TestComponent />
        </SearchProvider>
      );
      
      // Click update keyword button
      act(() => {
        screen.getByTestId('update-keyword').click();
      });
      
      expect(screen.getByTestId('keyword')).toHaveTextContent('test keyword');
    });

    it('should update results when setter is called', () => {
      render(
        <SearchProvider>
          <TestComponent />
        </SearchProvider>
      );
      
      // Click update results button
      act(() => {
        screen.getByTestId('update-results').click();
      });
      
      expect(screen.getByTestId('results-count')).toHaveTextContent('1');
    });

    it('should reset search state when reset button is clicked', () => {
      render(
        <SearchProvider>
          <TestComponent />
        </SearchProvider>
      );
      
      // First update the state
      act(() => {
        screen.getByTestId('update-keyword').click();
        screen.getByTestId('update-results').click();
      });
      
      // Verify state was updated
      expect(screen.getByTestId('keyword')).toHaveTextContent('test keyword');
      expect(screen.getByTestId('results-count')).toHaveTextContent('1');
      
      // Reset the state
      act(() => {
        screen.getByTestId('reset-search').click();
      });
      
      // Verify state was reset
      expect(screen.getByTestId('keyword')).toHaveTextContent('');
      expect(screen.getByTestId('results-count')).toHaveTextContent('0');
    });

    it('should maintain state updates across multiple setter calls', () => {
      render(
        <SearchProvider>
          <TestComponent />
        </SearchProvider>
      );
      
      // Update keyword first
      act(() => {
        screen.getByTestId('update-keyword').click();
      });
      
      expect(screen.getByTestId('keyword')).toHaveTextContent('test keyword');
      expect(screen.getByTestId('results-count')).toHaveTextContent('0');
      
      // Then update results
      act(() => {
        screen.getByTestId('update-results').click();
      });
      
      // Both should be updated
      expect(screen.getByTestId('keyword')).toHaveTextContent('test keyword');
      expect(screen.getByTestId('results-count')).toHaveTextContent('1');
    });

    it('should handle partial state updates correctly', () => {
      render(
        <SearchProvider>
          <TestComponent />
        </SearchProvider>
      );
      
      // Update only keyword
      act(() => {
        screen.getByTestId('update-keyword').click();
      });
      
      expect(screen.getByTestId('keyword')).toHaveTextContent('test keyword');
      expect(screen.getByTestId('results-count')).toHaveTextContent('0');
    });
  });

  describe('Context Provider Value', () => {
    it('should provide an array with state and setter', () => {
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
      
      expect(Array.isArray(contextValue)).toBe(true);
      expect(contextValue).toHaveLength(2);
      expect(typeof contextValue[0]).toBe('object');
      expect(typeof contextValue[1]).toBe('function');
    });

    it('should have correct initial state structure', () => {
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
      
      const [state] = contextValue;
      expect(state).toHaveProperty('keyword');
      expect(state).toHaveProperty('results');
      expect(state.keyword).toBe('');
      expect(Array.isArray(state.results)).toBe(true);
      expect(state.results).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useSearch is used outside provider', () => {
      // Suppress console.error for this test since we expect an error
      const originalError = console.error;
      console.error = jest.fn();
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow();
      
      // Restore console.error
      console.error = originalError;
    });
  });
});
