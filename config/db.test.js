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

  test("logs success when mongoose connects", async () => {
    const fakeConn = { connection: { host: "localhost" } };
    mongoose.connect.mockResolvedValueOnce(fakeConn);

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
    expect(consoleSpy).toHaveBeenCalled();
    const msg = consoleSpy.mock.calls[0][0];
    expect(msg).toContain("Connected To Mongodb Database");
    expect(msg).toContain("localhost");
  });

  test("logs error when mongoose.connect throws", async () => {
    const err = new Error("boom");
    mongoose.connect.mockRejectedValueOnce(err);

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
    expect(consoleSpy).toHaveBeenCalled();
    const msg = consoleSpy.mock.calls[0][0];
    expect(msg).toContain("Error in Mongodb");
  });
});


