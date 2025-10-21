import { createExpressTestServer, createExpressTestController } from "./testutils";
import connectDB from "../../config/db";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import productModel from "../../models/productModel";
import categoryModel from "../../models/categoryModel";
import orderModel from "../../models/orderModel";
import userModel from "../../models/userModel";
import request from "supertest";
import path from "path";
import fs from "fs";
import os from "os";
import formidable from "express-formidable";

import {
  createProductController,
  getProductController,
  getSingleProductController,
  productPhotoController,
  deleteProductController,
  updateProductController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  relatedProductController,
  productCategoryController,
  braintreeTokenController,
  brainTreePaymentController,
} from "../productController";

// Sean's Integration Tests
// test cases generated with the help of AI
describe("Product Controller Integration Tests", () => {
  let mongoServer;
  let connection;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    connection = mongoose.createConnection(mongoServer.getUri());
    productModel.useConnection(connection);
    categoryModel.useConnection(connection);
    orderModel.useConnection(connection);
    userModel.useConnection(connection);
  });

  afterEach(async () => {
    await connection.close();
    await mongoServer.stop();
  });

  describe("getProductController", () => {
    it("retrieves all products successfully", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const laptop = await new productModel({
        name: "Laptop",
        slug: "laptop",
        description: "Gaming laptop",
        price: 1500,
        category: category._id,
        quantity: 10,
        shipping: true,
      }).save();

      const phone = await new productModel({
        name: "Phone",
        slug: "phone",
        description: "Smartphone",
        price: 800,
        category: category._id,
        quantity: 20,
        shipping: true,
      }).save();

      const app = createExpressTestServer([["get", "/", getProductController]]);

      const response = await request(app).get("/");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(2);
      expect(response.body.countTotal).toBe(2);

      const laptopFromResponse = response.body.products.find(p => p.slug === "laptop");
      const phoneFromResponse = response.body.products.find(p => p.slug === "phone");
      
      expect(laptopFromResponse).toBeDefined();
      expect(laptopFromResponse.name).toBe(laptop.name);
      expect(laptopFromResponse.description).toBe(laptop.description);
      expect(laptopFromResponse.price).toBe(laptop.price);
      expect(laptopFromResponse.quantity).toBe(laptop.quantity);
      expect(laptopFromResponse.shipping).toBe(laptop.shipping);
      
      expect(phoneFromResponse).toBeDefined();
      expect(phoneFromResponse.name).toBe(phone.name);
      expect(phoneFromResponse.description).toBe(phone.description);
      expect(phoneFromResponse.price).toBe(phone.price);
      expect(phoneFromResponse.quantity).toBe(phone.quantity);
      expect(phoneFromResponse.shipping).toBe(phone.shipping);
    });

    it("returns empty array when no products exist", async () => {
      const app = createExpressTestServer([["get", "/", getProductController]]);

      const response = await request(app).get("/");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(0);
      expect(response.body.countTotal).toBe(0);
    });
  });

  describe("getSingleProductController", () => {
    it("retrieves single product by slug successfully", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const laptop = await new productModel({
        name: "Laptop",
        slug: "laptop",
        description: "Gaming laptop",
        price: 1500,
        category: category._id,
        quantity: 10,
        shipping: true,
      }).save();

      const app = createExpressTestServer([
        ["get", "/:slug", getSingleProductController],
      ]);

      const response = await request(app).get("/laptop");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.product.name).toBe(laptop.name);
      expect(response.body.product.slug).toBe(laptop.slug);
      expect(response.body.product.description).toBe(laptop.description);
      expect(response.body.product.price).toBe(laptop.price);
      expect(response.body.product.quantity).toBe(laptop.quantity);
      expect(response.body.product.shipping).toBe(laptop.shipping);
      expect(response.body.product.category._id.toString()).toBe(category._id.toString());
    });

    it("returns 404 when product not found", async () => {
      const app = createExpressTestServer([
        ["get", "/:slug", getSingleProductController],
      ]);

      const response = await request(app).get("/nonexistent");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Product not found");
    });
  });

  describe("productPhotoController", () => {
    it("returns 404 when product has no photo", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const product = await new productModel({
        name: "Laptop",
        slug: "laptop",
        description: "Gaming laptop",
        price: 1500,
        category: category._id,
        quantity: 10,
        shipping: true,
      }).save();

      const app = createExpressTestServer([
        ["get", "/:pid", productPhotoController],
      ]);

      const response = await request(app).get(`/${product._id}`);

      expect(response.status).toBe(404);
    });

    it("returns 404 when product not found", async () => {
      const app = createExpressTestServer([
        ["get", "/:pid", productPhotoController],
      ]);

      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/${fakeId}`);

      expect(response.status).toBe(404);
    });
  });

  describe("productCountController", () => {
    it("returns correct product count", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      for (let i = 1; i <= 3; i++) {
        await new productModel({
          name: `Product ${i}`,
          slug: `product-${i}`,
          description: `Description ${i}`,
          price: 100 * i,
          category: category._id,
          quantity: 10,
          shipping: true,
        }).save();
      }

      const app = createExpressTestServer([
        ["get", "/", productCountController],
      ]);

      const response = await request(app).get("/");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.total).toBe(3);
    });

    it("returns zero when no products exist", async () => {
      const app = createExpressTestServer([
        ["get", "/", productCountController],
      ]);

      const response = await request(app).get("/");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.total).toBe(0);
    });
  });

  describe("productListController", () => {
    it("returns paginated products", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const createdProducts = [];
      for (let i = 1; i <= 10; i++) {
        const product = await new productModel({
          name: `Product ${i}`,
          slug: `product-${i}`,
          description: `Description ${i}`,
          price: 100 * i,
          category: category._id,
          quantity: 10,
          shipping: true,
        }).save();
        createdProducts.push(product);
      }

      const app = createExpressTestServer([
        ["get", "/:page", productListController],
      ]);

      const response = await request(app).get("/1");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(6);
      
      response.body.products.forEach((productFromResponse) => {
        const originalProduct = createdProducts.find(p => p.slug === productFromResponse.slug);
        expect(originalProduct).toBeDefined();
        expect(productFromResponse.name).toBe(originalProduct.name);
        expect(productFromResponse.description).toBe(originalProduct.description);
        expect(productFromResponse.price).toBe(originalProduct.price);
        expect(productFromResponse.quantity).toBe(originalProduct.quantity);
        expect(productFromResponse.shipping).toBe(originalProduct.shipping);
      });
    });

    it("returns second page of products", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const createdProducts = [];
      for (let i = 1; i <= 10; i++) {
        const product = await new productModel({
          name: `Product ${i}`,
          slug: `product-${i}`,
          description: `Description ${i}`,
          price: 100 * i,
          category: category._id,
          quantity: 10,
          shipping: true,
        }).save();
        createdProducts.push(product);
      }

      const app = createExpressTestServer([
        ["get", "/:page", productListController],
      ]);

      const response = await request(app).get("/2");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(4); 
      
      response.body.products.forEach((productFromResponse) => {
        const originalProduct = createdProducts.find(p => p.slug === productFromResponse.slug);
        expect(originalProduct).toBeDefined();
        expect(productFromResponse.name).toBe(originalProduct.name);
        expect(productFromResponse.description).toBe(originalProduct.description);
        expect(productFromResponse.price).toBe(originalProduct.price);
        expect(productFromResponse.quantity).toBe(originalProduct.quantity);
        expect(productFromResponse.shipping).toBe(originalProduct.shipping);
      });
    });
  });

  describe("searchProductController", () => {
    it("searches products by name successfully", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const gamingLaptop = await new productModel({
        name: "Gaming Laptop",
        slug: "gaming-laptop",
        description: "High-end gaming laptop",
        price: 2000,
        category: category._id,
        quantity: 5,
        shipping: true,
      }).save();

      await new productModel({
        name: "Office Laptop",
        slug: "office-laptop",
        description: "Business laptop",
        price: 1000,
        category: category._id,
        quantity: 10,
        shipping: true,
      }).save();

      const app = createExpressTestServer([
        ["get", "/:keyword", searchProductController],
      ]);

      const response = await request(app).get("/gaming");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].name).toBe(gamingLaptop.name);
      expect(response.body.results[0].slug).toBe(gamingLaptop.slug);
      expect(response.body.results[0].description).toBe(gamingLaptop.description);
      expect(response.body.results[0].price).toBe(gamingLaptop.price);
      expect(response.body.results[0].quantity).toBe(gamingLaptop.quantity);
      expect(response.body.results[0].shipping).toBe(gamingLaptop.shipping);
    });

    it("searches products by description successfully", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const laptop = await new productModel({
        name: "Laptop",
        slug: "laptop",
        description: "High-end gaming device",
        price: 2000,
        category: category._id,
        quantity: 5,
        shipping: true,
      }).save();

      await new productModel({
        name: "Smartphone",
        slug: "smartphone",
        description: "High-end smartphone",
        price: 3000,
        category: category._id,
        quantity: 5,
        shipping: true,
      }).save();

      const app = createExpressTestServer([
        ["get", "/:keyword", searchProductController],
      ]);

      const response = await request(app).get("/gaming");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].name).toBe(laptop.name);
      expect(response.body.results[0].slug).toBe(laptop.slug);
      expect(response.body.results[0].description).toBe(laptop.description);
      expect(response.body.results[0].price).toBe(laptop.price);
      expect(response.body.results[0].quantity).toBe(laptop.quantity);
      expect(response.body.results[0].shipping).toBe(laptop.shipping);
    });

    it("returns empty array when no matches found", async () => {
      const app = createExpressTestServer([
        ["get", "/:keyword", searchProductController],
      ]);

      const response = await request(app).get("/nonexistent");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveLength(0);
    });
  });

  describe("relatedProductController", () => {
    it("retrieves related products successfully", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const product1 = await new productModel({
        name: "Laptop",
        slug: "laptop",
        description: "Gaming laptop",
        price: 1500,
        category: category._id,
        quantity: 10,
        shipping: true,
      }).save();

      const mouse = await new productModel({
        name: "Mouse",
        slug: "mouse",
        description: "Gaming mouse",
        price: 50,
        category: category._id,
        quantity: 50,
        shipping: true,
      }).save();

      const keyboard = await new productModel({
        name: "Keyboard",
        slug: "keyboard",
        description: "Mechanical keyboard",
        price: 100,
        category: category._id,
        quantity: 30,
        shipping: true,
      }).save();

      const app = createExpressTestServer([
        ["get", "/:pid/:cid", relatedProductController],
      ]);

      const response = await request(app).get(
        `/${product1._id}/${category._id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(2);
      expect(
        response.body.products.every(
          (p) => p._id.toString() !== product1._id.toString()
        )
      ).toBe(true);
      
      const mouseFromResponse = response.body.products.find(p => p.slug === "mouse");
      const keyboardFromResponse = response.body.products.find(p => p.slug === "keyboard");
      
      expect(mouseFromResponse).toBeDefined();
      expect(mouseFromResponse.name).toBe(mouse.name);
      expect(mouseFromResponse.description).toBe(mouse.description);
      expect(mouseFromResponse.price).toBe(mouse.price);
      expect(mouseFromResponse.quantity).toBe(mouse.quantity);
      expect(mouseFromResponse.shipping).toBe(mouse.shipping);
      
      expect(keyboardFromResponse).toBeDefined();
      expect(keyboardFromResponse.name).toBe(keyboard.name);
      expect(keyboardFromResponse.description).toBe(keyboard.description);
      expect(keyboardFromResponse.price).toBe(keyboard.price);
      expect(keyboardFromResponse.quantity).toBe(keyboard.quantity);
      expect(keyboardFromResponse.shipping).toBe(keyboard.shipping);
    });

    it("returns 404 when product id is missing", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const app = createExpressTestServer([
        ["get", "/:pid/:cid", relatedProductController],
      ]);

      const response = await request(app).get(`//${category._id}`);

      expect(response.status).toBe(404);
    });

    it("returns 404 when category id is missing", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const app = createExpressTestServer([
        ["get", "/:pid/:cid", relatedProductController],
      ]);

      const response = await request(app).get(`/${fakeId}/`);

      expect(response.status).toBe(404);
    });
  });

  describe("productCategoryController", () => {
    it("retrieves products by category successfully", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const laptop = await new productModel({
        name: "Laptop",
        slug: "laptop",
        description: "Gaming laptop",
        price: 1500,
        category: category._id,
        quantity: 10,
        shipping: true,
      }).save();

      const phone = await new productModel({
        name: "Phone",
        slug: "phone",
        description: "Smartphone",
        price: 800,
        category: category._id,
        quantity: 20,
        shipping: true,
      }).save();

      const app = createExpressTestServer([
        ["get", "/:slug", productCategoryController],
      ]);

      const response = await request(app).get("/electronics");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(2);
      expect(response.body.category.name).toBe("Electronics");
      
      const laptopFromResponse = response.body.products.find(p => p.slug === "laptop");
      const phoneFromResponse = response.body.products.find(p => p.slug === "phone");
      
      expect(laptopFromResponse).toBeDefined();
      expect(laptopFromResponse.name).toBe(laptop.name);
      expect(laptopFromResponse.description).toBe(laptop.description);
      expect(laptopFromResponse.price).toBe(laptop.price);
      expect(laptopFromResponse.quantity).toBe(laptop.quantity);
      expect(laptopFromResponse.shipping).toBe(laptop.shipping);
      
      expect(phoneFromResponse).toBeDefined();
      expect(phoneFromResponse.name).toBe(phone.name);
      expect(phoneFromResponse.description).toBe(phone.description);
      expect(phoneFromResponse.price).toBe(phone.price);
      expect(phoneFromResponse.quantity).toBe(phone.quantity);
      expect(phoneFromResponse.shipping).toBe(phone.shipping);
    });

    it("returns 400 when category not found", async () => {
      const app = createExpressTestServer([
        ["get", "/:slug", productCategoryController],
      ]);

      const response = await request(app).get("/nonexistent");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Category not found");
    });

    it("returns empty products array when category has no products", async () => {
      await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const app = createExpressTestServer([
        ["get", "/:slug", productCategoryController],
      ]);

      const response = await request(app).get("/electronics");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(0);
    });
  });

  describe("productFiltersController", () => {
    it("filters products by category", async () => {
      const category1 = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const category2 = await new categoryModel({
        name: "Books",
        slug: "books",
      }).save();

      const laptop = await new productModel({
        name: "Laptop",
        slug: "laptop",
        description: "Gaming laptop",
        price: 1500,
        category: category1._id,
        quantity: 10,
        shipping: true,
      }).save();

      await new productModel({
        name: "Book",
        slug: "book",
        description: "Programming book",
        price: 50,
        category: category2._id,
        quantity: 100,
        shipping: true,
      }).save();

      const app = createExpressTestServer([
        ["post", "/", productFiltersController],
      ]);

      const response = await request(app)
        .post("/")
        .send({ checked: [category1._id], radio: [] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0].name).toBe("Laptop");
      expect(response.body.products[0].description).toBe(laptop.description);
      expect(response.body.products[0].price).toBe(laptop.price);
      expect(response.body.products[0].quantity).toBe(laptop.quantity);
      expect(response.body.products[0].shipping).toBe(laptop.shipping);
    });

    it("filters products by price range", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const cheapLaptop = await new productModel({
        name: "Cheap Laptop",
        slug: "cheap-laptop",
        description: "Budget laptop",
        price: 500,
        category: category._id,
        quantity: 10,
        shipping: true,
      }).save();

      await new productModel({
        name: "Expensive Laptop",
        slug: "expensive-laptop",
        description: "Premium laptop",
        price: 2000,
        category: category._id,
        quantity: 5,
        shipping: true,
      }).save();

      const app = createExpressTestServer([
        ["post", "/", productFiltersController],
      ]);

      const response = await request(app)
        .post("/")
        .send({ checked: [], radio: [400, 1000] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0].name).toBe("Cheap Laptop");
      expect(response.body.products[0].slug).toBe(cheapLaptop.slug);
      expect(response.body.products[0].description).toBe(cheapLaptop.description);
      expect(response.body.products[0].price).toBe(cheapLaptop.price);
      expect(response.body.products[0].quantity).toBe(cheapLaptop.quantity);
      expect(response.body.products[0].shipping).toBe(cheapLaptop.shipping);
    });

    it("filters products by both category and price", async () => {
      const category1 = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const category2 = await new categoryModel({
        name: "Books",
        slug: "books",
      }).save();

      const laptop = await new productModel({
        name: "Laptop",
        slug: "laptop",
        description: "Gaming laptop",
        price: 1500,
        category: category1._id,
        quantity: 10,
        shipping: true,
      }).save();

      await new productModel({
        name: "Phone",
        slug: "phone",
        description: "Smartphone",
        price: 3000,
        category: category1._id,
        quantity: 5,
        shipping: true,
      }).save();

      await new productModel({
        name: "Book",
        slug: "book",
        description: "Programming book",
        price: 50,
        category: category2._id,
        quantity: 100,
        shipping: true,
      }).save();

      const app = createExpressTestServer([
        ["post", "/", productFiltersController],
      ]);

      const response = await request(app)
        .post("/")
        .send({ checked: [category1._id], radio: [1000, 2000] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0].name).toBe("Laptop");
      expect(response.body.products[0].slug).toBe(laptop.slug);
      expect(response.body.products[0].description).toBe(laptop.description);
      expect(response.body.products[0].price).toBe(laptop.price);
      expect(response.body.products[0].quantity).toBe(laptop.quantity);
      expect(response.body.products[0].shipping).toBe(laptop.shipping);
    });

    it("returns all products when no filters applied", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const product1 = await new productModel({
        name: "Product 1",
        slug: "product-1",
        description: "Description 1",
        price: 100,
        category: category._id,
        quantity: 10,
        shipping: true,
      }).save();

      const product2 = await new productModel({
        name: "Product 2",
        slug: "product-2",
        description: "Description 2",
        price: 200,
        category: category._id,
        quantity: 20,
        shipping: true,
      }).save();

      const app = createExpressTestServer([
        ["post", "/", productFiltersController],
      ]);

      const response = await request(app)
        .post("/")
        .send({ checked: [], radio: [] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(2);
      
      const product1FromResponse = response.body.products.find(p => p.slug === "product-1");
      const product2FromResponse = response.body.products.find(p => p.slug === "product-2");
      
      expect(product1FromResponse).toBeDefined();
      expect(product1FromResponse.name).toBe(product1.name);
      expect(product1FromResponse.description).toBe(product1.description);
      expect(product1FromResponse.price).toBe(product1.price);
      expect(product1FromResponse.quantity).toBe(product1.quantity);
      expect(product1FromResponse.shipping).toBe(product1.shipping);
      
      expect(product2FromResponse).toBeDefined();
      expect(product2FromResponse.name).toBe(product2.name);
      expect(product2FromResponse.description).toBe(product2.description);
      expect(product2FromResponse.price).toBe(product2.price);
      expect(product2FromResponse.quantity).toBe(product2.quantity);
      expect(product2FromResponse.shipping).toBe(product2.shipping);
    });
  });

  // describe("braintreeTokenController", () => {
  //   it("generates client token successfully", async () => {
  //     const app = createExpressTestServer([
  //       ["get", "/", braintreeTokenController],
  //     ]);

  //     const response = await request(app).get("/");

  //     expect(response.status).toBeGreaterThanOrEqual(200);
  //     expect(response.body).toHaveProperty("success");
  //   });
  // });

  // describe("brainTreePaymentController", () => {
  //   it("returns 400 when nonce is missing", async () => {
  //     const app = createExpressTestServer([
  //       ["post", "/", brainTreePaymentController],
  //     ]);

  //     const response = await request(app)
  //       .post("/")
  //       .send({ cart: [{ price: 100 }] });

  //     expect(response.status).toBe(400);
  //     expect(response.body.success).toBe(false);
  //     expect(response.body.message).toBe("Payment nonce is required");
  //   });

  //   it("returns 400 when cart is empty", async () => {
  //     const app = createExpressTestServer([
  //       ["post", "/", brainTreePaymentController],
  //     ]);

  //     const response = await request(app)
  //       .post("/")
  //       .send({ nonce: "fake-nonce", cart: [] });

  //     expect(response.status).toBe(400);
  //     expect(response.body.success).toBe(false);
  //     expect(response.body.message).toBe(
  //       "Cart is required and cannot be empty"
  //     );
  //   });

  //   it("returns 401 when user is not authenticated", async () => {
  //     const app = createExpressTestServer([
  //       ["post", "/", brainTreePaymentController],
  //     ]);

  //     const response = await request(app)
  //       .post("/")
  //       .send({
  //         nonce: "fake-nonce",
  //         cart: [{ price: 100 }],
  //       });

  //     expect(response.status).toBe(401);
  //     expect(response.body.success).toBe(false);
  //     expect(response.body.message).toBe("User authentication required");
  //   });
  // });
});
