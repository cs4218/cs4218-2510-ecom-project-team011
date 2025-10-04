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
    save: mockProductSave
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
jest.mock('braintree', () => ({
  BraintreeGateway: jest.fn().mockImplementation(() => ({
    clientToken: { generate: mockClientTokenGenerate },
    transaction: { sale: mockTransactionSale }
  })),
  Environment: { Sandbox: 'sandbox' }
}));

jest.mock('../models/productModel.js', () => ({ __esModule: true, default: MockProductModel }));
jest.mock('../models/categoryModel.js', () => ({ __esModule: true, default: MockCategoryModel }));
jest.mock('../models/orderModel.js', () => ({ __esModule: true, default: MockOrderModel }));
jest.mock('fs', () => ({ readFileSync: jest.fn().mockReturnValue(Buffer.from('fake-image')) }));
jest.mock('slugify', () => jest.fn(text => text.toLowerCase().replace(/\s+/g, '-')));

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
  productCategoryController,
  braintreeTokenController,
  brainTreePaymentController
} = require('../controllers/productController');

// Test helpers
const mockReq = (fields = {}, files = {}, params = {}, body = {}, user = null) => 
  ({ fields, files, params, body, user });

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

// Structure and basic tests generated with the help of ChatGPT and Github Copilot
describe('Product Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  // Leon
  describe('createProductController', () => {
    const validFields = {
      name: 'Test Product',
      description: 'Test Description', 
      price: 99.99,
      category: 'cat1',
      quantity: 10
    };

    test('should create product successfully', async () => {
      const req = mockReq(validFields);
      const res = mockRes();
      
      // The controller creates a new product instance with the fields
      const expectedProduct = {
        ...validFields,
        slug: 'test-product',
        _id: '1',
        photo: { data: null, contentType: null }
      };
      
      mockProductSave.mockResolvedValue(expectedProduct);

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Product created successfully',
        product: expect.objectContaining({
          name: 'Test Product',
          description: 'Test Description'
        })
      });
      expect(mockProductSave).toHaveBeenCalled();
    });

    test('should create product with photo', async () => {
      const files = { photo: { path: '/fake/path', type: 'image/jpeg', size: 500000 }};
      const req = mockReq(validFields, files);
      const res = mockRes();
      
      mockProductSave.mockResolvedValue({ _id: '1', ...validFields });

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockProductSave).toHaveBeenCalled();
    });

    // Test all validation errors with correct status codes and messages
    const validationTests = [
      { field: 'name', message: 'Product name is required' },
      { field: 'description', message: 'Product description is required' },
      { field: 'price', message: 'Product price is required' },
      { field: 'category', message: 'Product category is required' },
      { field: 'quantity', message: 'Product quantity is required' }
    ];

    validationTests.forEach(({ field, message }) => {
      test(`should return 400 when ${field} is missing`, async () => {
        const invalidFields = { ...validFields };
        delete invalidFields[field];
        const req = mockReq(invalidFields);
        const res = mockRes();

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message
        });
      });
    });

    test('should return 400 when photo too large', async () => {
      const files = { photo: { size: 2000000 }};
      const req = mockReq(validFields, files);
      const res = mockRes();

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Photo is required and should be less than 1MB'
      });
    });

    test('should handle database error', async () => {
      const req = mockReq(validFields);
      const res = mockRes();
      
      mockProductSave.mockRejectedValue(new Error('Database error'));

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: 'Database error',
        message: 'Error creating product'
      });
    });
  });

  // Leon
  describe('deleteProductController', () => {
    test('should delete product successfully', async () => {
      const req = mockReq({}, {}, { pid: '1' });
      const res = mockRes();

      MockProductModel.findByIdAndDelete.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: '1' })
      });

      await deleteProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Product deleted successfully'
      });
    });

    test('should return 404 when product not found', async () => {
      const req = mockReq({}, {}, { pid: '999' });
      const res = mockRes();

      MockProductModel.findByIdAndDelete.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await deleteProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found'
      });
    });
  });

  // Leon
  describe('updateProductController', () => {
    const validFields = {
      name: 'Updated Product',
      description: 'Updated Description',
      price: 149.99,
      category: 'cat1',
      quantity: 5
    };

    test('should update product successfully', async () => {
      const req = mockReq(validFields, {}, { pid: '1' });
      const res = mockRes();
      const mockProduct = { _id: '1', ...validFields, save: jest.fn().mockResolvedValue() };

      mockProductFindByIdAndUpdate.mockResolvedValue(mockProduct);

      await updateProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Product updated successfully',
        product: mockProduct
      });
    });

    test('should return 404 when product not found', async () => {
      const req = mockReq(validFields, {}, { pid: '999' });
      const res = mockRes();

      mockProductFindByIdAndUpdate.mockResolvedValue(null);

      await updateProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found'
      });
    });
  });

  // Leon
  describe('braintreeTokenController', () => {
    test('should generate token successfully', async () => {
      const req = mockReq();
      const res = mockRes();

      mockClientTokenGenerate.mockImplementation((options, callback) => {
        callback(null, { clientToken: 'fake-token' });
      });

      await braintreeTokenController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Payment token generated successfully',
        clientToken: 'fake-token'
      });
    });

    test('should handle token generation error', async () => {
      const req = mockReq();
      const res = mockRes();

      mockClientTokenGenerate.mockImplementation((options, callback) => {
        callback({ message: 'Token error' }, null);
      });

      await braintreeTokenController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: 'Token error',
        message: 'Error generating payment token'
      });
    });
  });

  // Leon
  describe('brainTreePaymentController', () => {
    const validPayment = {
      nonce: 'fake-nonce',
      cart: [{ _id: '1', price: 50 }, { _id: '2', price: 30 }]
    };
    const validUser = { _id: 'user-1' };

    test('should process payment successfully', async () => {
      const req = mockReq({}, {}, {}, validPayment, validUser);
      const res = mockRes();

      mockTransactionSale.mockImplementation((options, callback) => {
        callback(null, { transaction: { id: 'txn-123' }});
      });
      mockOrderSave.mockResolvedValue({ _id: 'order-123' });

      await brainTreePaymentController(req, res);

      expect(mockTransactionSale).toHaveBeenCalledWith({
        amount: 80,
        paymentMethodNonce: 'fake-nonce',
        options: { submitForSettlement: true }
      }, expect.any(Function));

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Payment processed successfully',
        transaction: { transaction: { id: 'txn-123' }}
      });
    });

    test('should return 400 when nonce missing', async () => {
      const req = mockReq({}, {}, {}, { cart: validPayment.cart }, validUser);
      const res = mockRes();

      await brainTreePaymentController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Payment nonce is required'
      });
    });

    test('should return 400 when cart empty', async () => {
      const req = mockReq({}, {}, {}, { nonce: 'fake-nonce', cart: [] }, validUser);
      const res = mockRes();

      await brainTreePaymentController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Cart is required and cannot be empty'
      });
    });

    test('should return 401 when user not authenticated', async () => {
      const req = mockReq({}, {}, {}, validPayment, null);
      const res = mockRes();

      await brainTreePaymentController(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'User authentication required'
      });
    });

    test('should handle payment processing error', async () => {
      const req = mockReq({}, {}, {}, validPayment, validUser);
      const res = mockRes();

      mockTransactionSale.mockImplementation((options, callback) => {
        callback({ message: 'Payment failed' }, null);
      });

      await brainTreePaymentController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: 'Payment failed',
        message: 'Payment processing failed'
      });
    });
  });


  // describe('getProductController', () => {
  //   test('should get all products successfully', async () => {
  //     const req = mockReq();
  //     const res = mockRes();
  //     const mockProducts = [{ _id: '1', name: 'Product 1' }];

  //     MockProductModel.find.mockReturnValue({
  //       populate: jest.fn().mockReturnValue({
  //         select: jest.fn().mockReturnValue({
  //           limit: jest.fn().mockReturnValue({
  //             sort: jest.fn().mockResolvedValue(mockProducts)
  //           })
  //         })
  //       })
  //     });

  //     await getProductController(req, res);

  //     expect(res.status).toHaveBeenCalledWith(200);
  //     expect(res.send).toHaveBeenCalledWith({
  //       success: true,
  //       totalCount: 1,
  //       message: 'All products retrieved successfully',
  //       products: mockProducts
  //     });
  //   });

  //   test('should handle database error', async () => {
  //     const req = mockReq();
  //     const res = mockRes();

  //     MockProductModel.find.mockImplementation(() => {
  //       throw new Error('Database error');
  //     });

  //     await getProductController(req, res);

  //     expect(res.status).toHaveBeenCalledWith(500);
  //     expect(res.send).toHaveBeenCalledWith({
  //       success: false,
  //       error: 'Database error',
  //       message: 'Error retrieving products'
  //     });
  //   });
  // });

  // Sean
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
      const req = mockReq();
      const res = mockRes();
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
      expect(productModel.find).toHaveBeenCalledWith({});
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
      expect(res.status).toHaveBeenCalledWith(500);
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
      expect(res.status).toHaveBeenCalledWith(500);
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
        message: "Error retrieving related products",
        error,
      });
    });
  });

  describe("Given that productCategoryController is called", () => {
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
        message: "Error retrieving products by category",
      });
    });
  });



  // LEON'S NEED TO REMOVE
  describe('getSingleProductController', () => {
    test('should get single product successfully', async () => {
      const req = mockReq({}, {}, { slug: 'test-product' });
      const res = mockRes();
      const mockProduct = { _id: '1', name: 'Test Product' };

      MockProductModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockProduct)
        })
      });

      await getSingleProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Product retrieved successfully',
        product: mockProduct
      });
    });

    test('should return 404 when product not found', async () => {
      const req = mockReq({}, {}, { slug: 'nonexistent' });
      const res = mockRes();

      MockProductModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      await getSingleProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found'
      });
    });
  });

  describe('productPhotoController', () => {
    test('should return photo successfully', async () => {
      const req = mockReq({}, {}, { pid: '1' });
      const res = mockRes();
      const mockProduct = {
        photo: { 
          data: Buffer.from('image-data'),
          contentType: 'image/jpeg'
        }
      };

      MockProductModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockProduct)
      });

      await productPhotoController(req, res);

      expect(res.set).toHaveBeenCalledWith('Content-type', 'image/jpeg');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockProduct.photo.data);
    });

    test('should return 404 when product not found', async () => {
      const req = mockReq({}, {}, { pid: '999' });
      const res = mockRes();

      MockProductModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await productPhotoController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found'
      });
    });

    test('should return 404 when photo not found', async () => {
      const req = mockReq({}, {}, { pid: '1' });
      const res = mockRes();

      MockProductModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ photo: { data: null }})
      });

      await productPhotoController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Product photo not found'
      });
    });
  });

  describe('searchProductController', () => {
    test('should search products successfully', async () => {
      const req = mockReq({}, {}, { keyword: 'laptop' });
      const res = mockRes();
      const mockResults = [{ _id: '1', name: 'Gaming Laptop' }];

      MockProductModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockResults)
      });

      await searchProductController(req, res);

      expect(MockProductModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: 'laptop', $options: 'i' }},
          { description: { $regex: 'laptop', $options: 'i' }}
        ]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Search completed successfully',
        results: mockResults
      });
    });

    test('should return 400 when keyword missing', async () => {
      const req = mockReq({}, {}, { keyword: '' });
      const res = mockRes();

      await searchProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Search keyword is required'
      });
    });
  });

  describe('productCategoryController', () => {
    test('should get products by category successfully', async () => {
      const req = mockReq({}, {}, { slug: 'electronics' });
      const res = mockRes();
      const mockCategory = { _id: 'cat1', name: 'Electronics' };
      const mockProducts = [{ _id: '1', name: 'Product 1' }];

      mockCategoryFindOne.mockResolvedValue(mockCategory);
      MockProductModel.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProducts)
      });

      await productCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Products by category retrieved successfully',
        category: mockCategory,
        products: mockProducts
      });
    });

    test('should return 404 when category not found', async () => {
      const req = mockReq({}, {}, { slug: 'nonexistent' });
      const res = mockRes();

      mockCategoryFindOne.mockResolvedValue(null);

      await productCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Category not found'
      });
    });
  });


});
