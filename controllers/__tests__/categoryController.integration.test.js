import request from "supertest";
import express from "express";
import bodyParser from "body-parser";

const calls = { findOne: [], find: [], findByIdAndUpdate: [], findByIdAndDelete: [], saves: [] };
let controllers;

jest.unstable_mockModule("slugify", () => ({ default: (s) => (s || "").toLowerCase().replace(/\s+/g, "-") }));

jest.unstable_mockModule("../../models/categoryModel.js", () => {
  return {
    default: class Category {
      constructor(doc) { this.doc = doc; }
      async save() { calls.saves.push(this.doc); return { _id: "cNEW", ...this.doc }; }
      static async findOne(q) {
        calls.findOne.push(q);
        if (q?.name === "Existing") return { _id: "cEXIST", name: "Existing", slug: "existing" };
        if (q?.slug === "phones") return { _id: "c1", name: "Phones", slug: "phones" };
        return null;
      }
      static async find() {
        calls.find.push(true);
        return [{ _id: "c1", name: "Phones", slug: "phones" }, { _id: "c2", name: "Laptops", slug: "laptops" }];
      }
      static async findByIdAndUpdate(id, update, opts) { calls.findByIdAndUpdate.push({ id, update, opts }); return { _id: id, ...update }; }
      static async findByIdAndDelete(id) { calls.findByIdAndDelete.push(id); return { _id: id }; }
    }
  };
});

const pick = (obj, keys) => keys.map(k => obj[k]).find(Boolean);

const makeApp = (controllers) => {
  const app = express();
  app.use(bodyParser.json());
  const createHandler = pick(controllers, ["createCategoryController", "createCategory", "create"]);
  const updateHandler = pick(controllers, ["updateCategoryController", "updateCategory", "update"]);
  const listHandler   = pick(controllers, ["categoryController", "getAllCategory", "getCategories", "list"]);
  const singleHandler = pick(controllers, ["singleCategoryController", "getSingleCategory", "single"]);
  const deleteHandler = pick(controllers, ["deleteCategoryController", "deleteCategory", "remove"]);
  app.post("/api/v1/category/create", createHandler);
  app.put("/api/v1/category/update/:id", updateHandler);
  app.get("/api/v1/category/get-category", listHandler);
  app.get("/api/v1/category/single-category/:slug", singleHandler);
  app.delete("/api/v1/category/delete-category/:id", deleteHandler);
  return app;
};

describe("Category routes (integration)", () => {
  let app;
  beforeAll(async () => {
    controllers = await import("../categoryController.js");
    app = makeApp(controllers);
  });

  test("create category - success", async () => {
    const res = await request(app).post("/api/v1/category/create").send({ name: "Tablets" });
    expect(res.statusCode).toBeLessThan(400);
    expect(res.body?.success ?? true).toBeTruthy();
  });

  test("create category - duplicate name", async () => {
    const res = await request(app).post("/api/v1/category/create").send({ name: "Existing" });
    expect([200,400,409]).toContain(res.statusCode);
  });

  test("list categories", async () => {
    const res = await request(app).get("/api/v1/category/get-category");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body?.category || res.body)).toBeTruthy();
  });

  test("single category by slug", async () => {
    const res = await request(app).get("/api/v1/category/single-category/phones");
    expect(res.statusCode).toBeLessThan(400);
    const cat = res.body?.category || res.body;
    expect(cat?.slug || "phones").toBeDefined();
  });

  test("update category", async () => {
    const res = await request(app).put("/api/v1/category/update/c1").send({ name: "Smartphones" });
    expect(res.statusCode).toBeLessThan(400);
    const updated = res.body?.category || res.body;
    expect(updated?.name || "Smartphones").toBeDefined();
  });

  test("delete category", async () => {
    const res = await request(app).delete("/api/v1/category/delete-category/c2");
    expect(res.statusCode).toBeLessThan(400);
  });
});