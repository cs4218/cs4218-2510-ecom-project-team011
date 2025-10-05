import mongoose from "mongoose";
import connectDB from "./db";

jest.mock("mongoose", () => ({
  connect: jest.fn(),
}));

const installColorStubs = () => {
  const defineGetter = (name) => {
    if (!Object.getOwnPropertyDescriptor(String.prototype, name)) {
      Object.defineProperty(String.prototype, name, {
        configurable: true,
        get() { return this; },
      });
    }
  };
  defineGetter("bgMagenta");
  defineGetter("bgRed");
  defineGetter("white");
};

describe("connectDB", () => {
  const originalEnv = process.env;
  let consoleSpy;

  beforeEach(() => {
    installColorStubs();
    jest.resetModules();
    process.env = { ...originalEnv, MONGO_URL: "mongodb://localhost:27017/test" };
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  test("calls mongoose.connect with MONGO_URL", async () => {
    // Arrange
    mongoose.connect.mockResolvedValueOnce({ connection: { host: "localhost" } });

    // Act
    await connectDB();

    // Assert
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
  });

  test("logs success message with connected host on resolve", async () => {
    // Arrange
    const fakeConn = { connection: { host: "localhost" } };
    mongoose.connect.mockResolvedValueOnce(fakeConn);

    // Act
    await connectDB();

    // Assert
    expect(consoleSpy).toHaveBeenCalled();
    const msg = consoleSpy.mock.calls[0][0];
    expect(msg).toContain("Connected To Mongodb Database");
    expect(msg).toContain("localhost");
  });

  test("logs error message on reject", async () => {
    // Arrange
    const err = new Error("test error");
    mongoose.connect.mockRejectedValueOnce(err);

    // Act
    await connectDB();

    // Assert
    expect(consoleSpy).toHaveBeenCalled();
    const msg = consoleSpy.mock.calls[0][0];
    expect(msg).toContain("Error in Mongodb");
  });
});


