import { test as base } from '@playwright/test';
import jwt from "jsonwebtoken"


export const testAsSomeone = (userInfo) => {
  
  return base.extend({
    page: async ({ page }, use) => {
      const token = await jwt.sign({_id: userInfo._id}, process.env.JWT_SECRET)
      await page.addInitScript((values) => {
        for (const [key, value] of Object.entries(values)) {
          localStorage.setItem(key, value);
        }
      }, {
        auth: JSON.stringify({
          token: token,
          user: userInfo
        })
      });
      await use(page);
    },
  });
}

export const testUser = {
  _id: "67a218decf4efddf1e5358ac",
  name: "CS 4218 Test Account",
  email: "cs4218@test.com",
  password: "$2b$10$//wWsN./fEX1WiipH57HG.SAwgkYv1MRrPSkpXM38Dy5seOEhCoUy",
  phone: "81234567",
  address: "1 Computing Drive",
  role: 0
}

export const testAdmin = {
  _id: "671218f37e0f5f9fddeb66e9",
  name: "Daniel",
  email: "Daniel@gmail.com",
  password: "$2b$10$mjJb91uL34wQunwl3q.S7ueLUWwcjT90tX8IhDXk2Go1RfqEyDQdm",
  phone: "Daniel",
  address: "60 Daniel Road",
  role: 1
}

export const testAsUser = testAsSomeone(testUser)

export const testAsAdmin = testAsSomeone(testAdmin)

export const testAsLoggedOut = base

export { expect } from '@playwright/test';
