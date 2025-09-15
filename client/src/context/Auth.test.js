import React from 'react';
import { render } from '@testing-library/react';
import axios from 'axios';
import '@testing-library/jest-dom/extend-expect';
import { useAuth, AuthProvider } from './auth';
import { beforeEach, describe } from 'node:test';

// Mocking axios.post
jest.mock('axios');

describe("AuthProvider Component", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear();
    axios.defaults.headers.common["Authorization"] = "";
  })

  it("renders children inside provider", () => {
    const {getByTestId} = render(
      <AuthProvider>
        <div data-testid="child">Hello</div>
      </AuthProvider>
    );
    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("provides default auth info", () => {
    let captureValue;
    render(
    <AuthProvider> 
      { (() => {
        captureValue = useAuth();
        return <></>
      })() }
    </AuthProvider>
    );
    expect(captureValue.user).toBe(null);
    expect(captureValue.token).toBe("");
  });
})