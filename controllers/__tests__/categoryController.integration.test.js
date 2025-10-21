import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import * as mod from '../categoryController.js';
import Category from '../../models/categoryModel.js';

function pickHandlers(m) {
  // merge default (if object) + named
  const merged = {
    ...(m.default && typeof m.default === 'object' ? m.default : {}),
    ...m,
  };

  const pick = (...names) => names.map(n => merged[n]).find(fn => typeof fn === 'function');

  const create = pick('createCategoryController', 'createCategory', 'create');
  const update = pick('updateCategoryController', 'updateCategory', 'update');
  const list   = pick('categoryControlller', 'categoryController', 'getAllCategory', 'getCategories', 'list');
  const single = pick('singleCategoryController', 'getSingleCategory', 'single', 'read');
  const del    = pick('deleteCategoryController', 'deleteCategory', 'remove', 'destroy');

  const missing = [];
  if (!create) missing.push('create');
  if (!update) missing.push('update');
  if (!list)   missing.push('list');
  if (!single) missing.push('single');
  if (!del)    missing.push('delete');

  if (missing.length) {
    throw new Error(
      `Missing handlers: ${missing.join(', ')}. Available exports: ${Object.keys(merged).join(', ')}`
    );
  }
  return { create, update, list, single, del };
}

const controllers = pickHandlers(mod);

function buildApp() {
  const app = express();
  app.use(bodyParser.json());
  app.post('/api/v1/category/create', controllers.create);
  app.put('/api/v1/category/update/:id', controllers.update);
  app.get('/api/v1/category/single-category/:slug', controllers.single);
  app.delete('/api/v1/category/delete-category/:id', controllers.del);
  return app;
}

describe('Category controller (mongodb-memory-server integration)', () => {
  let mongod;
  let app;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri(), { dbName: 'jest-category-tests' });
    app = buildApp();
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongod.stop();
  });

  beforeEach(async () => {
    // clean DB
    const { collections } = mongoose.connection;
    for (const name of Object.keys(collections)) {
      await collections[name].deleteMany({});
    }
  });

  test('POST /create -> 400 when name empty/whitespace', async () => {
    const res = await request(app)
      .post('/api/v1/category/create')
      .send({ name: '   ' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/required/i),
    });
  });

  test('POST /create -> 201 creates category + slug', async () => {
    const res = await request(app)
      .post('/api/v1/category/create')
      .send({ name: 'Phones' });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.success).toBe(true);
    expect(res.body.category).toBeTruthy();

    const saved = await Category.findOne({ name: 'Phones' });
    expect(saved).toBeTruthy();
    expect(saved.slug).toBe('phones');
  });

  test('POST /create -> 409 duplicate (case-insensitive)', async () => {
    await Category.create({ name: 'Laptops', slug: 'laptops' });

    const res = await request(app)
      .post('/api/v1/category/create')
      .send({ name: 'lApToPs' });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('GET /single-category/:slug -> 404 when not found', async () => {
    const res = await request(app).get('/api/v1/category/single-category/unknown-slug');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('GET /single-category/:slug -> 200 returns one', async () => {
    await Category.create({ name: 'Cameras', slug: 'cameras' });
    const res = await request(app).get('/api/v1/category/single-category/cameras');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.category?.name).toBe('Cameras');
  });

  test('PUT /update/:id -> 404 when id not found', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/v1/category/update/${fakeId}`)
      .send({ name: 'New Name' });
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('PUT /update/:id -> 200 updates name + slug', async () => {
    const cat = await Category.create({ name: 'Wearables', slug: 'wearables' });
    const res = await request(app)
      .put(`/api/v1/category/update/${cat._id}`)
      .send({ name: 'Smart Wearables' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await Category.findById(cat._id);
    expect(updated.name).toBe('Smart Wearables');
    expect(updated.slug).toBe('smart-wearables');
  });

  test('DELETE /delete-category/:id -> 404 when id not found', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).delete(`/api/v1/category/delete-category/${fakeId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('DELETE /delete-category/:id -> 200 deletes', async () => {
    const cat = await Category.create({ name: 'Accessories', slug: 'accessories' });
    const res = await request(app).delete(`/api/v1/category/delete-category/${cat._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const gone = await Category.findById(cat._id);
    expect(gone).toBeNull();
  });
});
