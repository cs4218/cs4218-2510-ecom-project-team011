import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { requireSignIn, isAdmin } from "./authMiddleware.js"; // adjust path

jest.mock("jsonwebtoken");
jest.mock("../models/userModel.js");



describe("requireSignIn middleware", () => {
  let req, res, next;
  
  beforeEach(() => {
    req = { headers: { authorization: "mockToken" } };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });
  
  
  it("should decode token and call next()", async () => {
    const mockDecoded = { _id: "12345", role: 1 };
    JWT.verify.mockReturnValue(mockDecoded);
    
    await requireSignIn(req, res, next);
    
    expect(JWT.verify).toHaveBeenCalledWith("mockToken", process.env.JWT_SECRET);
    expect(req.user).toEqual(mockDecoded);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled(); // no error response
  });
  
  it("should send 400 response if token is invalid", async () => {
    const error = new Error("Invalid token");
    JWT.verify.mockImplementation(() => {
      throw error;
    });
    
    await requireSignIn(req, res, next);
    
    expect(JWT.verify).toHaveBeenCalledWith("mockToken", process.env.JWT_SECRET);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error,
      message: "Malformed JWT",
    });
  });
});

describe("isAdmin middleware", () => {
  let req, res, next;
  
  beforeEach(() => {
    req = { user: { _id: "12345" } };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });
  
  it("should call next if user is admin", async () => {
    userModel.findById.mockResolvedValue({ role: 1 });
    
    await isAdmin(req, res, next);
    
    expect(userModel.findById).toHaveBeenCalledWith("12345");
    expect(next).toHaveBeenCalled();
  });
  
  it("should send 401 if user is not admin", async () => {
    userModel.findById.mockResolvedValue({ role: 0 });
    
    await isAdmin(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "UnAuthorized Access",
    });
    expect(next).not.toHaveBeenCalled();
  });
  
  it("should handle errors and send 401", async () => {
    const error = new Error("DB error");
    userModel.findById.mockRejectedValue(error);
    
    await isAdmin(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error,
      message: "Error in admin middleware",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
