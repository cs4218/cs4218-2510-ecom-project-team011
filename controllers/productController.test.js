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

describe('Product Controller - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

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

  describe('getProductController', () => {
    test('should get all products successfully', async () => {
      const req = mockReq();
      const res = mockRes();
      const mockProducts = [{ _id: '1', name: 'Product 1' }];

      MockProductModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(mockProducts)
            })
          })
        })
      });

      await getProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        totalCount: 1,
        message: 'All products retrieved successfully',
        products: mockProducts
      });
    });

    test('should handle database error', async () => {
      const req = mockReq();
      const res = mockRes();

      MockProductModel.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      await getProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: 'Database error',
        message: 'Error retrieving products'
      });
    });
  });

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
});
