import { afterEach, beforeEach, describe } from "node:test"
import { createExpressTestServer } from "./testutils" 
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import userModel from "../../models/userModel"
import { hashPassword } from "../../helpers/authHelper"
import request from "supertest"

import {updateProfileController} from "../authController"
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

describe("UpdateProfileController", async () => {

  
  it("updates profile successfully", async () => {
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
      answer: "test"
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