const request = require("supertest");
const app = require("../src/app");

describe("Products auth", () => {
  it("GET /api/products sin token debería responder 401", async () => {
    const res = await request(app).get("/api/products");
    expect(res.statusCode).toBe(401);
  });

  it("POST /api/products sin token debería responder 401", async () => {
    const res = await request(app)
      .post("/api/products")
      .send({ name: "Test", sku: "SKU-TEST", category: "Cat", price: 1000, stock: 1 });
    expect(res.statusCode).toBe(401);
  });
});