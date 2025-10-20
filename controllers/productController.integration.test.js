import { describe, it, beforeAll, beforeEach, afterAll, expect } from "@jest/globals";
import { createExpressTestController } from "./__tests__/testutils";
import mongoose from "mongoose";
import productModel from "../models/productModel";
import categoryModel from "../models/categoryModel";
import userModel from "../models/userModel";
import request from "supertest";
import connectDB from "../config/db";

import { createProductController } from "./productController";

describe("Product Controller Integration Tests", () => {
    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        await connectDB();
    });

    afterAll(async () => {
        // Clear all entries in collection
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
            
            // Create a test category (will go to test_categories collection)
            testCategory = await new categoryModel({
                name: "Test Category",
                description: "Test category description",
            }).save();

            // Create a test user (will go to test_users collection)
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

        it("should create a product successfully with valid data", async () => {
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

            const response = await request(app)
            .post("/")
            .field("name", productData.name)
            .field("description", productData.description)
            .field("price", productData.price)
            .field("category", productData.category)
            .field("quantity", productData.quantity)
            .field("shipping", productData.shipping);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Product created successfully");
            expect(response.body.product).toBeDefined();
            expect(response.body.product.name).toBe(productData.name);
            expect(response.body.product.slug).toBe("test-product");
            expect(response.body.product.price).toBe(productData.price);
            expect(response.body.product.category.toString()).toBe(testCategory._id.toString());

            // Verify product was saved to test_products collection
            const savedProduct = await productModel.findById(response.body.product._id);
            expect(savedProduct).toBeTruthy();
            expect(savedProduct.name).toBe(productData.name);
            
            // Verify it's in the products collection actually used by the model
            const productsCount = await mongoose.connection.db.collection(productModel.collection.name).countDocuments();
            expect(productsCount).toBe(1);

            // Verify the collection name being used
            console.log("Product model collection:", productModel.collection.name);
            expect(productModel.collection.name).toBe("products");
        });

        it("should reject product creation with missing name", async () => {
            const app = createExpressTestController([
            ["post", "/", createProductController]
            ], {
            user: testUser
            });

            const productData = {
            description: "Test product description",
            price: 99.99,
            category: testCategory._id.toString(),
            quantity: 10,
            shipping: true,
            };

            const response = await request(app)
            .post("/")
            .field("description", productData.description)
            .field("price", productData.price)
            .field("category", productData.category)
            .field("quantity", productData.quantity)
            .field("shipping", productData.shipping);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Product name is required");
        });

        it("should reject product creation with missing price", async () => {
            const app = createExpressTestController([
            ["post", "/", createProductController]
            ], {
            user: testUser
            });

            const productData = {
            name: "Test Product",
            description: "Test product description",
            category: testCategory._id.toString(),
            quantity: 10,
            shipping: true,
            };

            const response = await request(app)
            .post("/")
            .field("name", productData.name)
            .field("description", productData.description)
            .field("category", productData.category)
            .field("quantity", productData.quantity)
            .field("shipping", productData.shipping);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Product price is required");
        });
    });
});