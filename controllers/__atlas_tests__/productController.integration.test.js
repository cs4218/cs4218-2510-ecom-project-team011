import { createExpressTestController } from "./testutils";
import connectDB from "../../config/db";
import mongoose from "mongoose";
import productModel from "../../models/productModel";
import categoryModel from "../../models/categoryModel";
import userModel from "../../models/userModel";
import request from "supertest";
import path from "path";

import {
  createProductController,
  deleteProductController,
  updateProductController,
} from "../productController";

//You Wei's Integration Tests
//Formidable middleware is used to parse the request body and files, which breaks the tests of suites in __tests__ folder.
//This folder tests the integration of the product controller with the database along with middleware functions used by Virtual Vault.
//TO USE: create a test database with the name "test_0" with the collections "products", "categories", "users", "orders" in Atlas
describe("CRUD Product Controller Integration Tests", () => {
  // Direct integration tests with MongoDB Atlas to simulate real database environment as close as possible
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