import {
  getProductController,
  getSingleProductController,
  productPhotoController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  relatedProductController,
  productCategoryController,
  braintreeTokenController,
  brainTreePaymentController,
} from "./productController.js";

import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";
import braintree from "braintree";

// Mock dependencies
jest.mock("../models/productModel.js");
jest.mock("../models/categoryModel.js");
jest.mock("../models/orderModel.js");
jest.mock("fs");
jest.mock("dotenv");
jest.mock("braintree");

// Structure and basic tests generated with the help of ChatGPT and Github Copilot
describe("Product Controller Tests", () => {
  let req, res, mockProduct, mockProducts;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      fields: {},
      files: {},
      user: { _id: "user123" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe("Given that getProductController is called", () => {
    mockProduct = {
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

    mockProducts = [
      mockProduct,
      {
        _id: "2",
        name: "Product 2",
        slug: "product-2",
        price: 200,
        category: "category-id-1",
      },
    ];

    it("should return all products successfully", async () => {
      // Arrange
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockProducts),
      };

      productModel.find.mockReturnValue(mockQuery);

      // Act
      await getProductController(req, res);

      // Assert
      // Brittle tests to check exact calls and parameters; can remove assertions if needed
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(mockQuery.populate).toHaveBeenCalledWith("category");
      expect(mockQuery.select).toHaveBeenCalledWith("-photo");
      expect(mockQuery.limit).toHaveBeenCalledWith(12);
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      // Expected results from response
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

      productModel.find.mockReturnValue(mockQuery);

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

  describe("Given that getSingleProductController is called", () => {
    mockProduct = {
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

    mockProducts = [
      mockProduct,
      {
        _id: "2",
        name: "Product 2",
        slug: "product-2",
        price: 200,
        category: "category-id-1",
      },
    ];
    it("should return single product by slug successfully", async () => {
      // Arrange
      req.params.slug = "product-1";

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockProduct),
      };

      productModel.findOne.mockReturnValue(mockQuery);

      // Act
      await getSingleProductController(req, res);

      // Assert
      expect(productModel.findOne).toHaveBeenCalledWith({ slug: "product-1" });
      expect(mockQuery.select).toHaveBeenCalledWith("-photo");
      expect(mockQuery.populate).toHaveBeenCalledWith("category");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Single Product Fetched",
        product: mockProduct,
      });
    });

    it("should return failing query with no result when no product found", async () => {
      // Arrange
      req.params.slug = "product-3"; // Slug for non-existent product

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(null),
      };

      productModel.findOne.mockReturnValue(mockQuery);

      // Act
      await getSingleProductController(req, res);

      // Assert
      expect(productModel.findOne).toHaveBeenCalledWith({ slug: "product-3" });
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
      const errorMessage = "Database error";
      const error = new Error(errorMessage);
      req.params.slug = "product-1"; // valid slug
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockRejectedValue(error),
      };

      productModel.findOne.mockReturnValue(mockQuery);

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

    // it("should handle error when invalid slug used", async () => {
    //   const errorMessage = "Invalid slug";
    //   const error = new Error(errorMessage);
    //   req.params.slug = 10000; // invalid slug
    //   const mockQuery = {
    //     select: jest.fn().mockReturnThis(),
    //     populate: jest.fn().mockRejectedValue(error),
    //   };

    //   productModel.findOne.mockReturnValue(mockQuery);

    //   await getSingleProductController(req, res);

    //   expect(res.status).toHaveBeenCalledWith(500);
    //   expect(res.send).toHaveBeenCalledWith({
    //     success: false,
    //     message: errorMessage,

    //   });
    // });
  });

  describe("Given that productPhotoController is called", () => {
    mockProduct = {
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

    mockProducts = [
      mockProduct,
      {
        _id: "2",
        name: "Product 2",
        slug: "product-2",
        price: 200,
        category: "category-id-1",
      },
    ];

    it("should return product photo successfully if photo exists", async () => {
      // Arrange
      req.params.pid = "product-1";

      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockProduct),
      };

      productModel.findById.mockReturnValue(mockQuery);

      // Act
      await productPhotoController(req, res);

      // Assert
      expect(productModel.findById).toHaveBeenCalledWith("product-1");
      expect(mockQuery.select).toHaveBeenCalledWith("photo");
      expect(res.set).toHaveBeenCalledWith("Content-type", "image/jpeg");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockProduct.photo.data);
    });

    it("should return 404 if photo does not exists", async () => {
      // Arrange
      req.params.pid = "product-2";

      const mockQuery = {
        select: jest.fn().mockReturnValue(null),
      };

      productModel.findById.mockReturnValue(mockQuery);

      // Act
      await productPhotoController(req, res);

      // Assert
      expect(productModel.findById).toHaveBeenCalledWith("product-2");
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
      req.params.pid = "invalid-id";

      const mockQuery = {
        select: jest.fn().mockRejectedValue(error),
      };

      productModel.findById.mockReturnValue(mockQuery);

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

  describe("Given that productFiltersController is called", () => {
    it("should filter products by category and price successfully", async () => {
      // Arrange
      req.body = {
        checked: ["category-id-1", "category-id-2"],
        radio: [100, 500],
      };

      productModel.find.mockResolvedValue(mockProducts);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({
        category: { $in: ["category-id-1", "category-id-2"] },
        price: { $gte: 100, $lte: 500 },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

    it("should filter products by category only", async () => {
      // Arrange
      const mockCategoryOnlyProducts = [{ _id: "1", name: "Filtered Product" }];
      req.body = {
        checked: ["category-id-1"],
        radio: [],
      };

      productModel.find.mockResolvedValue(mockCategoryOnlyProducts);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({
        category: { $in: ["category-id-1"] },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should not filter if invalid range of prices is provided", async () => {
      // Arrange
      req.body = {
        checked: [],
        radio: [200],
      };

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({});
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
      req.body = {
        checked: [],
        radio: [],
      };

      productModel.find.mockResolvedValue(mockAllProducts);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle error during filtering", async () => {
      // Arrange
      const error = new Error("Filter error");
      req.body = { checked: [], radio: [] };

      productModel.find.mockRejectedValue(error);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Filtering Products",
        error,
      });
    });
  });

  describe("Given that productCountController is called", () => {
    it("should return total product count successfully", async () => {
      // Arrange
      const mockQuery = {
        estimatedDocumentCount: jest.fn().mockResolvedValue(25),
      };

      productModel.find.mockReturnValue(mockQuery);

      // Act
      await productCountController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(mockQuery.estimatedDocumentCount).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        total: 25,
      });
    });

    it("should handle error when counting products fails", async () => {
      // Arrange
      const error = new Error("Count error");
      const mockQuery = {
        estimatedDocumentCount: jest.fn().mockRejectedValue(error),
      };

      productModel.find.mockReturnValue(mockQuery);

      // Act
      await productCountController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: "Error in product count",
        error,
        success: false,
      });
    });
  });

  describe("Given that productListController is called", () => {
    mockProduct = {
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

    mockProducts = [
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

      productModel.find.mockReturnValue(mockQuery);

      // Act
      await productListController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(mockQuery.select).toHaveBeenCalledWith("-photo");
      expect(mockQuery.skip).toHaveBeenCalledWith(6);
      expect(mockQuery.limit).toHaveBeenCalledWith(6);
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProductsSecondPage,
      });
    });

    it("should default to page 1 when no page parameter provided", async () => {
      // Assign
      req.params = {}; // No page parameter

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockProducts),
      };

      productModel.find.mockReturnValue(mockQuery);

      // Act
      await productListController(req, res);

      // Assert
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
    });

    it("should handle error during pagination", async () => {
      // Assign
      const error = new Error("Pagination error");
      req.params.page = "-1";

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(error),
      };

      productModel.find.mockReturnValue(mockQuery);

      // Act
      await productListController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in per page controller",
        error,
      });
    });
  });

  describe("Given that searchProductController is called", () => {
    it("should search products by keyword successfully", async () => {
      // Assign
      const mockResults = [
        { _id: "1", name: "iPhone 13", description: "Latest iPhone" },
        { _id: "2", name: "Samsung Galaxy", description: "Android phone" },
      ];
      req.params.keyword = "phone";

      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockResults),
      };

      productModel.find.mockReturnValue(mockQuery);

      // Act
      await searchProductController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: "phone", $options: "i" } },
          { description: { $regex: "phone", $options: "i" } },
        ],
      });
      expect(mockQuery.select).toHaveBeenCalledWith("-photo");
      expect(res.json).toHaveBeenCalledWith(mockResults);
    });

    it("should handle error during search", async () => {
      // Assign
      const error = new Error("Search error");
      req.params.keyword = "error";

      const mockQuery = {
        select: jest.fn().mockRejectedValue(error),
      };

      productModel.find.mockReturnValue(mockQuery);

      // Act
      await searchProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error In Search Product Controller",
        error,
      });
    });

    it("should return empty array when no products match search", async () => {
      // Assign
      req.params.keyword = "nonexistent";

      const mockQuery = {
        select: jest.fn().mockResolvedValue([]),
      };

      productModel.find.mockReturnValue(mockQuery);

      // Act
      await searchProductController(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe("Given that relatedProductController is called", () => {
    it("should return related products successfully", async () => {
      // Assign
      const mockProducts = [
        { _id: "2", name: "Related Product 1", category: "category123" },
        { _id: "3", name: "Related Product 2", category: "category123" },
      ];
      req.params = { pid: "1", cid: "category123" };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockProducts),
      };

      productModel.find.mockReturnValue(mockQuery);

      // Act
      await relatedProductController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({
        category: "category123",
        _id: { $ne: "1" },
      });
      expect(mockQuery.select).toHaveBeenCalledWith("-photo");
      expect(mockQuery.limit).toHaveBeenCalledWith(3);
      expect(mockQuery.populate).toHaveBeenCalledWith("category");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

    it("should handle error when fetching related products", async () => {
      // Assign
      const error = new Error("Related products error");
      req.params = { pid: "1", cid: "category123" };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockRejectedValue(error),
      };

      productModel.find.mockReturnValue(mockQuery);

      // Act
      await relatedProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "error while getting related products",
        error,
      });
    });
  });

  describe("productCategoryController", () => {
    it("should return products by category successfully", async () => {
      // Assign
      const mockCategory = {
        _id: "category-id-1",
        name: "Electronics",
        slug: "electronics",
      };
      const mockProducts = [
        { _id: "1", name: "Product 1", category: "category-id-1" },
        { _id: "2", name: "Product 2", category: "category-id-1" },
      ];
      req.params.slug = "electronics";

      categoryModel.findOne.mockResolvedValue(mockCategory);
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockProducts),
      };
      productModel.find.mockReturnValue(mockQuery);

      // Act
      await productCategoryController(req, res);

      // Assert
      expect(categoryModel.findOne).toHaveBeenCalledWith({
        slug: "electronics",
      });
      expect(productModel.find).toHaveBeenCalledWith({
        category: mockCategory,
      });
      expect(mockQuery.populate).toHaveBeenCalledWith("category");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        category: mockCategory,
        products: mockProducts,
      });
    });

    it("should handle error when category not found", async () => {
      // Assign
      const error = new Error("Category not found");
      req.params.slug = "invalid-category";

      categoryModel.findOne.mockRejectedValue(error);

      // Act
      await productCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error,
        message: "Error While Getting products",
      });
    });
  });
});
