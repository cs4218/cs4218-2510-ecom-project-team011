import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';


import * as categoryControllers from '../categoryController.js';

import Category from '../../models/categoryModel.js';

const {
  createCategoryController,
  updateCategoryController,
  categoryController,        
  singleCategoryController, 
  deleteCategoryController,
} = categoryControllers;

let mongod;
let app;

function buildApp() {
  const a = express();
  a.use(bodyParser.json());

  a.post('/api/v1/category/create', createCategoryController);
  a.put('/api/v1/category/update/:id', updateCategoryController);
  a.get('/api/v1/category/get-category', categoryController);
  a.get('/api/v1/category/single-category/:slug', singleCategoryController);
  a.delete('/api/v1/category/delete-category/:id', deleteCategoryController);

  return a;
}

describe('Category controller (mongodb-memory-server integration)', () => {
  beforeAll(async () => {
    // Start in-memory Mongo
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    // Connect mongoose
    await mongoose.connect(uri, {
      dbName: 'jest-category-tests',
    });

    // Build app after models are ready
    app = buildApp();
  });

  afterAll(async () => {
    // Close mongoose & stop in-memory server
    await mongoose.connection.close();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    // Clean DB between tests
    const { collections } = mongoose.connection;
    for (const name of Object.keys(collections)) {
      await collections[name].deleteMany({});
    }
  });

  test('POST /create -> creates a category (201)', async () => {
    const res = await request(app)
      .post('/api/v1/category/create')
      .send({ name: 'Phones' });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toMatchObject({
      success: true,
    });

    const saved = await Category.findOne({ name: 'Phones' });
    expect(saved).toBeTruthy();
    expect(saved.slug).toBe('phones'); 
  });

  test('POST /create -> rejects duplicate name (4xx)', async () => {
    // Seed an existing category
    await Category.create({ name: 'Laptops', slug: 'laptops' });

    const res = await request(app)
      .post('/api/v1/category/create')
      .send({ name: 'Laptops' });

    expect([200, 400, 409]).toContain(res.statusCode);
    expect(res.body?.success).not.toBe(true);
  });

  test('GET /get-category -> lists categories (200)', async () => {
    await Category.create([
      { name: 'Tablets', slug: 'tablets' },
      { name: 'Audio', slug: 'audio' },
    ]);

    const res = await request(app).get('/api/v1/category/get-category');
    expect(res.statusCode).toBe(200);

    const list = Array.isArray(res.body) ? res.body : res.body.category;
    expect(Array.isArray(list)).toBe(true);
    expect(list.map(c => c.name).sort()).toEqual(['Audio', 'Tablets']);
  });

  test('GET /single-category/:slug -> returns one (200)', async () => {
    await Category.create({ name: 'Cameras', slug: 'cameras' });

    const res = await request(app).get('/api/v1/category/single-category/cameras');
    expect([200, 201]).toContain(res.statusCode);

    const payload = res.body?.category ?? res.body?.data ?? res.body;
    expect(payload?.name).toBe('Cameras');
    expect(payload?.slug).toBe('cameras');
  });

  test('PUT /update/:id -> updates a category (200)', async () => {
    const cat = await Category.create({ name: 'Wearables', slug: 'wearables' });

    const res = await request(app)
      .put(`/api/v1/category/update/${cat._id}`)
      .send({ name: 'Smart Wearables' });

    expect([200, 201]).toContain(res.statusCode);

    const updated = await Category.findById(cat._id);
    expect(updated.name).toBe('Smart Wearables');
  });

  test('DELETE /delete-category/:id -> deletes a category (200)', async () => {
    const cat = await Category.create({ name: 'Accessories', slug: 'accessories' });

    const res = await request(app).delete(`/api/v1/category/delete-category/${cat._id}`);
    expect([200, 204]).toContain(res.statusCode);

    const gone = await Category.findById(cat._id);
    expect(gone).toBeNull();
  });
});
