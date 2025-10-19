import { afterEach, beforeEach, describe } from "node:test"
import { createExpressTestController } from "./testutils" 
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import userModel from "../../models/userModel"
import { hashPassword } from "../../helpers/authHelper"
import request from "supertest"
import { initDb } from "../../test_utils/utils"

import {getAllOrdersController, getOrdersController, orderStatusController, updateProfileController} from "../authController"
import orderModel from "../../models/orderModel"
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

describe("updateProfileController", () => {
  
  it("updates profile successfully", async () => {
    // using a beforeEach doesnt seem to initialize the db before the test starts
    const mongoServer = await MongoMemoryServer.create()
    const connection = mongoose.createConnection(mongoServer.getUri())
    userModel.useConnection(connection)
    const user = await new userModel(await testUser()).save()
    
    const app = createExpressTestController([
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
    const app = createExpressTestController([
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
    const app = createExpressTestController([
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
    
    const app = createExpressTestController([
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
    
    const app = createExpressTestController([
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
    
    const app = createExpressTestController([
      ["put", "/:orderId", orderStatusController]
    ])
    
    const orderToUpdate = orders[0]
    const newStatus = "cancel"
    
    const res = await request(app).put(`/${orderToUpdate._id.valueOf()}`).send({ status: newStatus })
    const updatedOrder = await orderModel.findById(orderToUpdate._id).exec()
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