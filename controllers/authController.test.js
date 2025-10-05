process.env.JWT_SECRET = 'test-secret';
// Mocks 
jest.mock("../models/userModel.js", () => {
  const mockModel = jest.fn(); // constructor
  mockModel.findOne = jest.fn();
  mockModel.findById = jest.fn();
  mockModel.findByIdAndUpdate = jest.fn();
  return { __esModule: true, default: mockModel };
});


jest.mock("../models/orderModel.js", () => {
  const query = { 
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    exec: async () => {},
  }
  const mockModel = {
    find: jest.fn(() => query),
    findByIdAndUpdate: jest.fn(() => query)
  }; 
  return { __esModule: true, default: mockModel };
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
import orderModel from "../models/orderModel.js";
import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

import {
  registerController,
  loginController,
  forgotPasswordController,
  testController,
  updateProfileController,
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
} from "./authController.js"; 
import { describe } from "node:test";
import { populate } from "dotenv";

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

// CJ's tests

// updateProfileController: "../models/userModel.js/userModal", ;
// getOrdersController, 
// getAllOrdersController, 
// orderStatusController


describe("updateProfileController", () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = {
      _id: "123",
      name: "Old Name",
      email: "old@example.com",
      password: "hashedOldPassword",
      address: "Old Address",
      phone: "1111111111",
    };
    userModel.findById.mockResolvedValue(mockUser);
  });

  it("does not change password when other fields are changed", async () => {
    userModel.findByIdAndUpdate.mockResolvedValue({
      ...mockUser,
      name: "New Name",
    });

    const { req, res } = mockReqRes({ name: "New Name" }, { user: { _id: "123" } });
    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        updatedUser: expect.objectContaining({ name: "New Name" }),
      })
    );
  });

  it("rejects too short passwords", async () => {
    const { req, res } = mockReqRes({ password: "123" }, { user: { _id: "123" } });
    await updateProfileController(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringMatching(/6 character long/),
      })
    );
    expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("accepts passwords with at least 6 chars", async () => {
    hashPassword.mockResolvedValue("hashedNewPassword");
    userModel.findByIdAndUpdate.mockResolvedValue({
      ...mockUser,
      password: "hashedNewPassword",
    });

    const { req, res } = mockReqRes({ password: "newpassword" }, { user: { _id: "123" } });
    await updateProfileController(req, res);

    expect(hashPassword).toHaveBeenCalledWith("newpassword");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        updatedUser: expect.objectContaining({ password: "hashedNewPassword" }),
      })
    );
  });

  it("can change multiple fields", async () => {
    userModel.findByIdAndUpdate.mockResolvedValue({
      ...mockUser,
      name: "Another Name",
      phone: "9876543210",
      address: "New Address",
    });

    const { req, res } = mockReqRes(
      { name: "Another Name", phone: "9876543210", address: "New Address" },
      { user: { _id: "123" } }
    );
    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        updatedUser: expect.objectContaining({
          name: "Another Name",
          phone: "9876543210",
          address: "New Address",
        }),
      })
    );
  });

  it("allows for no fields in body", async () => {
    userModel.findByIdAndUpdate.mockResolvedValue(mockUser);

    const { req, res } = mockReqRes({}, { user: { _id: "123" } });
    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        updatedUser: mockUser,
      })
    );
  });

  it("handles db error when fetching user", async () => {
    userModel.findById.mockRejectedValue(new Error("DB error"));

    const { req, res } = mockReqRes({}, { user: { _id: "123" } });
    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringMatching(/Error while updating profile/),
      })
    );
  });

  it("handles db error when updating user", async () => {
    userModel.findByIdAndUpdate.mockRejectedValue(new Error("DB error"));

    const { req, res } = mockReqRes({ name: "Fail Update" }, { user: { _id: "123" } });
    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringMatching(/Error while updating profile/),
      })
    );
  });

  it("does not success when user has no id", async () => {
    const { req, res } = mockReqRes({ name: "Should Fail" }, { user: {} });
    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
      })
    );
  });
});

