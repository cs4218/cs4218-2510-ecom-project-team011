// Mock setup - MUST be before imports
const mockProductSave = jest.fn();
const mockProductFind = jest.fn();
const mockProductFindOne = jest.fn();
const mockProductFindById = jest.fn();
const mockProductFindByIdAndUpdate = jest.fn();
const mockProductFindByIdAndDelete = jest.fn();
const mockProductEstimatedDocumentCount = jest.fn();

const MockProductModel = jest.fn((data) => {
  const instance = {
    ...data,
    photo: { data: null, contentType: null },
    save: mockProductSave,
  };
  return instance;
});

MockProductModel.find = jest.fn();
MockProductModel.findOne = jest.fn();
MockProductModel.findById = jest.fn();
MockProductModel.findByIdAndUpdate = mockProductFindByIdAndUpdate;
MockProductModel.findByIdAndDelete = jest.fn();

const mockCategoryFindOne = jest.fn();
const MockCategoryModel = { findOne: mockCategoryFindOne };

const mockOrderSave = jest.fn();
const MockOrderModel = jest.fn(() => ({ save: mockOrderSave }));

const mockClientTokenGenerate = jest.fn();
const mockTransactionSale = jest.fn();

// Mock all external dependencies BEFORE importing controller
jest.mock("braintree", () => ({
  BraintreeGateway: jest.fn().mockImplementation(() => ({
    clientToken: { generate: mockClientTokenGenerate },
    transaction: { sale: mockTransactionSale },
  })),
  Environment: { Sandbox: "sandbox" },
}));

jest.mock("../models/productModel.js", () => ({
  __esModule: true,
  default: MockProductModel,
}));
jest.mock("../models/categoryModel.js", () => ({
  __esModule: true,
  default: MockCategoryModel,
}));
jest.mock("../models/orderModel.js", () => ({
  __esModule: true,
  default: MockOrderModel,
}));
jest.mock("fs", () => ({
  readFileSync: jest.fn().mockReturnValue(Buffer.from("fake-image")),
}));
jest.mock("slugify", () =>
  jest.fn((text) => text.toLowerCase().replace(/\s+/g, "-"))
);

// Import controllers after mocks
const {
  createProductController,
  getProductController,
  getSingleProductController,
  productPhotoController,
  deleteProductController,
  updateProductController,
  productFiltersController,
  productCountController,
  searchProductController,
  relatedProductController,
  productCategoryController,
  productListController,
  braintreeTokenController,
  brainTreePaymentController,
} = require("./productController");

// Test helpers
const mockReq = (
  fields = {},
  files = {},
  params = {},
  body = {},
  user = null
) => ({ fields, files, params, body, user });

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

