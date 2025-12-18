const request = require("supertest");
const app = require("../src/app");

describe("Health", () => {
  it("GET /api/health sin token debería responder 401", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(401);
  });
});