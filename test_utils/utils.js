import { hashPassword } from "../helpers/authHelper"
import userModel from "../models/userModel"
import productModel from "../models/productModel"
import orderModel from "../models/orderModel"
import categoryModel from "../models/categoryModel"

export const initDb = async (connection) => {
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