// Structure and basic tests generated with the help of ChatGPT and Github Copilot
describe("Product Controller Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  // Leon
  describe("braintreeTokenController", () => {
    test("should generate token successfully", async () => {
      const req = mockReq();
      const res = mockRes();

      mockClientTokenGenerate.mockImplementation((options, callback) => {
        callback(null, { clientToken: "fake-token" });
      });

      await braintreeTokenController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Payment token generated successfully",
        clientToken: "fake-token",
      });
    });

    test("should handle token generation error", async () => {
      const req = mockReq();
      const res = mockRes();

      mockClientTokenGenerate.mockImplementation((options, callback) => {
        callback({ message: "Token error" }, null);
      });

      await braintreeTokenController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: "Token error",
        message: "Error generating payment token",
      });
    });
  });

  // Leon
  describe("brainTreePaymentController", () => {
    const validPayment = {
      nonce: "fake-nonce",
      cart: [
        { _id: "1", price: 50 },
        { _id: "2", price: 30 },
      ],
    };
    const validUser = { _id: "user-1" };

    test("should process payment successfully", async () => {
      const req = mockReq({}, {}, {}, validPayment, validUser);
      const res = mockRes();

      mockTransactionSale.mockImplementation((options, callback) => {
        callback(null, { transaction: { id: "txn-123" } });
      });
      mockOrderSave.mockResolvedValue({ _id: "order-123" });

      await brainTreePaymentController(req, res);

      expect(mockTransactionSale).toHaveBeenCalledWith(
        {
          amount: 80,
          paymentMethodNonce: "fake-nonce",
          options: { submitForSettlement: true },
        },
        expect.any(Function)
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Payment processed successfully",
        transaction: { transaction: { id: "txn-123" } },
      });
    });

    test("should return 400 when nonce missing", async () => {
      const req = mockReq({}, {}, {}, { cart: validPayment.cart }, validUser);
      const res = mockRes();

      await brainTreePaymentController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Payment nonce is required",
      });
    });

    test("should return 400 when cart empty", async () => {
      const req = mockReq(
        {},
        {},
        {},
        { nonce: "fake-nonce", cart: [] },
        validUser
      );
      const res = mockRes();

      await brainTreePaymentController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Cart is required and cannot be empty",
      });
    });

    test("should return 401 when user not authenticated", async () => {
      const req = mockReq({}, {}, {}, validPayment, null);
      const res = mockRes();

      await brainTreePaymentController(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "User authentication required",
      });
    });

    test("should handle payment processing error", async () => {
      const req = mockReq({}, {}, {}, validPayment, validUser);
      const res = mockRes();

      mockTransactionSale.mockImplementation((options, callback) => {
        callback({ message: "Payment failed" }, null);
      });

      await brainTreePaymentController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: "Payment failed",
        message: "Payment processing failed",
      });
    });
  });

  // Sean
  describe("Given that getProductController is called", () => {
    const mockProduct = {
      _id: "1",
      name: "Product 1",
      slug: "product-1",
      price: 100,
      photo: {
        data: Buffer.from("mock-image-data"),
        contentType: "image/jpeg",
      },
      category: "category-id-1",
    };

    const mockProducts = [
      mockProduct,
      {
        _id: "2",
        name: "Product 2",
        slug: "product-2",
        price: 200,
        category: "category-id-1",
      },
    ];
    const req = mockReq();
    const res = mockRes();

    it("should return all products successfully", async () => {
      // Arrange
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockProducts),
      };

      MockProductModel.find.mockReturnValue(mockQuery);

      // Act
      await getProductController(req, res);

      // Assert
      expect(MockProductModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        countTotal: mockProducts.length,
        message: "All Products",
        products: mockProducts,
      });
    });

    it("should respond with an error when fetching products fails", async () => {
      // Arrange
      const error = new Error("Database error");
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(error),
      };

      MockProductModel.find.mockReturnValue(mockQuery);

      // Act
      await getProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in getting products",
        error: error.message,
      });
    });
  });

  // Sean
  describe("Given that getSingleProductController is called", () => {
    const mockProduct = {
      _id: "1",
      name: "Product 1",
      slug: "product-1",
      price: 100,
      photo: {
        data: Buffer.from("mock-image-data"),
        contentType: "image/jpeg",
      },
      category: "category-id-1",
    };

    const res = mockRes();
    it("should return single product by slug successfully", async () => {
      // Arrange
      const req = mockReq({}, {}, { slug: "product-1" });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockProduct),
      };

      MockProductModel.findOne.mockReturnValue(mockQuery);

      // Act
      await getSingleProductController(req, res);

      // Assert
      expect(MockProductModel.findOne).toHaveBeenCalledWith({
        slug: "product-1",
      });
      expect(mockQuery.select).toHaveBeenCalledWith("-photo");
      expect(mockQuery.populate).toHaveBeenCalledWith("category");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Product retrieved successfully",
        product: mockProduct,
      });
    });

    it("should return failing query with no result when no product found", async () => {
      // Arrange
      const req = mockReq({}, {}, { slug: "product-3" });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(null),
      };

      MockProductModel.findOne.mockReturnValue(mockQuery);

      // Act
      await getSingleProductController(req, res);

      // Assert
      expect(MockProductModel.findOne).toHaveBeenCalledWith({
        slug: "product-3",
      });
      expect(mockQuery.select).toHaveBeenCalledWith("-photo");
      expect(mockQuery.populate).toHaveBeenCalledWith("category");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Product not found",
      });
    });

    it("should handle error when fetching from database fails", async () => {
      // Arrange
      const req = mockReq({ slug: "product-1" });
      const errorMessage = "Database error";
      const error = new Error(errorMessage);
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockRejectedValue(error),
      };

      MockProductModel.findOne.mockReturnValue(mockQuery);

      // Act
      await getSingleProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: errorMessage,
        error,
      });
    });
  });

  // Sean
  describe("Given that productPhotoController is called", () => {
    const mockProduct = {
      _id: "1",
      name: "Product 1",
      slug: "product-1",
      price: 100,
      photo: {
        data: Buffer.from("mock-image-data"),
        contentType: "image/jpeg",
      },
      category: "category-id-1",
    };

    it("should return product photo successfully if photo exists", async () => {
      // Arrange
      const req = mockReq({}, {}, { pid: "product-1" });
      const res = mockRes();
      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockProduct),
      };

      MockProductModel.findById.mockReturnValue(mockQuery);

      // Act
      await productPhotoController(req, res);

      // Assert
      expect(MockProductModel.findById).toHaveBeenCalledWith("product-1");
      expect(mockQuery.select).toHaveBeenCalledWith("photo");
      expect(res.set).toHaveBeenCalledWith("Content-type", "image/jpeg");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockProduct.photo.data);
    });

    it("should return 404 if photo does not exists", async () => {
      // Arrange
      const req = mockReq({}, {}, { pid: "product-2" });
      const res = mockRes();

      const mockQuery = {
        select: jest.fn().mockReturnValue(null),
      };

      MockProductModel.findById.mockReturnValue(mockQuery);

      // Act
      await productPhotoController(req, res);

      // Assert
      expect(MockProductModel.findById).toHaveBeenCalledWith("product-2");
      expect(mockQuery.select).toHaveBeenCalledWith("photo");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "No photo data found",
      });
    });

    it("should handle error when product photo not found", async () => {
      // Arrange
      const error = new Error("Error while getting photo");
      const req = mockReq({}, {}, { pid: "invalid-id" });
      const res = mockRes();

      const mockQuery = {
        select: jest.fn().mockRejectedValue(error),
      };

      MockProductModel.findById.mockReturnValue(mockQuery);

      // Act
      await productPhotoController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting photo",
        error,
      });
    });
  });

  // Sean
  describe("Given that productFiltersController is called", () => {
    it("should filter products by category and price successfully", async () => {
      // Arrange
      const req = mockReq(
        {},
        {},
        {},
        {
          checked: ["category-id-1", "category-id-2"],
          radio: [100, 500],
        }
      );
      const res = mockRes();
      const mockProduct = {
        _id: "1",
        name: "Product 1",
        slug: "product-1",
        price: 100,
        photo: {
          data: Buffer.from("mock-image-data"),
          contentType: "image/jpeg",
        },
        category: "category-id-1",
      };

      const mockProducts = [
        mockProduct,
        {
          _id: "2",
          name: "Product 2",
          slug: "product-2",
          price: 200,
          category: "category-id-1",
        },
      ];

      MockProductModel.find.mockResolvedValue(mockProducts);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(MockProductModel.find).toHaveBeenCalledWith({
        category: { $in: ["category-id-1", "category-id-2"] },
        price: { $gte: 100, $lte: 500 },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
        message: "Products filtered successfully",
      });
    });

    it("should filter products by category only", async () => {
      // Arrange
      const mockCategoryOnlyProducts = [{ _id: "1", name: "Filtered Product" }];
      const req = mockReq(
        {},
        {},
        {},
        {
          checked: ["category-id-1"],
          radio: [],
        }
      );
      const res = mockRes();

      MockProductModel.find.mockResolvedValue(mockCategoryOnlyProducts);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(MockProductModel.find).toHaveBeenCalledWith({
        category: { $in: ["category-id-1"] },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should not filter if invalid range of prices is provided", async () => {
      // Arrange
      const req = mockReq(
        {},
        {},
        {},
        {
          checked: [],
          radio: [200],
        }
      );
      const res = mockRes();

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(MockProductModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle no filters applied", async () => {
      // Arrange
      const mockAllProducts = [
        { _id: "1", name: "Product 1", category: "category-id-1", price: 200 },
        {
          _id: "2",
          name: "Product 2",
          category: "category-id-1",
          price: 100000,
        },
        { _id: "3", name: "Product 3", category: "category-id-2", price: 50 },
      ];
      const req = mockReq(
        {},
        {},
        {},
        {
          checked: [],
          radio: [],
        }
      );
      const res = mockRes();

      MockProductModel.find.mockResolvedValue(mockAllProducts);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(MockProductModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle error during filtering", async () => {
      // Arrange
      const error = new Error("Filter error");
      const req = mockReq({}, {}, {}, { checked: [], radio: [] });
      const res = mockRes();

      MockProductModel.find.mockRejectedValue(error);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Filtering Products",
        error,
      });
    });
  });

  // Sean
  describe("Given that productCountController is called", () => {
    it("should return total product count successfully", async () => {
      // Arrange
      const req = mockReq();
      const res = mockRes();
      const mockQuery = {
        estimatedDocumentCount: jest.fn().mockResolvedValue(25),
      };

      MockProductModel.find.mockReturnValue(mockQuery);

      // Act
      await productCountController(req, res);

      // Assert
      expect(MockProductModel.find).toHaveBeenCalledWith({});
      expect(mockQuery.estimatedDocumentCount).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        message: "Product count retrieved successfully",
        success: true,
        total: 25,
      });
    });

    it("should handle error when counting products fails", async () => {
      // Arrange
      const req = mockReq();
      const res = mockRes();
      const error = new Error("Count error");
      const mockQuery = {
        estimatedDocumentCount: jest.fn().mockRejectedValue(error),
      };

      MockProductModel.find.mockReturnValue(mockQuery);

      // Act
      await productCountController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        message: "Error in product count",
        error,
        success: false,
      });
    });
  });

  // Sean
  describe("Given that productListController is called", () => {
    const mockProduct = {
      _id: "1",
      name: "Product 1",
      slug: "product-1",
      price: 100,
      photo: {
        data: Buffer.from("mock-image-data"),
        contentType: "image/jpeg",
      },
      category: "category-id-1",
    };

    const mockProducts = [
      mockProduct,
      {
        _id: "2",
        name: "Product 2",
        slug: "product-2",
        price: 200,
        category: "category-id-2",
      },
      {
        _id: "3",
        name: "Product 3",
        slug: "product-3",
        price: 200,
        category: "category-id-3",
      },
      {
        _id: "4",
        name: "Product 4",
        slug: "product-4",
        price: 100,
        category: "category-id-1",
      },
      {
        _id: "5",
        name: "Product 5",
        slug: "product-5",
        price: 2300,
        category: "category-id-1",
      },
      {
        _id: "6",
        name: "Product 6",
        slug: "product-6",
        price: 2000,
        category: "category-id-2",
      },
    ];

    it("should return paginated products successfully", async () => {
      // Arrange
      const req = mockReq();
      const res = mockRes();
      const mockProductsSecondPage = [
        {
          _id: "7",
          name: "Product 7",
          slug: "product-7",
          price: 200,
          category: "category-id-4",
        },
      ];
      req.params.page = "2";

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockProductsSecondPage),
      };

      MockProductModel.find.mockReturnValue(mockQuery);

      // Act
      await productListController(req, res);

      // Assert
      expect(MockProductModel.find).toHaveBeenCalledWith({});
      expect(mockQuery.select).toHaveBeenCalledWith("-photo");
      expect(mockQuery.skip).toHaveBeenCalledWith(6);
      expect(mockQuery.limit).toHaveBeenCalledWith(6);
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        message: "Products retrieved successfully",
        success: true,
        products: mockProductsSecondPage,
      });
    });

    it("should default to page 1 when no page parameter provided", async () => {
      // Arrange
      const req = mockReq();
      const res = mockRes();

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockProducts),
      };

      MockProductModel.find.mockReturnValue(mockQuery);

      // Act
      await productListController(req, res);

      // Assert
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
    });

    it("should handle error during pagination", async () => {
      // Arrange
      const error = new Error("Pagination error");
      const req = mockReq({}, {}, { page: "-1" });
      const res = mockRes();

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(error),
      };

      MockProductModel.find.mockReturnValue(mockQuery);

      // Act
      await productListController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in per page controller",
        error,
      });
    });
  });

  // Sean
  describe("Given that searchProductController is called", () => {
    it("should search products by keyword successfully", async () => {
      // Arrange
      const mockResults = [
        { _id: "1", name: "iPhone 13", description: "Latest iPhone" },
        { _id: "2", name: "Samsung Galaxy", description: "Android phone" },
      ];
      const req = mockReq({}, {}, { keyword: "phone" });
      const res = mockRes();

      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockResults),
      };

      MockProductModel.find.mockReturnValue(mockQuery);

      // Act
      await searchProductController(req, res);

      // Assert
      expect(MockProductModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: "phone", $options: "i" } },
          { description: { $regex: "phone", $options: "i" } },
        ],
      });
      expect(mockQuery.select).toHaveBeenCalledWith("-photo");
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Search completed successfully",
        results: mockResults,
      });
    });

    it("should handle error during search", async () => {
      // Arrange
      const error = new Error("Search error");
      const req = mockReq({}, {}, { keyword: "error" });
      const res = mockRes();

      const mockQuery = {
        select: jest.fn().mockRejectedValue(error),
      };

      MockProductModel.find.mockReturnValue(mockQuery);

      // Act
      await searchProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error In Search Product Controller",
        error,
      });
    });

    it("should return empty array when no products match search", async () => {
      // Arrange
      const req = mockReq({}, {}, { keyword: "nonexistent" });
      const res = mockRes();

      const mockQuery = {
        select: jest.fn().mockResolvedValue([]),
      };

      MockProductModel.find.mockReturnValue(mockQuery);

      // Act
      await searchProductController(req, res);

      // Assert
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Search completed successfully",
        results: [],
      });
    });
  });

  // Sean
  describe("Given that relatedProductController is called", () => {
    it("should return related products successfully", async () => {
      // Arrange
      const mockProducts = [
        { _id: "2", name: "Related Product 1", category: "category123" },
        { _id: "3", name: "Related Product 2", category: "category123" },
      ];
      const req = mockReq({}, {}, { pid: "1", cid: "category123" });
      const res = mockRes();

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockProducts),
      };

      MockProductModel.find.mockReturnValue(mockQuery);

      // Act
      await relatedProductController(req, res);

      // Assert
      expect(MockProductModel.find).toHaveBeenCalledWith({
        category: "category123",
        _id: { $ne: "1" },
      });
      expect(mockQuery.select).toHaveBeenCalledWith("-photo");
      expect(mockQuery.limit).toHaveBeenCalledWith(3);
      expect(mockQuery.populate).toHaveBeenCalledWith("category");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        message: "Related products retrieved",
        success: true,
        products: mockProducts,
      });
    });

    it("should return 400 if no pid provided", async () => {
      // Arrange
      const req = mockReq({}, {}, { cid: "category123" });
      const res = mockRes();

      // Act
      await relatedProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "No product id found",
      });
    });

    it("should return 400 if no cid provided", async () => {
      // Arrange
      const req = mockReq({}, {}, { pid: "1" });
      const res = mockRes();

      // Act
      await relatedProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "No category id found",
      });
    });

    it("should handle error when fetching related products", async () => {
      // Arrange
      const error = new Error("Related products error");
      const req = mockReq({}, {}, { pid: "1", cid: "category123" });
      const res = mockRes();

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockRejectedValue(error),
      };

      MockProductModel.find.mockReturnValue(mockQuery);

      // Act
      await relatedProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error retrieving products",
        error,
      });
    });
  });

  // Sean
  describe("Given that productCategoryController is called", () => {
    it("should return products by category successfully", async () => {
      // Arrange
      const mockCategory = {
        _id: "category-id-1",
        name: "Electronics",
        slug: "electronics",
      };
      const mockProducts = [
        { _id: "1", name: "Product 1", category: "category-id-1" },
        { _id: "2", name: "Product 2", category: "category-id-1" },
      ];
      const req = mockReq({}, {}, { slug: "electronics" });
      const res = mockRes();

      MockCategoryModel.findOne.mockResolvedValue(mockCategory);
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockProducts),
      };
      MockProductModel.find.mockReturnValue(mockQuery);

      // Act
      await productCategoryController(req, res);

      // Assert
      expect(MockCategoryModel.findOne).toHaveBeenCalledWith({
        slug: "electronics",
      });
      expect(MockProductModel.find).toHaveBeenCalledWith({
        category: mockCategory,
      });
      expect(mockQuery.populate).toHaveBeenCalledWith("category");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Products by category retrieved",
        category: mockCategory,
        products: mockProducts,
      });
    });

    it("should return 400 if no slug provided", async () => {
      // Arrange
      const req = mockReq();
      const res = mockRes();

      // Act
      await productCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "No slug in request",
      });
    });

    it("should return 400 if no category found", async () => {
      // Arrange
      const req = mockReq({}, {}, { slug: "no-category" });
      const res = mockRes();

      MockCategoryModel.findOne.mockResolvedValue(null);

      // Act
      await productCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Category not found",
      });
    });

    it("should handle error when category not found", async () => {
      // Arrange
      const error = new Error("Category not found");
      const req = mockReq({}, {}, { slug: "invalid-category" });
      const res = mockRes();

      MockCategoryModel.findOne.mockRejectedValue(error);

      // Act
      await productCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error,
        message: "Error retrieving products",
      });
    });
  });

  // You Wei
  describe("createProductController tests", () => {
    describe("Decision table tests", () => {
      test("Create product with missing name", async () => {
        // Arrange (name missing; others don't care)
        const req = mockReq(
          {
            // name: undefined
            description: "X",
            price: 1,
            category: "X",
            quantity: 1,
            shipping: false,
          },
          {}
        );
        const res = mockRes();

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Product name is required",
        });
      });

      test("Create product with name, but missing description", async () => {
        // Arrange (description missing; others don't care)
        const req = mockReq(
          {
            name: "Some Product",
            // description: undefined
            price: 1,
            category: "X",
            quantity: 1,
            shipping: false,
          },
          {}
        );
        const res = mockRes();

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Product description is required",
        });
      });

      test("Create product with name, description, but missing price", async () => {
        // Arrange (name, description present; price missing; others don't care)
        const req = mockReq(
          {
            name: "Some Product",
            description: "Some description",
            // price: undefined
            category: "X",
            quantity: 1,
            shipping: false,
          },
          {}
        );
        const res = mockRes();

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Product price is required",
        });
      });

      test("Create product with name, description, price but missing category", async () => {
        // Arrange (name, description, price present; category missing; others don't care)
        const req = mockReq(
          {
            name: "Some Product",
            description: "Some description",
            price: 123,
            // category: undefined
            quantity: 1,
            shipping: false,
          },
          {}
        );
        const res = mockRes();

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Product category is required",
        });
      });

      test("Create product with name, description, price, category but missing quantity", async () => {
        // Arrange (name, description, price, category present; quantity missing; others don't care)
        const req = mockReq(
          {
            name: "Some Product",
            description: "Some description",
            price: 123,
            category: "Some Category",
            // quantity: undefined
            shipping: false,
          },
          {}
        );
        const res = mockRes();

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Product quantity is required",
        });
      });

      test("Create product where photo does not exist", async () => {
        // Arrange (all required fields present; no photo provided)
        const req = mockReq(
          {
            name: "Phone X",
            description: "Flagship device",
            price: 999,
            category: "Mobiles",
            quantity: 5,
            shipping: false,
          },
          {/*photo: undefined */}
        );
        const res = mockRes();

        mockProductSave.mockResolvedValueOnce(undefined);

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({ success: true, message: "Product created successfully" })
        );
      });

      test("Create product with photo size > 1MB", async () => {
        // Arrange (all required fields present; photo too large)
        const req = mockReq(
          {
            name: "Phone Y",
            description: "Great camera",
            price: 1099,
            category: "Mobiles",
            quantity: 8,
            shipping: true,
          },
          { photo: { path: "/tmp/large", type: "image/jpeg", size: 1000001 } }
        );
        const res = mockRes();

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Photo should be less than 1MB",
        });
      });

      test("Create product with shipping undefined", async () => {
        // Arrange (all required fields present; shipping missing)
        const req = mockReq(
          {
            name: "Phone Z",
            description: "Battery beast",
            price: 799,
            category: "Mobiles",
            quantity: 3,
            // shipping: undefined
          },
          {}
        );
        const res = mockRes();

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Product shipping is required",
        });
      });

      test("Create product with all fields and photo", async () => {
        // Arrange (all required fields present; photo < 1MB)
        const req = mockReq(
          {
            name: "Phone Pro",
            description: "Premium device",
            price: 1299,
            category: "Mobiles",
            quantity: 10,
            shipping: true,
          },
          { photo: { path: "/tmp/p", type: "image/png", size: 999999 } }
        );
        const res = mockRes();

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({ success: true, message: "Product created successfully" })
        );
      });
    });

    describe("BVA tests", () => {
      test("Create product with all fields and photo < 1MB", async () => {
        // Arrange (all required fields present; photo < 1MB)
        const req = mockReq(
          {
            name: "Phone Pro",
            description: "Premium device",
            price: 1299,
            category: "Mobiles",
            quantity: 10,
            shipping: true,
          },
          { photo: { path: "/tmp/p", type: "image/png", size: 999999 } }
        );
        const res = mockRes();

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({ success: true, message: "Product created successfully" })
        );
      });

      test("Create product with all fields and photo = 1MB", async () => {
        // Arrange (all required fields present; photo = 1MB)
        const req = mockReq(
          {
            name: "Phone Pro",
            description: "Premium device",
            price: 1299,
            category: "Mobiles",
            quantity: 10,
            shipping: true,
          },
          { photo: { path: "/tmp/p", type: "image/png", size: 1000000 } }
        );
        const res = mockRes();

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({ success: false, message: "Photo should be less than 1MB" })
        );
      });

      test("Create product with all fields and photo > 1MB", async () => {
        // Arrange (all required fields present; photo > 1MB)
        const req = mockReq(
          {
            name: "Phone Pro",
            description: "Premium device",
            price: 1299,
            category: "Mobiles",
            quantity: 10,
            shipping: true,
          },
          { photo: { path: "/tmp/p", type: "image/png", size: 1000001 } }
        );
        const res = mockRes();

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({ success: false, message: "Photo should be less than 1MB" })
        );
      });

      test("Create product with all fields and photo = 0MB", async () => {
        // Arrange (all required fields present; photo = 0MB)
        const req = mockReq(
          {
            name: "Phone Pro",
            description: "Premium device",
            price: 1299,
            category: "Mobiles",
            quantity: 10,
            shipping: true,
          },
          { photo: { path: "/tmp/p", type: "image/png", size: 0 } }
        );
        const res = mockRes();

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({ success: true, message: "Product created successfully" })
        );
      });

      test("Create product with all fields and photo = 1 byte", async () => {
        // Arrange (all required fields present; photo = 1 byte)
        const req = mockReq(
          {
            name: "Phone Pro",
            description: "Premium device",
            price: 1299,
            category: "Mobiles",
            quantity: 10,
            shipping: true,
          },
          { photo: { path: "/tmp/p", type: "image/png", size: 1 } }
        );
        const res = mockRes();

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({ success: true, message: "Product created successfully" })
        );
      });
    });

    describe("Equivalence class tests for photo existence", () => {
      test("Create product with all fields and no photo", async () => {
        // Arrange (all required fields present; no photo provided)
        const req = mockReq(
          {
            name: "Phone Pro",
            description: "Premium device",
            price: 1299,
            category: "Mobiles",
            quantity: 10,
            shipping: true,
          },
          {}
        );
        const res = mockRes();

        // Act
        await createProductController(req, res);

        // Assert
        const fs = require("fs");
        expect(fs.readFileSync).not.toHaveBeenCalled();
      });

      test("Create product with all fields and photo", async () => {
        // Arrange (all required fields present; photo provided)
        const req = mockReq(
          {
            name: "Phone Pro",
            description: "Premium device",
            price: 1299,
            category: "Mobiles",
            quantity: 10,
            shipping: true,
          },
          { photo: { path: "/tmp/p", type: "image/png", size: 999999 } }
        );
        const res = mockRes();

        // Act
        await createProductController(req, res);

        // Assert
        const fs = require("fs");
        expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/p");
      });
    });

    describe("Error handling tests", () => {
      test("FS read failure should return 500", async () => {
        // Arrange: valid inputs with photo, but fs.readFileSync throws
        const req = mockReq(
          {
            name: "Err Product",
            description: "Cause fs error",
            price: 10,
            category: "Mobiles",
            quantity: 1,
            shipping: true,
          },
          { photo: { path: "/tmp/bad", type: "image/png", size: 100 } }
        );
        const res = mockRes();
        const fs = require("fs");
        fs.readFileSync.mockImplementationOnce(() => {
          throw new Error("FS fail");
        });

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          error: "FS fail",
          message: "Error creating product",
        });
      });

      test("DB save failure should return 500", async () => {
        // Arrange: valid inputs (no photo required), product save rejects
        const req = mockReq(
          {
            name: "Err Product",
            description: "Cause db error",
            price: 20,
            category: "Mobiles",
            quantity: 2,
            shipping: true,
          },
          {}
        );
        const res = mockRes();
        mockProductSave.mockRejectedValueOnce(new Error("DB fail"));

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          error: "DB fail",
          message: "Error creating product",
        });
      });
    });
  });

  // You Wei
  describe("updateProductController tests", () => {
    describe("Decision table tests", () => {
      test("Update product with missing name", async () => {
        // Arrange
        const req = mockReq(
          {
            // name: undefined
            description: "X",
            price: 1,
            category: "X",
            quantity: 1,
            shipping: true,
          },
          {},
          { pid: "p1" }
        );
        const res = mockRes();

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Product name is required",
        });
      });

      test("Update product with name but missing description", async () => {
        // Arrange
        const req = mockReq(
          {
            name: "Some Product",
            // description: undefined
            price: 1,
            category: "X",
            quantity: 1,
            shipping: true,
          },
          {},
          { pid: "p1" }
        );
        const res = mockRes();

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Product description is required",
        });
      });

      test("Update product with missing price", async () => {
        const req = mockReq(
          {
            name: "Some Product",
            description: "D",
            // price: undefined
            category: "X",
            quantity: 1,
            shipping: true,
          },
          {},
          { pid: "p1" }
        );
        const res = mockRes();
        await updateProductController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Product price is required",
        });
      });

      test("Update product with missing category", async () => {
        const req = mockReq(
          {
            name: "Some Product",
            description: "D",
            price: 2,
            // category: undefined
            quantity: 1,
            shipping: true,
          },
          {},
          { pid: "p1" }
        );
        const res = mockRes();
        await updateProductController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Product category is required",
        });
      });

      test("Update product with missing quantity", async () => {
        const req = mockReq(
          {
            name: "Some Product",
            description: "D",
            price: 2,
            category: "X",
            // quantity: undefined
            shipping: true,
          },
          {},
          { pid: "p1" }
        );
        const res = mockRes();
        await updateProductController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Product quantity is required",
        });
      });

      test("Update product with photo >= 1MB", async () => {
        const req = mockReq(
          {
            name: "Some Product",
            description: "D",
            price: 2,
            category: "X",
            quantity: 1,
            shipping: true,
          },
          { photo: { path: "/tmp/p", type: "image/png", size: 1000000 } },
          { pid: "p1" }
        );
        const res = mockRes();
        await updateProductController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Photo should be less than 1MB",
        });
      });

      test("Update product with shipping undefined", async () => {
        const req = mockReq(
          {
            name: "Some Product",
            description: "D",
            price: 2,
            category: "X",
            quantity: 1,
            // shipping: undefined
          },
          {},
          { pid: "p1" }
        );
        const res = mockRes();
        await updateProductController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Product shipping is required",
        });
      });

      test("Update product with no photo (valid)", async () => {
        // Arrange: all fields present, no photo provided
        const req = mockReq(
          {
            name: "Updated Product",
            description: "New",
            price: 10,
            category: "Mobiles",
            quantity: 2,
            shipping: true,
          },
          {},
          { pid: "pid-nophoto" }
        );
        const res = mockRes();

        //cuz its a success case need to let product be findable
        const updatedDoc = { photo: {}, save: jest.fn().mockResolvedValue(undefined) };
        mockProductFindByIdAndUpdate.mockResolvedValueOnce(updatedDoc);

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({ success: true, message: "Product updated successfully" })
        );
      });
    });

    describe("BVA tests", () => {
      test("Update with photo < 1MB", async () => {
        const req = mockReq(
          {
            name: "Updated Product",
            description: "New",
            price: 10,
            category: "Mobiles",
            quantity: 2,
            shipping: true,
          },
          { photo: { path: "/tmp/p", type: "image/png", size: 999999 } },
          { pid: "pid-200" }
        );
        const res = mockRes();
        const updatedDoc = { photo: {}, save: jest.fn().mockResolvedValue(undefined) };
        mockProductFindByIdAndUpdate.mockResolvedValueOnce(updatedDoc);

        await updateProductController(req, res);

        const fs = require("fs");
        expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/p");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({ success: true, message: "Product updated successfully" })
        );
      });

      test("Update with photo = 1MB (invalid)", async () => {
        const req = mockReq(
          {
            name: "Updated Product",
            description: "New",
            price: 10,
            category: "Mobiles",
            quantity: 2,
            shipping: true,
          },
          { photo: { path: "/tmp/p", type: "image/png", size: 1000000 } },
          { pid: "pid-400-1" }
        );
        const res = mockRes();

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Photo should be less than 1MB",
        });
      });

      test("Update with photo > 1MB (invalid)", async () => {
        const req = mockReq(
          {
            name: "Updated Product",
            description: "New",
            price: 10,
            category: "Mobiles",
            quantity: 2,
            shipping: true,
          },
          { photo: { path: "/tmp/p", type: "image/png", size: 1000001 } },
          { pid: "pid-400-2" }
        );
        const res = mockRes();

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Photo should be less than 1MB",
        });
      });

      test("Update with photo = 0 bytes", async () => {
        const req = mockReq(
          {
            name: "Updated Product",
            description: "New",
            price: 10,
            category: "Mobiles",
            quantity: 2,
            shipping: true,
          },
          { photo: { path: "/tmp/p", type: "image/png", size: 0 } },
          { pid: "pid-0" }
        );
        const res = mockRes();
        const updatedDoc = { photo: {}, save: jest.fn().mockResolvedValue(undefined) };
        mockProductFindByIdAndUpdate.mockResolvedValueOnce(updatedDoc);

        await updateProductController(req, res);

        const fs = require("fs");
        expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/p");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({ success: true, message: "Product updated successfully" })
        );
      });

      test("Update with photo = 1 byte", async () => {
        const req = mockReq(
          {
            name: "Updated Product",
            description: "New",
            price: 10,
            category: "Mobiles",
            quantity: 2,
            shipping: true,
          },
          { photo: { path: "/tmp/p", type: "image/png", size: 1 } },
          { pid: "pid-1" }
        );
        const res = mockRes();
        const updatedDoc = { photo: {}, save: jest.fn().mockResolvedValue(undefined) };
        mockProductFindByIdAndUpdate.mockResolvedValueOnce(updatedDoc);

        await updateProductController(req, res);

        const fs = require("fs");
        expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/p");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({ success: true, message: "Product updated successfully" })
        );
      });
    });

    describe("Equivalence partition tests for if branches", () => {
      test("Update with photo", async () => {
        // Arrange
        const req = mockReq(
          {
            name: "Eq Product",
            description: "Eq desc",
            price: 11,
            category: "Mobiles",
            quantity: 2,
            shipping: true,
          },
          { photo: { path: "/tmp/eq.png", type: "image/png", size: 999999 } },
          { pid: "pid-eq-photo" }
        );
        const res = mockRes();
        const updatedDoc = { photo: {}, save: jest.fn().mockResolvedValue(undefined) };
        mockProductFindByIdAndUpdate.mockResolvedValueOnce(updatedDoc);

        // Act
        await updateProductController(req, res);

        // Assert
        const fs = require("fs");
        expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/eq.png");
      });

      test("Update with no photo", async () => {
        // Arrange
        const req = mockReq(
          {
            name: "Eq Product",
            description: "Eq desc",
            price: 11,
            category: "Mobiles",
            quantity: 2,
            shipping: true,
          },
          {},
          { pid: "pid-eq-nophoto" }
        );
        const res = mockRes();
        const updatedDoc = { photo: {}, save: jest.fn().mockResolvedValue(undefined) };
        mockProductFindByIdAndUpdate.mockResolvedValueOnce(updatedDoc);

        // Act
        await updateProductController(req, res);

        // Assert
        const fs = require("fs");
        expect(fs.readFileSync).not.toHaveBeenCalled();
      });

      test("Product not found", async () => {
        // Arrange
        const req = mockReq(
          {
            name: "Eq Product",
            description: "Eq desc",
            price: 11,
            category: "Mobiles",
            quantity: 2,
            shipping: true,
          },
          {},
          { pid: "pid-missing" }
        );
        const res = mockRes();
        mockProductFindByIdAndUpdate.mockResolvedValueOnce(null);

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Product not found" });
      });

      test("Product found", async () => {
        // Arrange
        const req = mockReq(
          {
            name: "Eq Product",
            description: "Eq desc",
            price: 11,
            category: "Mobiles",
            quantity: 2,
            shipping: true,
          },
          {},
          { pid: "pid-found" }
        );
        const res = mockRes();
        const updatedDoc = { photo: {}, save: jest.fn().mockResolvedValue(undefined) };
        mockProductFindByIdAndUpdate.mockResolvedValueOnce(updatedDoc);

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
      });
    });

    describe("Error handling tests", () => {
      test("FS read failure during update should return 500", async () => {
        const req = mockReq(
          {
            name: "Updated Product",
            description: "New",
            price: 10,
            category: "Mobiles",
            quantity: 2,
            shipping: true,
          },
          { photo: { path: "/tmp/bad", type: "image/png", size: 100 } },
          { pid: "pid-123" }
        );
        const res = mockRes();
        const updatedDoc = { photo: {}, save: jest.fn() };
        mockProductFindByIdAndUpdate.mockResolvedValueOnce(updatedDoc);
        const fs = require("fs");
        fs.readFileSync.mockImplementationOnce(() => { throw new Error("FS fail"); });

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          error: "FS fail",
          message: "Error updating product",
        });
      });

      test("DB save failure during update should return 500", async () => {
        const req = mockReq(
          {
            name: "Updated Product",
            description: "New",
            price: 10,
            category: "Mobiles",
            quantity: 2,
            shipping: true,
          },
          {},
          { pid: "pid-123" }
        );
        const res = mockRes();
        const updatedDoc = { photo: {}, save: jest.fn().mockRejectedValueOnce(new Error("DB fail")) };
        mockProductFindByIdAndUpdate.mockResolvedValueOnce(updatedDoc);

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          error: "DB fail",
          message: "Error updating product",
        });
      });
    });
  });

  // You Wei
  describe("deleteProductController tests", () => {
    describe("Equivalence partition tests", () => {
      test("Product found", async () => {
        // Arrange
        const req = mockReq({}, {}, { pid: "del-1" });
        const res = mockRes();
        const select = jest.fn().mockResolvedValue({ _id: "del-1" });
        MockProductModel.findByIdAndDelete.mockReturnValueOnce({ select });

        // Act
        await deleteProductController(req, res);

        // Assert
        expect(MockProductModel.findByIdAndDelete).toHaveBeenCalledWith("del-1");
        expect(select).toHaveBeenCalledWith("-photo");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({ success: true, message: "Product deleted successfully" });
      });

      test("Product not found", async () => {
        // Arrange
        const req = mockReq({}, {}, { pid: "del-missing" });
        const res = mockRes();
        const select = jest.fn().mockResolvedValue(null);
        MockProductModel.findByIdAndDelete.mockReturnValueOnce({ select });

        // Act
        await deleteProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Product not found" });
      });
    });

    describe("Error handling tests", () => {
      test("DB failure during delete should return 500", async () => {
        // Arrange
        const req = mockReq({}, {}, { pid: "del-err" });
        const res = mockRes();
        const error = new Error("DB fail");
        const select = jest.fn().mockRejectedValue(error);
        MockProductModel.findByIdAndDelete.mockReturnValueOnce({ select });

        // Act
        await deleteProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          error: "DB fail",
          message: "Error deleting product",
        });
      });
    });
  });
});