describe("getOrdersController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("gives error when no buyer id", async () => {
    // Arrange: req.user = {}
    const { req, res } = mockReqRes({}, { user: {} });

    // Mock DB to throw since buyer is undefined
    orderModel.find.mockImplementation(() => {
      throw new Error("Missing buyer id");
    });

    // Act
    await getOrdersController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringMatching(/Error while getting orders/),
      })
    );
  });

  it("allows for when there are no orders", async () => {
    const mockOrders = [
      {
        _id: "order1",
        buyer: { _id: "user123", name: "Alice" },
        products: [], // explicitly no products
      },
    ];    
    const query2 = {
      exec: async () => {},
      populate: jest.fn().mockReturnValue(mockOrders),
      sort: jest.fn().mockReturnThis()
    }
    const query1 = {
      exec: async () => {},
      populate: jest.fn().mockReturnValue(query2),
      sort: jest.fn().mockReturnThis()
    }
    orderModel.find.mockReturnValue(query1)

    const { req, res } = mockReqRes({}, { user: { _id: "user123" } });

    await getOrdersController(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });

  it("allows for when there are orders", async () => {
    const mockOrders = [
      {
        _id: "order2",
        buyer: { _id: "user123", name: "Alice" },
        products: [
          { _id: "prod1", title: "Book", price: 10 },
          { _id: "prod2", title: "Laptop", price: 1900 },
        ],
      },
    ];

        const query2 = {
      exec: async () => {},
      populate: jest.fn().mockReturnValue(mockOrders),
      sort: jest.fn().mockReturnThis()
    }
    const query1 = {
      exec: async () => {},
      populate: jest.fn().mockReturnValue(query2),
      sort: jest.fn().mockReturnThis()
    }
    orderModel.find.mockReturnValue(query1)

    const { req, res } = mockReqRes({}, { user: { _id: "user123" } });

    await getOrdersController(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(mockOrders);

    // Additional expectations
    expect(orderModel.find).toHaveBeenCalledWith({ buyer: "user123" });
  });

});

// Unit tests for getAllOrdersController are similar to getOrdersController. 
// Most of the logic should be in the DB layer
describe("getAllOrdersController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("gives all orders when when no buyer id", async () => {
    // Arrange: req.user = {}
    const { req, res } = mockReqRes({}, { user: {} });

    const mockOrders = [
      {
        _id: "order2",
        buyer: { _id: "user123", name: "Alice" },
        products: [
          { _id: "prod1", title: "Book", price: 10 },
          { _id: "prod2", title: "Laptop", price: 1900 },
        ],
      },
    ];
    
    const query = {
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue(mockOrders)
        })
      })
    }
    orderModel.find.mockReturnValue(query)

    // Act
    await getAllOrdersController(req, res);

    // Assert
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });

  it("allows for when there are no orders", async () => {
    const mockOrders = [
      {
        _id: "order1",
        buyer: { _id: "user123", name: "Alice" },
        products: [], // explicitly no products
      },
    ];    
    const query = {
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue(mockOrders)
        })
      })
    }
    orderModel.find.mockReturnValue(query)

    const { req, res } = mockReqRes({}, { user: { _id: "user123" } });

    await getAllOrdersController(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });

  it("allows for when there are orders", async () => {
    const mockOrders = [
      {
        _id: "order2",
        buyer: { _id: "user123", name: "Alice" },
        products: [
          { _id: "prod1", title: "Book", price: 10 },
          { _id: "prod2", title: "Laptop", price: 1900 },
        ],
      },
    ];

    const query = {
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue(mockOrders)
        })
      })
    }

    orderModel.find.mockReturnValue(query)

    const { req, res } = mockReqRes({}, { user: { _id: "user123" } });

    await getAllOrdersController(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });

  it("handles db failure", async () => {
    orderModel.find.mockRejectedValue(new Error("DB error"));
    const { req, res } = mockReqRes({}, { user: { _id: "user123" } });

    await getAllOrdersController(req, res);
    expect(res.status).toHaveBeenCalledWith(500)
  })

});



describe("orderStatusController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates order status", async () => {
    const mockOrder = {
      _id: "order123",
      status: "shipped",
    };

    orderModel.findByIdAndUpdate.mockResolvedValue(mockOrder);

    const { req, res } = mockReqRes(
      { status: "shipped" },
      { params: { orderId: "order123" } }
    );

    await orderStatusController(req, res);

    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "order123",
      { status: "shipped" },
      { new: true }
    );
    expect(res.json).toHaveBeenCalledWith(mockOrder);
  });

  it("handles database error", async () => {
    orderModel.findByIdAndUpdate.mockRejectedValue(new Error("DB error"));

    const { req, res } = mockReqRes(
      { status: "cancelled" },
      { params: { orderId: "order999" } }
    );

    await orderStatusController(req, res);

    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "order999",
      { status: "cancelled" },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringMatching(/Error while updating order/),
      })
    );
  });

  it("handles order not found", async () => {
    orderModel.findByIdAndUpdate.mockResolvedValue(null);

    const { req, res } = mockReqRes(
      { status: "processing" },
      { params: { orderId: "order404" } }
    );

    await orderStatusController(req, res);

    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "order404",
      { status: "processing" },
      { new: true }
    );
    expect(res.json).toHaveBeenCalledWith(null);
  });
});
