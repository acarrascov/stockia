const request = require("supertest");
const app = require("../src/app");

describe("404", () => {
  it("ruta inexistente devuelve 404", async () => {
    const res = await request(app).get("/api/esto-no-existe");
    expect(res.statusCode).toBe(404);
    expect(res.body.ok).toBe(false);
  });
});
