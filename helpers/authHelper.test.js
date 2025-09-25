import { describe } from "node:test";
import { hashPassword, comparePassword } from "./authHelper";

describe("Password Hashing", () => {
  it("should give hash that is consistent with password", async ()=> {
    const password = "12345";
    const hashedPassword = await hashPassword(password);
    const result = await comparePassword(password, hashedPassword);

    expect(result).toBe(true);
  });
  it("should not compare with different passwords", async () => {
    const password = "12345";
    const hashedPassword = await hashPassword(password);
    const result = await comparePassword("54321", hashedPassword);

    expect(result).toBe(false);
  })
})