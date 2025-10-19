import { createExpressTestRoutes } from "./testUtils";
import request from "supertest"
import { describe } from "node:test";
import { MongoMemoryServer } from "mongodb-memory-server"
import userModel from "../../models/userModel"
import orderModel from "../../models/orderModel.js";
import mongoose from "mongoose";
import { hashPassword } from "../../helpers/authHelper"

import authRoutes from '../authRoute.js'

const testUser = async () => ({
  name: "Timmy",
  email: "Timmy@tim",
  phone: "1234567",
  address: "Tim Street",
  password: await hashPassword("timmy"),
  answer: "esports",
})

process.env.JWT_SECRET = "HGFHGEAD12124322432"


/*
CJ
=====================
PUT /profile
GET /orders
GET /all-orders
PUT /order-status/:orderId
*/

describe("PUT /profile", () => {
  it("fails when user is not authenticated", async () => {
    const mongoServer = await MongoMemoryServer.create()
    const connection = mongoose.createConnection(mongoServer.getUri())
    userModel.useConnection(connection)
    
    const app = createExpressTestRoutes([
      ["/", authRoutes]
    ])
    
    const newUser = {
      ...await testUser()
    }
    
    const res = await request(app).put("/profile").send(newUser)
    
    try {
      expect(res.status).toBe(400)
    } finally {
      connection.close()
      mongoServer.stop()
    }
  })
  
  it("succeeds when user is authenticated", async () => {
    const mongoServer = await MongoMemoryServer.create()
    const connection = mongoose.createConnection(mongoServer.getUri())
    userModel.useConnection(connection)
    
    const user = await new userModel(await testUser()).save()
    const app = createExpressTestRoutes([
      ["/", authRoutes]
    ], {
      user
    })
    
    const newUser = {
      ...user,
      password: "1234567"
    }
    
    const res = await request(app).put("/profile").send(newUser)
    
    try {
      expect(res.status).toBe(200)
    } finally {
      connection.close()
      mongoServer.stop()
    }
  })  
})

describe("GET /orders", () => {
  it("fails when unauthenticated", async () => {
    const mongoServer = await MongoMemoryServer.create()
    const connection = mongoose.createConnection(mongoServer.getUri())
    userModel.useConnection(connection)
    orderModel.useConnection(connection)
    
    const app = createExpressTestRoutes([
      ["/", authRoutes]
    ])
    
    const res = await request(app).get("/orders")
    
    try {
      expect(res.status).toBe(400)
    } finally {
      connection.close()
      mongoServer.stop()
    }
  })
  
  it("succeeds when authenticated", async () => {
    const mongoServer = await MongoMemoryServer.create()
    const connection = mongoose.createConnection(mongoServer.getUri())
    userModel.useConnection(connection)
    orderModel.useConnection(connection)
    
    const user = await new userModel(await testUser()).save()
    const app = createExpressTestRoutes([
      ["/", authRoutes]
    ], {
      user
    })
        
    const res = await request(app).get("/orders")
    
    try {
      expect(res.status).toBe(200)
    } finally {
      connection.close()
      mongoServer.stop()
    }
  })  
})

describe("GET /all-orders", () => {
    it("fails when not admin", async () => {
    const mongoServer = await MongoMemoryServer.create()
    const connection = mongoose.createConnection(mongoServer.getUri())
    userModel.useConnection(connection)
    orderModel.useConnection(connection)

    const user = await new userModel(await testUser()).save()
    
    const app = createExpressTestRoutes([
      ["/", authRoutes]
    ], {
      user
    })
    
    const res = await request(app).get("/all-orders")
    
    try {
      expect(res.status).toBe(401)
    } finally {
      connection.close()
      mongoServer.stop()
    }
  })
  
  it("succeeds when is admin", async () => {
    const mongoServer = await MongoMemoryServer.create()
    const connection = mongoose.createConnection(mongoServer.getUri())
    userModel.useConnection(connection)
    orderModel.useConnection(connection)
    
    const user = await new userModel({
      ...await testUser(),
      role: 1
    }).save()
    const app = createExpressTestRoutes([
      ["/", authRoutes]
    ], {
      user
    })
        
    const res = await request(app).get("/all-orders")
    
    try {
      expect(res.status).toBe(200)
    } finally {
      connection.close()
      mongoServer.stop()
    }
  })
})

// describe("PUT /order-status/:orderId")