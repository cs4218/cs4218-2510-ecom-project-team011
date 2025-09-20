import React from 'react';
import { render, waitFor } from '@testing-library/react';
import axios from 'axios';
import '@testing-library/jest-dom/extend-expect';
import { useAuth, AuthProvider } from './auth';
import { beforeEach, describe } from 'node:test';

// Mocking axios.post
jest.mock('axios');

const ValueCapture = ({captureFn}) => {
  captureFn();
  return <></>
}

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
    const fn = () => {
      [captureValue] = useAuth();
    }
    render(
    <AuthProvider> 
      <ValueCapture  captureFn={fn}/>
    </AuthProvider>
    );
    expect(captureValue.user).toBe(null);
    expect(captureValue.token).toBe("");
  });
  it("loads auth from localStorage and sets axios header", async () => {
    let captureValue;
    const fn = () => {
      [captureValue] = useAuth();
    };

    const storedAuth = { user: { name: "Bobby" }, token: "123abc" };
    localStorage.setItem("auth", JSON.stringify(storedAuth));

    render(
      <AuthProvider>
        <ValueCapture captureFn={fn} />
      </AuthProvider>
    );

    await waitFor(() => {
      const auth = captureValue;
      expect(auth.user).toEqual(storedAuth.user);
      expect(auth.token).toBe(storedAuth.token);
      expect(axios.defaults.headers.common["Authorization"]).toBe("123abc");
    });
  });
  // TODO: Change of Auth
});