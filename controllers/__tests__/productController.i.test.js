import { createExpressTestServer } from "./testutils" 
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import productModel from "../../models/productModel"
import categoryModel from "../../models/categoryModel"
import request from "supertest"

import {
  getProductController,
  getSingleProductController,
  productPhotoController,
  deleteProductController,
  productCountController,
  productListController,
  searchProductController,
  relatedProductController,
  productCategoryController
} from "../productController"

describe("Product Controller Integration Tests", () => {
  let mongoServer
  let connection

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create()
    connection = mongoose.createConnection(mongoServer.getUri())
    productModel.useConnection(connection)
    categoryModel.useConnection(connection)
  })

  afterEach(async () => {
    await connection.close()
    await mongoServer.stop()
  })

  describe("getProductController", () => {
    it("retrieves all products successfully", async () => {
      // Create test category
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics"
      }).save()

      // Create test products
      await new productModel({
        name: "Laptop",
        slug: "laptop",
        description: "Gaming laptop",
        price: 1500,
        category: category._id,
        quantity: 10,
        shipping: true
      }).save()

      await new productModel({
        name: "Phone",
        slug: "phone",
        description: "Smartphone",
        price: 800,
        category: category._id,
        quantity: 20,
        shipping: true
      }).save()

      const app = createExpressTestServer([
        ["get", "/", getProductController]
      ])

      const response = await request(app).get("/")

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.products).toHaveLength(2)
      expect(response.body.countTotal).toBe(2)
    })

    it("returns empty array when no products exist", async () => {
      const app = createExpressTestServer([
        ["get", "/", getProductController]
      ])

      const response = await request(app).get("/")

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.products).toHaveLength(0)
      expect(response.body.countTotal).toBe(0)
    })
  })

  describe("getSingleProductController", () => {
    it("retrieves single product by slug successfully", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics"
      }).save()

      await new productModel({
        name: "Laptop",
        slug: "laptop",
        description: "Gaming laptop",
        price: 1500,
        category: category._id,
        quantity: 10,
        shipping: true
      }).save()

      const app = createExpressTestServer([
        ["get", "/:slug", getSingleProductController]
      ])

      const response = await request(app).get("/laptop")

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.product.name).toBe("Laptop")
      expect(response.body.product.slug).toBe("laptop")
    })

    it("returns 404 when product not found", async () => {
      const app = createExpressTestServer([
        ["get", "/:slug", getSingleProductController]
      ])

      const response = await request(app).get("/nonexistent")

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe("Product not found")
    })
  })

  describe("productPhotoController", () => {
    it("returns 404 when product has no photo", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics"
      }).save()

      const product = await new productModel({
        name: "Laptop",
        slug: "laptop",
        description: "Gaming laptop",
        price: 1500,
        category: category._id,
        quantity: 10,
        shipping: true
      }).save()

      const app = createExpressTestServer([
        ["get", "/:pid", productPhotoController]
      ])

      const response = await request(app).get(`/${product._id}`)

      expect(response.status).toBe(404)
    })

    it("returns 404 when product not found", async () => {
      const app = createExpressTestServer([
        ["get", "/:pid", productPhotoController]
      ])

      const fakeId = new mongoose.Types.ObjectId()
      const response = await request(app).get(`/${fakeId}`)

      expect(response.status).toBe(404)
    })
  })

  describe("deleteProductController", () => {
    it("deletes product successfully", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics"
      }).save()

      const product = await new productModel({
        name: "Laptop",
        slug: "laptop",
        description: "Gaming laptop",
        price: 1500,
        category: category._id,
        quantity: 10,
        shipping: true
      }).save()

      const app = createExpressTestServer([
        ["delete", "/:pid", deleteProductController]
      ])

      const response = await request(app).delete(`/${product._id}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe("Product deleted successfully")

      // Verify product is deleted
      const deletedProduct = await productModel.findById(product._id)
      expect(deletedProduct).toBeNull()
    })

    it("returns 404 when deleting non-existent product", async () => {
      const app = createExpressTestServer([
        ["delete", "/:pid", deleteProductController]
      ])

      const fakeId = new mongoose.Types.ObjectId()
      const response = await request(app).delete(`/${fakeId}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe("Product not found")
    })
  })

  describe("productCountController", () => {
    it("returns correct product count", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics"
      }).save()

      // Create 3 products
      for (let i = 1; i <= 3; i++) {
        await new productModel({
          name: `Product ${i}`,
          slug: `product-${i}`,
          description: `Description ${i}`,
          price: 100 * i,
          category: category._id,
          quantity: 10,
          shipping: true
        }).save()
      }

      const app = createExpressTestServer([
        ["get", "/", productCountController]
      ])

      const response = await request(app).get("/")

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.total).toBe(3)
    })

    it("returns zero when no products exist", async () => {
      const app = createExpressTestServer([
        ["get", "/", productCountController]
      ])

      const response = await request(app).get("/")

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.total).toBe(0)
    })
  })

  describe("productListController", () => {
    it("returns paginated products", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics"
      }).save()

      // Create 10 products
      for (let i = 1; i <= 10; i++) {
        await new productModel({
          name: `Product ${i}`,
          slug: `product-${i}`,
          description: `Description ${i}`,
          price: 100 * i,
          category: category._id,
          quantity: 10,
          shipping: true
        }).save()
      }

      const app = createExpressTestServer([
        ["get", "/:page", productListController]
      ])

      const response = await request(app).get("/1")

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.products).toHaveLength(6) // perPage = 6
    })

    it("returns second page of products", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics"
      }).save()

      // Create 10 products
      for (let i = 1; i <= 10; i++) {
        await new productModel({
          name: `Product ${i}`,
          slug: `product-${i}`,
          description: `Description ${i}`,
          price: 100 * i,
          category: category._id,
          quantity: 10,
          shipping: true
        }).save()
      }

      const app = createExpressTestServer([
        ["get", "/:page", productListController]
      ])

      const response = await request(app).get("/2")

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.products).toHaveLength(4) // Remaining 4 products
    })
  })

  describe("searchProductController", () => {
    it("searches products by name successfully", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics"
      }).save()

      await new productModel({
        name: "Gaming Laptop",
        slug: "gaming-laptop",
        description: "High-end gaming laptop",
        price: 2000,
        category: category._id,
        quantity: 5,
        shipping: true
      }).save()

      await new productModel({
        name: "Office Laptop",
        slug: "office-laptop",
        description: "Business laptop",
        price: 1000,
        category: category._id,
        quantity: 10,
        shipping: true
      }).save()

      const app = createExpressTestServer([
        ["get", "/:keyword", searchProductController]
      ])

      const response = await request(app).get("/gaming")

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.results).toHaveLength(1)
      expect(response.body.results[0].name).toBe("Gaming Laptop")
    })

    it("searches products by description successfully", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics"
      }).save()

      await new productModel({
        name: "Laptop",
        slug: "laptop",
        description: "High-end gaming device",
        price: 2000,
        category: category._id,
        quantity: 5,
        shipping: true
      }).save()

      const app = createExpressTestServer([
        ["get", "/:keyword", searchProductController]
      ])

      const response = await request(app).get("/gaming")

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.results).toHaveLength(1)
    })

    it("returns empty array when no matches found", async () => {
      const app = createExpressTestServer([
        ["get", "/:keyword", searchProductController]
      ])

      const response = await request(app).get("/nonexistent")

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.results).toHaveLength(0)
    })
  })

  describe("relatedProductController", () => {
    it("retrieves related products successfully", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics"
      }).save()

      const product1 = await new productModel({
        name: "Laptop",
        slug: "laptop",
        description: "Gaming laptop",
        price: 1500,
        category: category._id,
        quantity: 10,
        shipping: true
      }).save()

      await new productModel({
        name: "Mouse",
        slug: "mouse",
        description: "Gaming mouse",
        price: 50,
        category: category._id,
        quantity: 50,
        shipping: true
      }).save()

      await new productModel({
        name: "Keyboard",
        slug: "keyboard",
        description: "Mechanical keyboard",
        price: 100,
        category: category._id,
        quantity: 30,
        shipping: true
      }).save()

      const app = createExpressTestServer([
        ["get", "/:pid/:cid", relatedProductController]
      ])

      const response = await request(app).get(`/${product1._id}/${category._id}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.products).toHaveLength(2)
      expect(response.body.products.every(p => p._id.toString() !== product1._id.toString())).toBe(true)
    })

    it("returns 404 when product id is missing", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics"
      }).save()

      const app = createExpressTestServer([
        ["get", "/:pid/:cid", relatedProductController]
      ])

      const response = await request(app).get(`//${category._id}`)

      expect(response.status).toBe(404)
    })

    it("returns 404 when category id is missing", async () => {
      const fakeId = new mongoose.Types.ObjectId()

      const app = createExpressTestServer([
        ["get", "/:pid/:cid", relatedProductController]
      ])

      const response = await request(app).get(`/${fakeId}/`)

      expect(response.status).toBe(404)
    })
  })

  describe("productCategoryController", () => {
    it("retrieves products by category successfully", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics"
      }).save()

      await new productModel({
        name: "Laptop",
        slug: "laptop",
        description: "Gaming laptop",
        price: 1500,
        category: category._id,
        quantity: 10,
        shipping: true
      }).save()

      await new productModel({
        name: "Phone",
        slug: "phone",
        description: "Smartphone",
        price: 800,
        category: category._id,
        quantity: 20,
        shipping: true
      }).save()

      const app = createExpressTestServer([
        ["get", "/:slug", productCategoryController]
      ])

      const response = await request(app).get("/electronics")

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.products).toHaveLength(2)
      expect(response.body.category.name).toBe("Electronics")
    })

    it("returns 400 when category not found", async () => {
      const app = createExpressTestServer([
        ["get", "/:slug", productCategoryController]
      ])

      const response = await request(app).get("/nonexistent")

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe("Category not found")
    })

    it("returns empty products array when category has no products", async () => {
      const category = await new categoryModel({
        name: "Electronics",
        slug: "electronics"
      }).save()

      const app = createExpressTestServer([
        ["get", "/:slug", productCategoryController]
      ])

      const response = await request(app).get("/electronics")

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.products).toHaveLength(0)
    })
  })
})