import { hashPassword } from "../helpers/authHelper"
import userModel from "../models/userModel"
import productModel from "../models/productModel"
import orderModel from "../models/orderModel"
import categoryModel from "../models/categoryModel"

/**
 * @typedef {import("mongodb").ObjectId} ObjectId
 */

/**
 * @typedef {Object} DBData
 * @property {{ _id?: ObjectId, name: string, isActive: boolean }[]} categories - Categories to put into the database
 * @property {{ _id?: ObjectId, name: string, email: string, address: string, phone: string, password: string, answer: string }[]} users - Users to put into the database
 * @property {{ _id?: ObjectId, name: string, slug: string, description: string, price: number, category: ObjectId, quantity: number, shipping: boolean }[]} products - Products to put into the database
 * @property {{ _id?: ObjectId, products: ObjectId[], buyer: ObjectId, payment: { method: string, amount: number }, status?: string }[]} orders - Orders to put into the database
 */


/**
 * Initialize database with/without data
 * @param {import("mongoose").Connection} connection to the db
 * @param {DBData | undefined} data to be added to the db
 * @returns the populated values in the database
 */
export const initDb = async (connection, data=undefined) => {
  const hashedPassword = await hashPassword("1234567")
  
  if (connection) {
    userModel.useConnection(connection)
    productModel.useConnection(connection)
    orderModel.useConnection(connection)
    categoryModel.useConnection(connection)
  }

  if (data) {
    return {
      categories: await categoryModel.insertMany(data.categories ?? []),
      users: await userModel.insertMany(data.users ?? []),
      products: await productModel.insertMany(data.products ?? []),
      orders: await orderModel.insertMany(data.orders ?? [])
    } 
  }
  
  const [electronics, clothing, home] = await categoryModel.insertMany([
    {name: "electronics", isActive: true},
    {name: "clothing", isActive: true},
    {name: "home", isActive: true},
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