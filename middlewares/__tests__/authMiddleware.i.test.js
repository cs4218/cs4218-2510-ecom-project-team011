import request from "supertest"
import { createExpressTestController } from "../../controllers/__tests__/testutils" 
import {requireSignIn, isAdmin} from "../authMiddleware"
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import userModel from "../../models/userModel"
import jwt from "jsonwebtoken"


describe("requireSignIn middleware", () => {
  it("accepts autheticated users", async () => {
    const app = createExpressTestController([
      ["get", "/", (req, res) => res.status(200).send({success: true,}), [requireSignIn]]
    ], {
      user: {
        _id: "12345"
      }
    })
    
    const response = await request(app).get("/")
    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
  })
  
  it("rejects unauthenticated users", async () => {
    const app = createExpressTestController([
      ["get", "/", (req, res) => res.status(200).send({success: true,}), [requireSignIn]]
    ])
    
    const response = await request(app).get("/")
    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
  })
})


describe("isAdmin middleware", () => {
  
  it("accepts admins", async () => {
    const mongoServer = await MongoMemoryServer.create()
    const connection = mongoose.createConnection(mongoServer.getUri())
    userModel.useConnection(connection)
    const newId = new mongoose.Types.ObjectId()
    const user = await new userModel({
      _id: newId, name: "a", email: "a@a", role: 1, password: "12345", answer: "a", address: "a", phone: "a"
    }).save()
    
    const app = createExpressTestController([
      ["get", "/", (req, res) => res.status(200).send({success: true,}), [isAdmin]]
    ], {
      user: {
        _id: newId.valueOf(),
      }
    })
    
    const response = await request(app).get("/")

    try {
    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    } finally {
      connection.close()
      mongoServer.stop()
    }
  })
  
  it("rejects non-admin", async () => {
    const app = createExpressTestController([
      ["get", "/", (req, res) => res.status(200).send({success: true,}), [isAdmin]]
    ])
    
    const response = await request(app).get("/")
    expect(response.status).toBe(401)
    expect(response.body.success).toBe(false)
  })
})