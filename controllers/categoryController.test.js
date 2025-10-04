// Create mock functions first
const mockFindOne = jest.fn();
const mockFind = jest.fn();
const mockFindById = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockFindByIdAndDelete = jest.fn();
const mockSave = jest.fn();

// Create the mock constructor
const MockCategoryModel = jest.fn().mockImplementation((data) => ({
  ...data,
  save: mockSave
}));

// Add static methods to the constructor
MockCategoryModel.findOne = mockFindOne;
MockCategoryModel.find = mockFind;
MockCategoryModel.findById = mockFindById;
MockCategoryModel.findByIdAndUpdate = mockFindByIdAndUpdate;
MockCategoryModel.findByIdAndDelete = mockFindByIdAndDelete;

// Mock the module with both default and named exports
jest.mock('../models/categoryModel', () => ({
  __esModule: true,
  default: MockCategoryModel,
  ...MockCategoryModel
}));

// NOW import the controllers (after the mock is set up)
const { 
  createCategoryController, 
  updateCategoryController,
  categoryControlller, // Note: This matches the typo in your controller
  singleCategoryController,
  deleteCategoryController // Note: This matches the typo in your controller
} = require('../controllers/categoryController');

// Helper functions to create mock req/res objects
const createMockRequest = (body = {}, params = {}) => ({ body, params });
const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('Category Controller', () => {
  // Mock console.log to avoid cluttering test output
  let originalConsoleLog;
  
  beforeAll(() => {
    originalConsoleLog = console.log;
    console.log = jest.fn();
  });

  afterAll(() => {
    console.log = originalConsoleLog;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindOne.mockClear();
    mockFind.mockClear();
    mockFindById.mockClear();
    mockFindByIdAndUpdate.mockClear();
    mockFindByIdAndDelete.mockClear();
    mockSave.mockClear();
  });

  describe('createCategoryController', () => {
    test('should create a new category successfully', async () => {
      // Arrange
      const req = createMockRequest({ name: 'Electronics' });
      const res = createMockResponse();
      const mockCategory = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Electronics',
        slug: 'electronics'
      };

      mockFindOne.mockResolvedValue(null);
      mockSave.mockResolvedValue(mockCategory);

      // Act
      await createCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Category created successfully', // Updated message
        category: mockCategory
      });
      expect(mockFindOne).toHaveBeenCalledTimes(1);;
    });

    test('should return conflict when category already exists', async () => {
      // Arrange
      const req = createMockRequest({ name: 'Electronics' });
      const res = createMockResponse();
      const existingCategory = {
        _id: '1',
        name: 'Electronics',
        slug: 'electronics'
      };

      mockFindOne.mockResolvedValue(existingCategory);

      // Act
      await createCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409); // Conflict status
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Category already exists' // Updated message
      });
    });

    test('should return error when name is not provided', async () => {
      // Arrange
      const req = createMockRequest({});
      const res = createMockResponse();

      // Act
      await createCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400); // Bad Request
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Category name is required and cannot be empty'
      });
    });

    test('should return error when name is empty string', async () => {
      // Arrange
      const req = createMockRequest({ name: '' });
      const res = createMockResponse();

      // Act
      await createCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Category name is required and cannot be empty'
      });
    });

    test('should handle database errors', async () => {
      // Arrange
      const req = createMockRequest({ name: 'Electronics' });
      const res = createMockResponse();

      mockFindOne.mockRejectedValue(new Error('Database connection failed'));

      // Act
      await createCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: 'Database connection failed',
        message: 'Error creating category'
      });
    });
  });

  describe('categoryControlller (getAllCategories)', () => {
    test('should get all categories successfully', async () => {
      // Arrange
      const req = createMockRequest();
      const res = createMockResponse();
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' },
        { _id: '2', name: 'Books', slug: 'books' },
        { _id: '3', name: 'Clothing', slug: 'clothing' }
      ];

      mockFind.mockResolvedValue(mockCategories);

      // Act
      await categoryControlller(req, res); // Note: Using the typo from controller

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'All Categories List',
        category: mockCategories
      });
      expect(mockFind).toHaveBeenCalledWith({});
    });

    test('should return empty array when no categories exist', async () => {
      // Arrange
      const req = createMockRequest();
      const res = createMockResponse();

      mockFind.mockResolvedValue([]);

      // Act
      await categoryControlller(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'All Categories List',
        category: []
      });
    });

    test('should handle database errors', async () => {
      // Arrange
      const req = createMockRequest();
      const res = createMockResponse();

      mockFind.mockRejectedValue(new Error('Database error'));

      // Act
      await categoryControlller(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: expect.any(Error),
        message: 'Error while getting all categories'
      });
    });
  });

  describe('singleCategoryController', () => {
    test('should get single category by slug successfully', async () => {
      // Arrange
      const req = createMockRequest({}, { slug: 'electronics' });
      const res = createMockResponse();
      const mockCategory = {
        _id: '1',
        name: 'Electronics',
        slug: 'electronics'
      };

      mockFindOne.mockResolvedValue(mockCategory);

      // Act
      await singleCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Category retrieved successfully', // Updated message
        category: mockCategory
      });
      expect(mockFindOne).toHaveBeenCalledWith({ slug: 'electronics' });
    });

    test('should return 404 when category not found', async () => {
      // Arrange
      const req = createMockRequest({}, { slug: 'nonexistent' });
      const res = createMockResponse();

      mockFindOne.mockResolvedValue(null);

      // Act
      await singleCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404); // Not Found
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Category not found'
      });
    });

    test('should handle database errors', async () => {
      // Arrange
      const req = createMockRequest({}, { slug: 'electronics' });
      const res = createMockResponse();

      mockFindOne.mockRejectedValue(new Error('Database error'));

      // Act
      await singleCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: 'Database error',
        message: 'Error retrieving category'
      });
    });
  });

  describe('updateCategoryController', () => {
    test('should update category successfully', async () => {
      // Arrange
      const req = createMockRequest({ name: 'Updated Electronics' }, { id: '1' });
      const res = createMockResponse();
      const existingCategory = { _id: '1', name: 'Electronics' };
      const updatedCategory = {
        _id: '1',
        name: 'Updated Electronics',
        slug: 'updated-electronics'
      };

      mockFindById.mockResolvedValue(existingCategory); // Category exists
      mockFindByIdAndUpdate.mockResolvedValue(updatedCategory);

      // Act
      await updateCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Category updated successfully',
        category: updatedCategory
      });
    });

    test('should return 404 when category to update is not found', async () => {
      // Arrange
      const req = createMockRequest({ name: 'Updated Electronics' }, { id: '999' });
      const res = createMockResponse();

      mockFindById.mockResolvedValue(null); // Category not found

      // Act
      await updateCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Category not found'
      });
    });

    test('should handle database errors during update', async () => {
      // Arrange
      const req = createMockRequest({ name: 'Updated Electronics' }, { id: '1' });
      const res = createMockResponse();

      mockFindById.mockRejectedValue(new Error('Database error'));

      // Act
      await updateCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: 'Database error',
        message: 'Error updating category'
      });
    });
  });

  describe('deleteCategoryCOntroller', () => {
    test('should delete category successfully', async () => {
      // Arrange
      const req = createMockRequest({}, { id: '1' });
      const res = createMockResponse();
      const deletedCategory = {
        _id: '1',
        name: 'Electronics',
        slug: 'electronics'
      };

      mockFindByIdAndDelete.mockResolvedValue(deletedCategory);

      // Act
      await deleteCategoryController(req, res); // Note: Using the typo

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Category deleted successfully' // Updated message
      });
    });

    test('should return 404 when category to delete is not found', async () => {
      // Arrange
      const req = createMockRequest({}, { id: '999' });
      const res = createMockResponse();

      mockFindByIdAndDelete.mockResolvedValue(null);

      // Act
      await deleteCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Category not found'
      });
    });

    test('should handle database errors during deletion', async () => {
      // Arrange
      const req = createMockRequest({}, { id: '1' });
      const res = createMockResponse();

      mockFindByIdAndDelete.mockRejectedValue(new Error('Database error'));

      // Act
      await deleteCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: 'Database error',
        message: 'Error deleting category'
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle special characters in category name', async () => {
      // Arrange
      const req = createMockRequest({ name: 'Electronics & Gadgets!' });
      const res = createMockResponse();
      const mockCategory = {
        _id: '1',
        name: 'Electronics & Gadgets!',
        slug: 'electronics-gadgets'
      };

      mockFindOne.mockResolvedValue(null);
      mockSave.mockResolvedValue(mockCategory);

      // Act
      await createCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Category created successfully',
        category: mockCategory
      });
    });

    test('should handle very long category names', async () => {
      // Arrange
      const longName = 'A'.repeat(100);
      const req = createMockRequest({ name: longName });
      const res = createMockResponse();
      const mockCategory = {
        _id: '1',
        name: longName,
        slug: 'a'.repeat(100)
      };

      mockFindOne.mockResolvedValue(null);
      mockSave.mockResolvedValue(mockCategory);

      // Act
      await createCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Category created successfully',
        category: mockCategory
      });
    });

    test('should handle whitespace-only category names', async () => {
      // Arrange
      const req = createMockRequest({ name: '   ' });
      const res = createMockResponse();

      // Act
      await createCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Category name is required and cannot be empty'
      });
    });
  });
});

// Test utilities
describe('Test Utilities', () => {
  test('createMockRequest should create proper request object', () => {
    const req = createMockRequest({ name: 'test' }, { id: '1' });
    expect(req.body).toEqual({ name: 'test' });
    expect(req.params).toEqual({ id: '1' });
  });

  test('createMockResponse should create proper response object', () => {
    const res = createMockResponse();
    expect(typeof res.status).toBe('function');
    expect(typeof res.send).toBe('function');
    
    // Test chaining
    res.status(200).send({ success: true });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ success: true });
  });
});
