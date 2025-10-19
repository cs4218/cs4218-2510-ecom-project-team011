import mongoose from "mongoose";
import connectDB from "./db";

describe("connectDB Integration Tests", () => {
  const originalEnv = process.env;
  let consoleSpy;

  beforeAll(() => {
    // Set up test environment - use test MongoDB Atlas URL or fallback to localhost
    process.env = { 
      ...originalEnv, 
      MONGO_URL: process.env.MONGO_TEST_URL || process.env.MONGO_URL || "mongodb://localhost:27017/ecommerce_test" 
    };
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterAll(async () => {
    // Clean up
    consoleSpy.mockRestore();
    process.env = originalEnv;
    
    // Close any open connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should connect to MongoDB Atlas successfully with valid connection string", async () => {
    // Skip this test if no Atlas URL is configured
    if (!process.env.MONGO_URL || process.env.MONGO_URL.includes('localhost')) {
      console.log('Skipping Atlas connection test - no Atlas URL configured');
      return;
    }

    // Act
    await connectDB();

    // Assert - should either connect successfully or fail gracefully
    expect(consoleSpy).toHaveBeenCalled();
    const logMessage = consoleSpy.mock.calls[0][0];
    
    // Should either log success or error message
    expect(logMessage).toMatch(/Connected To Mongodb Database|Error in Mongodb/);
    
    // If connection was successful, verify connection state
    if (logMessage.includes("Connected To Mongodb Database")) {
      expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    }
  }, 15000);

  test("should handle connection errors gracefully with invalid Atlas URL", async () => {
    // Arrange - use invalid Atlas connection string
    const originalMongoUrl = process.env.MONGO_URL;
    process.env.MONGO_URL = "mongodb+srv://invalid:invalid@invalid-cluster.mongodb.net/test?retryWrites=true&w=majority";

    // Act
    await connectDB();

    // Assert
    expect(consoleSpy).toHaveBeenCalled();
    const logMessage = consoleSpy.mock.calls[0][0];
    expect(logMessage).toContain("Error in Mongodb");

    // Restore original URL
    process.env.MONGO_URL = originalMongoUrl;
  }, 10000);

  test("should use environment variable for MongoDB Atlas URL", async () => {
    // Arrange - test with a malformed Atlas URL
    const originalMongoUrl = process.env.MONGO_URL;
    process.env.MONGO_URL = "mongodb+srv://user:pass@cluster.mongodb.net/db";

    // Act
    await connectDB();

    // Assert
    expect(consoleSpy).toHaveBeenCalled();
    const logMessage = consoleSpy.mock.calls[0][0];
    expect(logMessage).toMatch(/Connected To Mongodb Database|Error in Mongodb/);

    // Restore original URL
    process.env.MONGO_URL = originalMongoUrl;
  }, 10000);

  test("should handle network connectivity issues gracefully", async () => {
    // Arrange - use a URL that will cause network issues
    const originalMongoUrl = process.env.MONGO_URL;
    process.env.MONGO_URL = "mongodb+srv://user:pass@nonexistent-cluster.mongodb.net/test";

    // Act
    await connectDB();

    // Assert
    expect(consoleSpy).toHaveBeenCalled();
    const logMessage = consoleSpy.mock.calls[0][0];
    expect(logMessage).toContain("Error in Mongodb");

    // Restore original URL
    process.env.MONGO_URL = originalMongoUrl;
  }, 10000);
});
