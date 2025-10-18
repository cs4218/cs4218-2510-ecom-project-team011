import { describe } from "node:test"
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
  phone: "12345",
  address: "Tim Street",
  password: await hashPassword("timmy"),
  answer: "esports",
})

describe("UpdateProfileController", () => {
  /*
  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create()
  connection = mongoose.createConnection(mongoServer.getUri())
  })
  */
  
  it("Updates profile successfully", async () => {
    const mongoServer = await MongoMemoryServer.create()
    const connection = mongoose.createConnection(mongoServer.getUri())
    userModel.useConnection(connection)
    const user = await new userModel(await testUser()).save()
    
    const app = createExpressTestServer([
      ["put", "/", updateProfileController]
    ], {
      user
    })
    console.log(mongoServer.getUri())
    
    
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
})