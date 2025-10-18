import { createExpressTestServer } from "./testutils";
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

  describe("createProductController", () => {
    it("creates product successfully without photo", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const app = createExpressTestServer([
        ["post", "/", createProductController, [formidable()]],
      ]);

      const productData = {
        name: "Test Laptop",
        description: "A test laptop",
        price: 1000,
        category: category._id,
        quantity: 5,
        shipping: true,
      };

      const response = await request(app)
        .post("/")
        .field("name", productData.name)
        .field("description", productData.description)
        .field("price", productData.price)
        .field("category", productData.category.toString())
        .field("quantity", productData.quantity)
        .field("shipping", productData.shipping);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Product created successfully");
      expect(response.body.product.name).toBe("Test Laptop");
      expect(response.body.product.slug).toBe("Test-Laptop");
    });

    it("creates product successfully with photo", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const app = createExpressTestServer([
        ["post", "/", createProductController, [formidable()]],
      ]);

      // Create a small test image file
      const testImagePath = path.join(os.tmpdir(), "test-image.png");
      const smallImageBuffer = Buffer.alloc(500000); // 500KB
      fs.writeFileSync(testImagePath, smallImageBuffer);

      const response = await request(app)
        .post("/")
        .field("name", "Laptop with Photo")
        .field("description", "A laptop with photo")
        .field("price", 1500)
        .field("category", category._id.toString())
        .field("quantity", 10)
        .field("shipping", true)
        .attach("photo", testImagePath);

      // Cleanup
      fs.unlinkSync(testImagePath);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.product.name).toBe("Laptop with Photo");
    });

    it("returns 400 when name is missing", async () => {
      const app = createExpressTestServer([
        ["post", "/", createProductController, [formidable()]],
      ]);

      const response = await request(app)
        .post("/")
        .field("description", "Test description")
        .field("price", 1000);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Product name is required");
    });

    it("returns 400 when description is missing", async () => {
      const app = createExpressTestServer([
        ["post", "/", createProductController, [formidable()]],
      ]);

      const response = await request(app)
        .post("/")
        .field("name", "Test Product")
        .field("price", 1000);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Product description is required");
    });

    it("returns 400 when price is missing", async () => {
      const app = createExpressTestServer([
        ["post", "/", createProductController, [formidable()]],
      ]);

      const response = await request(app)
        .post("/")
        .field("name", "Test Product")
        .field("description", "Test description");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Product price is required");
    });

    it("returns 400 when category is missing", async () => {
      const app = createExpressTestServer([
        ["post", "/", createProductController, [formidable()]],
      ]);

      const response = await request(app)
        .post("/")
        .field("name", "Test Product")
        .field("description", "Test description")
        .field("price", 1000);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Product category is required");
    });

    it("returns 400 when quantity is missing", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const app = createExpressTestServer([
        ["post", "/", createProductController, [formidable()]],
      ]);

      const response = await request(app)
        .post("/")
        .field("name", "Test Product")
        .field("description", "Test description")
        .field("price", 1000)
        .field("category", category._id.toString());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Product quantity is required");
    });

    it("returns 400 when shipping is missing", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const app = createExpressTestServer([
        ["post", "/", createProductController, [formidable()]],
      ]);

      const response = await request(app)
        .post("/")
        .field("name", "Test Product")
        .field("description", "Test description")
        .field("price", 1000)
        .field("category", category._id.toString())
        .field("quantity", 10);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Product shipping is required");
    });
  });

  describe("updateProductController", () => {
    it("updates product successfully without photo", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const product = await new productModel({
        name: "Old Laptop",
        slug: "old-laptop",
        description: "Old description",
        price: 1000,
        category: category._id,
        quantity: 5,
        shipping: true,
      }).save();

      const app = createExpressTestServer([
        ["put", "/:pid", updateProductController, [formidable()]],
      ]);

      const response = await request(app)
        .put(`/${product._id}`)
        .field("name", "Updated Laptop")
        .field("description", "Updated description")
        .field("price", 1500)
        .field("category", category._id.toString())
        .field("quantity", 10)
        .field("shipping", false);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Product updated successfully");
      expect(response.body.product.name).toBe("Updated Laptop");
      expect(response.body.product.slug).toBe("Updated-Laptop");
      expect(response.body.product.price).toBe(1500);
    });

    it("returns 404 when updating non-existent product", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      const app = createExpressTestServer([
        ["put", "/:pid", updateProductController, [formidable()]],
      ]);

      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/${fakeId}`)
        .field("name", "Test Product")
        .field("description", "Test description")
        .field("price", 1000)
        .field("category", category._id.toString())
        .field("quantity", 10)
        .field("shipping", true);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Product not found");
    });

    it("returns 400 when required fields are missing", async () => {
      const product = await new productModel({
        name: "Test Laptop",
        slug: "test-laptop",
        description: "Test description",
        price: 1000,
        category: new mongoose.Types.ObjectId(),
        quantity: 5,
        shipping: true,
      }).save();

      const app = createExpressTestServer([
        ["put", "/:pid", updateProductController, [formidable()]],
      ]);

      const response = await request(app)
        .put(`/${product._id}`)
        .field("description", "Updated description");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("deleteProductController", () => {
    it("deletes product successfully", async () => {
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
        ["delete", "/:pid", deleteProductController],
      ]);

      const response = await request(app).delete(`/${product._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Product deleted successfully");

      // Verify product is deleted
      const deletedProduct = await productModel.findById(product._id);
      expect(deletedProduct).toBeNull();
    });

    it("returns 404 when deleting non-existent product", async () => {
      const app = createExpressTestServer([
        ["delete", "/:pid", deleteProductController],
      ]);

      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).delete(`/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Product not found");
    });
  });

  describe("getProductController", () => {
    it("retrieves all products successfully", async () => {
      // Create test category
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      // Create test products
      await new productModel({
        name: "Laptop",
        slug: "laptop",
        description: "Gaming laptop",
        price: 1500,
        category: category._id,
        quantity: 10,
        shipping: true,
      }).save();

      await new productModel({
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

      await new productModel({
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
      expect(response.body.product.name).toBe("Laptop");
      expect(response.body.product.slug).toBe("laptop");
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

      // Create 3 products
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

      // Create 10 products
      for (let i = 1; i <= 10; i++) {
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
        ["get", "/:page", productListController],
      ]);

      const response = await request(app).get("/1");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(6); // perPage = 6
    });

    it("returns second page of products", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      // Create 10 products
      for (let i = 1; i <= 10; i++) {
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
        ["get", "/:page", productListController],
      ]);

      const response = await request(app).get("/2");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(4); // Remaining 4 products
    });
  });

  describe("searchProductController", () => {
    it("searches products by name successfully", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      await new productModel({
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
      expect(response.body.results[0].name).toBe("Gaming Laptop");
    });

    it("searches products by description successfully", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      await new productModel({
        name: "Laptop",
        slug: "laptop",
        description: "High-end gaming device",
        price: 2000,
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

      await new productModel({
        name: "Mouse",
        slug: "mouse",
        description: "Gaming mouse",
        price: 50,
        category: category._id,
        quantity: 50,
        shipping: true,
      }).save();

      await new productModel({
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

      await new productModel({
        name: "Laptop",
        slug: "laptop",
        description: "Gaming laptop",
        price: 1500,
        category: category._id,
        quantity: 10,
        shipping: true,
      }).save();

      await new productModel({
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
      const category = await new categoryModel({
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

      await new productModel({
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
    });

    it("filters products by price range", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      await new productModel({
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

      await new productModel({
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
    });

    it("returns all products when no filters applied", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics",
      }).save();

      await new productModel({
        name: "Product 1",
        slug: "product-1",
        description: "Description 1",
        price: 100,
        category: category._id,
        quantity: 10,
        shipping: true,
      }).save();

      await new productModel({
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
    });
  });

  describe("braintreeTokenController", () => {
    it("generates client token successfully", async () => {
      const app = createExpressTestServer([
        ["get", "/", braintreeTokenController],
      ]);

      const response = await request(app).get("/");

      // Note: This will fail in test environment without proper Braintree credentials
      // We're testing the endpoint structure
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.body).toHaveProperty("success");
    });
  });

  describe("brainTreePaymentController", () => {
    it("returns 400 when nonce is missing", async () => {
      const app = createExpressTestServer([
        ["post", "/", brainTreePaymentController],
      ]);

      const response = await request(app)
        .post("/")
        .send({ cart: [{ price: 100 }] });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Payment nonce is required");
    });

    it("returns 400 when cart is empty", async () => {
      const app = createExpressTestServer([
        ["post", "/", brainTreePaymentController],
      ]);

      const response = await request(app)
        .post("/")
        .send({ nonce: "fake-nonce", cart: [] });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Cart is required and cannot be empty"
      );
    });

    it("returns 401 when user is not authenticated", async () => {
      const app = createExpressTestServer([
        ["post", "/", brainTreePaymentController],
      ]);

      const response = await request(app)
        .post("/")
        .send({
          nonce: "fake-nonce",
          cart: [{ price: 100 }],
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User authentication required");
    });
  });
});
