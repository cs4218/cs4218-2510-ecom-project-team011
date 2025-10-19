import { afterEach, beforeEach, describe } from "node:test"
import { createExpressTestServer } from "./testutils" 
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import userModel from "../../models/userModel"
import { hashPassword } from "../../helpers/authHelper"
import request from "supertest"

import {getAllOrdersController, getOrdersController, orderStatusController, updateProfileController} from "../authController"
import orderModel from "../../models/orderModel"
import productModel from "../../models/productModel"
import categoryModel from "../../models/categoryModel"
// CJ's tests

// updateProfileController: "../models/userModel.js/userModal", ;
// getOrdersController, 
// getAllOrdersController, 
// orderStatusController


const testUser = async () => ({
  name: "Timmy",
  email: "Timmy@tim",
  phone: "1234567",
  address: "Tim Street",
  password: await hashPassword("timmy"),
  answer: "esports",
})

const initDb = async (connection) => {
  const hashedPassword = await hashPassword("1234567")
  
  if (connection) {
    userModel.useConnection(connection)
    productModel.useConnection(connection)
    orderModel.useConnection(connection)
    categoryModel.useConnection(connection)
  }
  
  const [electronics, clothing, home] = await categoryModel.insertMany([
    {name: "electronics", isActive: true},
    {name: "clothing", isActive: true},
    {name: "home", isActive: true} 
  ])
  
  const categories = [electronics, clothing, home]
  
  const users = await userModel.insertMany([
    {
      name: "Alice", email: "alice@test.com", password: hashedPassword, 
      phone: "1", address: "a", answer: "sport1" 
    },
    { 
      name: "Bob", email: "bob@test.com", password: hashedPassword, 
      phone: "2", address: "b", answer: "sport2"
    },
    {
      name: "Charlie", email: "charlie@test.com", password: hashedPassword, 
      phone: "3", address: "c", answer: "sport3"
    },
  ]);
  
  const [alice, bob, charlie] = users
  
  const products = await productModel.insertMany([
    {
      name: "Laptop",
      slug: "laptop",
      description: "Portable computer",
      price: 1200,
      category: electronics._id,
      quantity: 10,
      shipping: true,
    },
    {
      name: "T-Shirt",
      slug: "t-shirt",
      description: "Cotton t-shirt",
      price: 25,
      category: clothing._id,
      quantity: 50,
      shipping: true,
    },
    {
      name: "Vacuum Cleaner",
      slug: "vacuum-cleaner",
      description: "Powerful cleaning device",
      price: 300,
      category: home._id,
      quantity: 20,
      shipping: true,
    },
    {
      name: "Headphones",
      slug: "headphones",
      description: "Noise cancelling headphones",
      price: 150,
      category: electronics._id,
      quantity: 15,
      shipping: true,
    },
  ]);
  
  const [laptop, tshirt, vacuum, headphones] = products
  
  const orders = await orderModel.insertMany([
    {
      products: [laptop._id, headphones._id],
      buyer: alice._id,
      payment: { method: "credit_card", amount: 1350 },
      status: "Processing",
    },
    {
      products: [tshirt._id],
      buyer: bob._id,
      payment: { method: "paypal", amount: 25 },
      status: "Shipped",
    },
    {
      products: [vacuum._id],
      buyer: charlie._id,
      payment: { method: "cod", amount: 300 },
      status: "deliverd", //TODO: fix spelling error
    },
  ]);
  
  return {categories, users, products, orders}
}

