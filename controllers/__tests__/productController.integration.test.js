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

//You Wei's Integration Tests
describe("CRUD Product Controller Integration Tests", () => {
  // Direct integration tests with MongoDB Atlas to simulate real database environment as close as possible
  // Rmb to create a test database with the name "test_0" with the collections "products", "categories", "users", "orders" in Atlas
  beforeAll(async () => {
      process.env.NODE_ENV = 'test';
      await connectDB();
  });

  afterAll(async () => {
      // Clear all entries in collection to save costs
      const testCollections = ['products', 'categories', 'users', 'orders'];
      for (const collectionName of testCollections) {
          await mongoose.connection.db.collection(collectionName).deleteMany({});
      }
      
      await mongoose.connection.close();
      await mongoose.disconnect();
  });

  describe("createProductController Integration Tests", () => {
      let testCategory;
      let testUser;

      beforeEach(async () => {
          // Clean up test collections before each test
          const testCollections = ['products', 'categories', 'users', 'orders'];
          for (const collectionName of testCollections) {
              await mongoose.connection.db.collection(collectionName).deleteMany({});
          }
          
          // Initialize a test category for product creation
          testCategory = await new categoryModel({
              name: "Test Category",
              description: "Test category description",
          }).save();

          // Initialize a test user for authentication
          testUser = await new userModel({
              name: "Test Admin",
              email: "admin@test.com",
              password: "hashedpassword123",
              phone: "1234567890",
              address: "Test Address",
              answer: "test answer",
              role: 1, // admin role
          }).save();
      });

      it("returns 201 and success payload on valid creation", async () => {
        // Arrange
        const app = createExpressTestController([
          ["post", "/", createProductController]
        ], {
          user: testUser
        });

        const productData = {
          name: "Test Product",
          description: "Test product description",
          price: 99.99,
          category: testCategory._id.toString(),
          quantity: 10,
          shipping: true,
        };

        // Act
        const response = await request(app)
          .post("/")
          .field("name", productData.name)
          .field("description", productData.description)
          .field("price", productData.price)
          .field("category", productData.category)
          .field("quantity", productData.quantity)
          .field("shipping", productData.shipping);

        // Assert
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("Product created successfully");
        expect(response.body.product).toBeDefined();
      });

      it("returns product with correct core fields", async () => {
        // Arrange
        const app = createExpressTestController([
          ["post", "/", createProductController]
        ], {
          user: testUser
        });

        const productData = {
          name: "Test Product",
          description: "Test product description",
          price: 99.99,
          category: testCategory._id.toString(),
          quantity: 10,
          shipping: true,
        };

        // Act
        const response = await request(app)
          .post("/")
          .field("name", productData.name)
          .field("description", productData.description)
          .field("price", productData.price)
          .field("category", productData.category)
          .field("quantity", productData.quantity)
          .field("shipping", productData.shipping);

        // Assert
        expect(response.body.product.name).toBe(productData.name);
        expect(response.body.product.slug).toBe("test-product");
        expect(response.body.product.price).toBe(productData.price);
        expect(response.body.product.category.toString()).toBe(testCategory._id.toString());
      });

      it("persists the product in the database", async () => {
        // Arrange
        const app = createExpressTestController([
          ["post", "/", createProductController]
        ], {
          user: testUser
        });

        const productData = {
          name: "Test Product",
          description: "Test product description",
          price: 99.99,
          category: testCategory._id.toString(),
          quantity: 10,
          shipping: true,
        };

        // Act
        const response = await request(app)
          .post("/")
          .field("name", productData.name)
          .field("description", productData.description)
          .field("price", productData.price)
          .field("category", productData.category)
          .field("quantity", productData.quantity)
          .field("shipping", productData.shipping);

        // Assert
        const savedProduct = await productModel.findById(response.body.product._id);
        expect(savedProduct).toBeTruthy();
        expect(savedProduct.name).toBe(productData.name);
      });

      it("uses the expected collection and updates count", async () => {
        // Arrange
        const app = createExpressTestController([
          ["post", "/", createProductController]
        ], {
          user: testUser
        });

        const productData = {
          name: "Test Product",
          description: "Test product description",
          price: 99.99,
          category: testCategory._id.toString(),
          quantity: 10,
          shipping: true,
        };

        // Act
        await request(app)
          .post("/")
          .field("name", productData.name)
          .field("description", productData.description)
          .field("price", productData.price)
          .field("category", productData.category)
          .field("quantity", productData.quantity)
          .field("shipping", productData.shipping);

        // Assert
        const productsCount = await mongoose.connection.db.collection(productModel.collection.name).countDocuments();
        expect(productsCount).toBe(1);
        expect(productModel.collection.name).toBe("products");
      });

      it("should reject product creation with missing product", async () => {
        // Arrange
        const app = createExpressTestController([
          ["post", "/", createProductController]
        ], {
          user: testUser
        });

        // Act: send empty object
        const response = await request(app).post("/");

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it("creates product with actual photo attachment", async () => {
        // Arrange
        const app = createExpressTestController([["post", "/", createProductController]], { user: testUser });
        const imagePath = path.join(__dirname, "test-image.png");

        // Act
        const response = await request(app)
          .post("/")
          .field("name", "With Image")
          .field("description", "Has photo")
          .field("price", 10.5)
          .field("category", testCategory._id.toString())
          .field("quantity", 2)
          .field("shipping", true)
          .attach("photo", imagePath);

        // Assert
        expect(response.status).toBe(201);
        const saved = await productModel.findById(response.body.product._id);
        expect(saved).toBeTruthy();
        expect(saved.photo).toBeDefined();
        expect(saved.photo.contentType).toBeTruthy();
        expect(Buffer.isBuffer(saved.photo.data)).toBe(true);
      });

      it("fails on duplicate slug (same name twice)", async () => {
        // Arrange
        const app = createExpressTestController([["post", "/", createProductController]], { user: testUser });

        // Act: first succeeds
        const first = await request(app)
          .post("/")
          .field("name", "Duplicate Name")
          .field("description", "d1")
          .field("price", 1)
          .field("category", testCategory._id.toString())
          .field("quantity", 1)
          .field("shipping", true);
        expect(first.status).toBe(201);

        // Act: second should violate unique slug
        const second = await request(app)
          .post("/")
          .field("name", "Duplicate Name")
          .field("description", "d2")
          .field("price", 2)
          .field("category", testCategory._id.toString())
          .field("quantity", 2)
          .field("shipping", false);

        // Assert
        expect(second.status).toBeGreaterThanOrEqual(400);
        expect(second.body.success).toBe(false);
      });

      it("returns 500 when category id is not a valid ObjectId", async () => {
        // Arrange
        const app = createExpressTestController([["post", "/", createProductController]], { user: testUser });

        // Act
        const response = await request(app)
          .post("/")
          .field("name", "Bad Category")
          .field("description", "desc")
          .field("price", 12.34)
          .field("category", "not-an-objectid")
          .field("quantity", 3)
          .field("shipping", true);

        // Assert
        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });

      it("accepts valid but non-existent category ObjectId", async () => {
        // Arrange
        const app = createExpressTestController([["post", "/", createProductController]], { user: testUser });
        const nonExistentId = new mongoose.Types.ObjectId().toString();

        // Act
        const response = await request(app)
          .post("/")
          .field("name", "Ghost Category Product")
          .field("description", "desc")
          .field("price", 55)
          .field("category", nonExistentId)
          .field("quantity", 4)
          .field("shipping", true);

        // Assert
        expect(response.status).toBe(201);
      });

      it("coerces string fields to correct types", async () => {
        // Arrange
        const app = createExpressTestController([["post", "/", createProductController]], { user: testUser });

        // Act
        const response = await request(app)
          .post("/")
          .field("name", "Typed")
          .field("description", "typed")
          .field("price", "99.99")
          .field("category", testCategory._id.toString())
          .field("quantity", "10")
          .field("shipping", "false");

        // Assert
        expect(response.status).toBe(201);
        const saved = await productModel.findById(response.body.product._id);
        expect(typeof saved.price).toBe("number");
        expect(saved.price).toBeCloseTo(99.99);
        expect(typeof saved.quantity).toBe("number");
        expect(saved.quantity).toBe(10);
        expect(typeof saved.shipping).toBe("boolean");
        expect(saved.shipping).toBe(false);
      });

      it("normalizes slug from messy name", async () => {
        // Arrange
        const app = createExpressTestController([["post", "/", createProductController]], { user: testUser });

        // Act
        const response = await request(app)
          .post("/")
          .field("name", "  My Product!!  ")
          .field("description", "desc")
          .field("price", 9)
          .field("category", testCategory._id.toString())
          .field("quantity", 1)
          .field("shipping", true);

        // Assert
        expect(response.status).toBe(201);
        expect(response.body.product.slug).toBe("my-product!!");
      });
  });

  describe("updateProductController Integration Tests", () => {
    let testCategory;
    let otherCategory;
    let testUser;
    let existingProduct;

    beforeEach(async () => {
      // Clean up and seed
      const collections = ["products", "categories", "users", "orders"];
      for (const name of collections) {
        await mongoose.connection.db.collection(name).deleteMany({});
      }

      testCategory = await new categoryModel({
        name: "Update Cat",
        description: "update cat",
      }).save();

      otherCategory = await new categoryModel({
        name: "Other Cat",
        description: "other cat",
      }).save();

      testUser = await new userModel({
        name: "Updater",
        email: "up@test.com",
        password: "hashed",
        phone: "111",
        address: "Addr",
        answer: "a",
        role: 1,
      }).save();

      existingProduct = await new productModel({
        name: "Base Product",
        slug: "base-product",
        description: "base desc",
        price: 10,
        category: testCategory._id,
        quantity: 5,
        shipping: true,
      }).save();
    });

    it("updates product successfully without photo", async () => {
      // Arrange
      const app = createExpressTestController([["put", "/:pid", updateProductController]], { user: testUser });

      // Act
      const response = await request(app)
        .put(`/${existingProduct._id}`)
        .field("name", "Updated Name")
        .field("description", "Updated desc")
        .field("price", 20)
        .field("category", otherCategory._id.toString())
        .field("quantity", 9)
        .field("shipping", false);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.product.name).toBe("Updated Name");
      expect(response.body.product.slug).toBe("updated-name");
      expect(response.body.product.category.toString()).toBe(otherCategory._id.toString());
      expect(response.body.product.shipping).toBe(false);
    });

    it("updates product with photo < 1MB", async () => {
      // Arrange
      const app = createExpressTestController([["put", "/:pid", updateProductController]], { user: testUser });
      const imagePath = path.join(__dirname, "test-image.png");

      // Act
      const response = await request(app)
        .put(`/${existingProduct._id}`)
        .field("name", "With Photo")
        .field("description", "updated")
        .field("price", 15)
        .field("category", testCategory._id.toString())
        .field("quantity", 6)
        .field("shipping", true)
        .attach("photo", imagePath);

      // Assert
      expect(response.status).toBe(200);
      const saved = await productModel.findById(existingProduct._id);
      expect(saved.photo).toBeDefined();
      expect(saved.photo.contentType).toBeTruthy();
      expect(Buffer.isBuffer(saved.photo.data)).toBe(true);
    });

    it("rejects update when object is empty", async () => {
      // Arrange
      const app = createExpressTestController([["put", "/:pid", updateProductController]], { user: testUser });

      // Act
      const res = await request(app)
        .put(`/${existingProduct._id}`)

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("returns 404 when product not found", async () => {
      // Arrange
      const app = createExpressTestController([["put", "/:pid", updateProductController]], { user: testUser });
      const missingId = new mongoose.Types.ObjectId().toString();

      // Act
      const res = await request(app)
        .put(`/${missingId}`)
        .field("name", "N")
        .field("description", "D")
        .field("price", 10)
        .field("category", testCategory._id.toString())
        .field("quantity", 1)
        .field("shipping", true);
      
      // Assert
      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Product not found");
    });

    it("returns 500 when product id is invalid format", async () => {
      // Arrange
      const app = createExpressTestController([["put", "/:pid", updateProductController]], { user: testUser });

      // Act
      const res = await request(app)
        .put(`/not-an-objectid`)
        .field("name", "N")
        .field("description", "D")
        .field("price", 10)
        .field("category", testCategory._id.toString())
        .field("quantity", 1)
        .field("shipping", true);
      
      // Assert
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it("coerces string values to correct types on update", async () => {
      // Arrange
      const app = createExpressTestController([["put", "/:pid", updateProductController]], { user: testUser });

      // Act
      const res = await request(app)
        .put(`/${existingProduct._id}`)
        .field("name", "Typed Update")
        .field("description", "typed")
        .field("price", "33.33")
        .field("category", testCategory._id.toString())
        .field("quantity", "7")
        .field("shipping", "false");

      // Assert
      expect(res.status).toBe(200);
      const saved = await productModel.findById(existingProduct._id);
      expect(saved.price).toBeCloseTo(33.33);
      expect(saved.quantity).toBe(7);
      expect(saved.shipping).toBe(false);
    });

    it("fails when updating name to an existing product's name (duplicate slug)", async () => {
      // Arrange
      const app = createExpressTestController([["put", "/:pid", updateProductController]], { user: testUser });
      // Create a second product with target name
      const other = await new productModel({
        name: "Taken Name",
        slug: "taken-name",
        description: "d",
        price: 11,
        category: testCategory._id,
        quantity: 1,
        shipping: true,
      }).save();

      // Act
      const res = await request(app)
        .put(`/${existingProduct._id}`)
        .field("name", other.name) // will generate same slug
        .field("description", "D")
        .field("price", 10)
        .field("category", testCategory._id.toString())
        .field("quantity", 2)
        .field("shipping", true);

      // Assert
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it("keeps products count unchanged after successful update", async () => {
      // Arrange
      const app = createExpressTestController([["put", "/:pid", updateProductController]], { user: testUser });
      const beforeCount = await mongoose.connection.db
        .collection(productModel.collection.name)
        .countDocuments();

      // Act
      const response = await request(app)
        .put(`/${existingProduct._id}`)
        .field("name", "Count Check")
        .field("description", "updated")
        .field("price", 42)
        .field("category", testCategory._id.toString())
        .field("quantity", 3)
        .field("shipping", true);

      const afterCount = await mongoose.connection.db
        .collection(productModel.collection.name)
        .countDocuments();

      // Assert
      expect(response.status).toBe(200);
      expect(afterCount).toBe(beforeCount);
    });
  });

  describe("deleteProductController Integration Tests", () => {
    let testCategory;
    let productA;
    let productB;

    beforeEach(async () => {
      const collections = ["products", "categories", "users", "orders"];
      for (const name of collections) {
        await mongoose.connection.db.collection(name).deleteMany({});
      }

      testCategory = await new categoryModel({
        name: "Delete Cat",
        description: "delete cat",
      }).save();

      productA = await new productModel({
        name: "To Delete",
        slug: "to-delete",
        description: "to be removed",
        price: 1,
        category: testCategory._id,
        quantity: 1,
        shipping: true,
      }).save();

      productB = await new productModel({
        name: "To Keep",
        slug: "to-keep",
        description: "should remain",
        price: 2,
        category: testCategory._id,
        quantity: 2,
        shipping: true,
      }).save();
    });

    it("returns 200 and success when product is deleted", async () => {
      // Arrange
      const app = createExpressTestController([["delete", "/:pid", deleteProductController]]);

      // Act
      const response = await request(app).delete(`/${productA._id}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Product deleted successfully");
    });

    it("reduces products count by 1 after delete", async () => {
      // Arrange
      const app = createExpressTestController([["delete", "/:pid", deleteProductController]]);
      const before = await mongoose.connection.db
        .collection(productModel.collection.name)
        .countDocuments();

      // Act
      await request(app).delete(`/${productA._id}`);
      const after = await mongoose.connection.db
        .collection(productModel.collection.name)
        .countDocuments();

      // Assert
      expect(after).toBe(before - 1);
    });

    it("removes the document from the database", async () => {
      // Arrange
      const app = createExpressTestController([["delete", "/:pid", deleteProductController]]);

      // Act
      await request(app).delete(`/${productA._id}`);

      // Assert
      const stillThere = await productModel.findById(productA._id);
      expect(stillThere).toBeNull();
    });

    it("returns 404 when product does not exist", async () => {
      // Arrange
      const app = createExpressTestController([["delete", "/:pid", deleteProductController]]);
      const missingId = new mongoose.Types.ObjectId().toString();

      // Act
      const response = await request(app).delete(`/${missingId}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Product not found");
    });

    it("returns 500 for invalid ObjectId format", async () => {
      // Arrange
      const app = createExpressTestController([["delete", "/:pid", deleteProductController]]);

      // Act
      const response = await request(app).delete(`/not-an-objectid`);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it("does not delete other documents", async () => {
      // Arrange
      const app = createExpressTestController([["delete", "/:pid", deleteProductController]]);

      // Act
      await request(app).delete(`/${productA._id}`);

      // Assert
      const remaining = await productModel.findById(productB._id);
      expect(remaining).toBeTruthy();
      expect(remaining.name).toBe("To Keep");
    });
  });
});

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

});
