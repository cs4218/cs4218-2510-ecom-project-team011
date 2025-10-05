import React from 'react';
import '@testing-library/jest-dom/extend-expect';
// Mocks 

jest.mock("../models/userModel.js", () => {
  const mockModel = jest.fn(); // constructor
  mockModel.findOne = jest.fn();
  mockModel.findById = jest.fn();
  mockModel.findByIdAndUpdate = jest.fn();
  return { __esModule: true, default: mockModel };
});

jest.mock("../models/orderModel.js", () => {
  // Not used by these tests, but mocked to be safe if imported
  return { __esModule: true, default: {} };
});

jest.mock("../helpers/authHelper.js", () => ({
  __esModule: true,
  comparePassword: jest.fn(),
  hashPassword: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    sign: jest.fn(),
  },
}));

// Imports
import userModel from "../models/userModel.js";
import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

import {
  registerController,
  loginController,
  forgotPasswordController,
  testController,
} from "authController.js"; 

const mockReqRes = (body = {}, extras = {}) => {
  const req = { body, params: {}, user: {}, ...extras };
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
    json: jest.fn(),
  };
  return { req, res };
};

beforeEach(() => {
  jest.clearAllMocks();
});

//=================== REGISTER==============================
                                
describe("registerController", () => {
  test("returns error when name is missing", async () => {
    // Arrange
    const { req, res } = mockReqRes({
      // name missing
      email: "a@b.com",
      password: "pass123",
      phone: "123",
      address: "addr",
      answer: "blue",
    });

    // Act
    await registerController(req, res);

    // Assert
    expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
  });

  test("returns success:false when user already exists", async () => {
    // Arrange
    userModel.findOne.mockResolvedValue({ _id: "u1" });
    const { req, res } = mockReqRes({
      name: "Alice",
      email: "a@b.com",
      password: "pass123",
      phone: "123",
      address: "addr",
      answer: "blue",
    });

    // Act
    await registerController(req, res);

    // Assert
    expect(userModel.findOne).toHaveBeenCalledWith({ email: "a@b.com" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.stringMatching(/Already Register/i) })
    );
  });

  test("creates user and returns 201 on success", async () => {
    // Arrange
    userModel.findOne.mockResolvedValue(null);
    hashPassword.mockResolvedValue("hashed-pass");
    const savedUser = {
      _id: "new-id",
      name: "Alice",
      email: "a@b.com",
      phone: "123",
      address: "addr",
      answer: "blue",
      password: "hashed-pass",
    };
    userModel.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(savedUser),
    }));
    const { req, res } = mockReqRes({
      name: "Alice",
      email: "a@b.com",
      password: "pass123",
      phone: "123",
      address: "addr",
      answer: "blue",
    });

    // Act
    await registerController(req, res);

    // Assert
    expect(hashPassword).toHaveBeenCalledWith("pass123");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.stringMatching(/Register Successfully/i),
        user: savedUser,
      })
    );
  });
});

// ============================ LOGIN =================================

describe("loginController", () => {
  test("returns 404 when email or password missing", async () => {
    // Arrange
    const { req, res } = mockReqRes({ email: "a@b.com" /* password missing */ });

    // Act
    await loginController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Invalid email or password" })
    );
  });

  test("returns 404 when user not found", async () => {
    // Arrange
    userModel.findOne.mockResolvedValue(null);
    const { req, res } = mockReqRes({ email: "no@user.com", password: "x" });

    // Act
    await loginController(req, res);

    // Assert
    expect(userModel.findOne).toHaveBeenCalledWith({ email: "no@user.com" });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Email is not registerd" })
    );
  });

  test("returns success:false when password mismatch", async () => {
    // Arrange
    userModel.findOne.mockResolvedValue({ _id: "u1", password: "hash" });
    comparePassword.mockResolvedValue(false);
    const { req, res } = mockReqRes({ email: "a@b.com", password: "wrong" });

    // Act
    await loginController(req, res);

    // Assert
    expect(comparePassword).toHaveBeenCalledWith("wrong", "hash");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Invalid Password" })
    );
  });

  test("returns token and user on success", async () => {
    // Arrange
    const dbUser = {
      _id: "u1",
      name: "Alice",
      email: "a@b.com",
      phone: "123",
      address: "addr",
      role: 0,
      password: "hash",
    };
    userModel.findOne.mockResolvedValue(dbUser);
    comparePassword.mockResolvedValue(true);
    JWT.sign.mockReturnValue("test-token");
    const { req, res } = mockReqRes({ email: "a@b.com", password: "right" });

    // Act
    await loginController(req, res);

    // Assert
    expect(JWT.sign).toHaveBeenCalledWith({ _id: "u1" }, "test-secret", expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        token: "test-token",
        user: expect.objectContaining({
          _id: "u1",
          email: "a@b.com",
          name: "Alice",
          role: 0,
        }),
      })
    );
  });
});

// =========================== FORGOT PASSWORD ==================================

describe("forgotPasswordController", () => {
  test("400 when email missing", async () => {
    // Arrange
    const { req, res } = mockReqRes({ answer: "blue", newPassword: "newpass" });

    // Act
    await forgotPasswordController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    // '!!! message has a typo in source ("Emai is required")
    expect(res.send).toHaveBeenCalledWith({ message: "Email is required" });
  });

  test("404 when email+answer combination not found", async () => {
    // Arrange
    userModel.findOne.mockResolvedValue(null);
    const { req, res } = mockReqRes({
      email: "a@b.com",
      answer: "blue",
      newPassword: "newpass",
    });

    // Act
    await forgotPasswordController(req, res);

    // Assert
    expect(userModel.findOne).toHaveBeenCalledWith({ email: "a@b.com", answer: "blue" });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Wrong Email Or Answer" })
    );
  });

  test("200 and success when password reset works", async () => {
    // Arrange
    const user = { _id: "u1", email: "a@b.com" };
    userModel.findOne.mockResolvedValue(user);
    hashPassword.mockResolvedValue("hashed-new");
    userModel.findByIdAndUpdate.mockResolvedValue({ ...user, password: "hashed-new" });
    const { req, res } = mockReqRes({
      email: "a@b.com",
      answer: "blue",
      newPassword: "newpass",
    });

    // Act
    await forgotPasswordController(req, res);

    // Assert
    expect(hashPassword).toHaveBeenCalledWith("newpass");
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith("u1", { password: "hashed-new" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: "Password Reset Successfully" })
    );
  });
});

// ====================== TEST =========================

describe("testController", () => {
  test("returns plain string 'Protected Routes'", () => {
    // Arrange
    const { req, res } = mockReqRes();

    // Act
    testController(req, res);

    // Assert
    expect(res.send).toHaveBeenCalledWith("Protected Routes");
  });
});
