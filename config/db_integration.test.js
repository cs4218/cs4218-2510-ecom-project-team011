import mongoose from "mongoose";
import connectDB from "./db";

describe("connectDB Integration Tests", () => {
  let consoleSpy;

  beforeAll(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterAll(async () => {
    // Clean up
    consoleSpy.mockRestore();
    
    // Close any open connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    // Force close all connections
    await mongoose.disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should connect to MongoDB Atlas successfully", async () => {
    // Act
    await connectDB();

    // Assert - should either connect successfully or fail gracefully
    expect(consoleSpy).toHaveBeenCalled();
    const logMessage = consoleSpy.mock.calls[0][0];
    
    // Should either log success or error message
    expect(logMessage).toMatch(/Connected To Mongodb Database/);
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
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
});