describe("updateProfileController", () => {
  
  it("updates profile successfully", async () => {
    // using a beforeEach doesnt seem to initialize the db before the test starts
    const mongoServer = await MongoMemoryServer.create()
    const connection = mongoose.createConnection(mongoServer.getUri())
    userModel.useConnection(connection)
    const user = await new userModel(await testUser()).save()
    
    const app = createExpressTestServer([
      ["put", "/", updateProfileController]
    ], {
      user
    })
    
    const updatedUser = {
      ...user,
      name: "Tom",
      email: "Tam@tam",
      phone: "54321",
      address: "Tom Street",
      answer: "test",
      password: "Timbits"
    }
    const response = await request(app).put("/").send(updatedUser)
    
    try {
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true)
    } finally {
      connection.close()
      mongoServer.stop()
    }
    
  }, 20000)
  
  it("rejects too short passwords", async () => {
    const mongoServer = await MongoMemoryServer.create()
    const connection = mongoose.createConnection(mongoServer.getUri())
    userModel.useConnection(connection)
    
    const user = await new userModel(await testUser()).save()
    const app = createExpressTestServer([
      ["put", "/", updateProfileController]
    ], {
      user
    })
    
    const newUser = {
      ...user,
      password: "12"
    }
    
    const response = await request(app).put("/").send(newUser)
    
    try {
      // expect(response.status).toBe(400)
      expect(response.body.success).toBeFalsy()
      expect(response.body.error).toContain("6") // expects at least 6 characters
    } finally {
      connection.close()
      mongoServer.stop()
    }
  })
  
  it("rejects non-existent users", async () => {
    const mongoServer = await MongoMemoryServer.create()
    const connection = mongoose.createConnection(mongoServer.getUri())
    userModel.useConnection(connection)
    
    const user = await new userModel(await testUser()).save()
    const app = createExpressTestServer([
      ["put", "/", updateProfileController]
    ], {
      user
    })
    
    const newUser = {
      _id: "N",
      password: "12"
    }
    
    const response = await request(app).put("/").send(newUser)
    
    try {
      // expect(response.status).toBe(400)
      expect(response.body.success).toBeFalsy()
    } finally {
      connection.close()
      mongoServer.stop()
    }
  })
})

describe("getOrdersController", () => {
  it("gives only the user's orders", async () => {
    const mongoServer = await MongoMemoryServer.create()
    const connection = mongoose.createConnection(mongoServer.getUri())
    orderModel.useConnection(connection)
    userModel.useConnection(connection)
    
    const user = await new userModel(await testUser()).save()   
    const {users, products} = await initDb(connection) 
    
    orderModel.insertOne({
      products: products[0]._id,
      buyer: user._id,
      payment: {method: "credit_card", amount: "1000"},
      status: "deliverd"
    })
    
    const app = createExpressTestServer([
      ["get", "/", getOrdersController]
    ], {
      user
    })
    
    const res = await request(app).get("/")
    
    try {
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(1)
      
      expect(res.body[0].products[0]._id == (products[0]._id)).toBe(true)
      res.body.map(order => {
        expect(order.buyer._id == (user._id)).toBe(true)
      })
    } finally {
      connection.close()
      mongoServer.stop()
    }
  })
})

describe("getAllOrdersController", () => {
  it("should give all orders", async () => {
    const mongoServer = await MongoMemoryServer.create()
    const connection = mongoose.createConnection(mongoServer.getUri())
    orderModel.useConnection(connection)
    userModel.useConnection(connection)
    
    const {orders} = await initDb(connection) 
    
    const app = createExpressTestServer([
      ["get", "/", getAllOrdersController]
    ])
    
    const res = await request(app).get("/")
    
    
    try {
      const resultOrderIds = res.body.map(order => order._id).sort()
      const expectedOrderIds = orders.map(order => order._id.valueOf()).sort()
      expect(res.status).toBe(200)
      expect(resultOrderIds.length).toBe(expectedOrderIds.length)
      for (let i = 0; i < resultOrderIds.length; i++) {
        expect(resultOrderIds[i]).toBe(expectedOrderIds[i])
      }
    } finally {
      connection.close()
      mongoServer.stop()
    }
  })
})

describe("orderStatusController", () => {
  it("updates an order", async () => {
    const mongoServer = await MongoMemoryServer.create()
    const connection = mongoose.createConnection(mongoServer.getUri())
    orderModel.useConnection(connection)
    userModel.useConnection(connection)
    
    const {orders} = await initDb(connection) 
    
    const app = createExpressTestServer([
      ["put", "/:orderId", orderStatusController]
    ])
    
    const orderToUpdate = orders[0]
    const newStatus = "cancel"
    
    const res = await request(app).put(`/${orderToUpdate._id.valueOf()}`).send({ status: newStatus })
    const updatedOrder = await orderModel.findById(orderToUpdate._id).exec()
    console.log(res.body)
    try {
      expect(res.status).toBe(200)
      expect(updatedOrder.status).toBe(newStatus)
      //TODO: add handling when orderId is invalid
    } finally {
      connection.close()
      mongoServer.stop()
    }
  })
})