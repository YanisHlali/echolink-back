const request = require("supertest");
const app = require("../server");
const pool = require("../config/db");

jest.setTimeout(30000);

describe("Authentication API Tests", () => {
  let token = "";
  const testEmail = "test@email.com";

  beforeEach(async () => {
    await pool.query("DELETE FROM users WHERE email = ?", [testEmail]);
  });

  it("User registration", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        email: testEmail,
        name: "John",
        lastName: "Doe",
        password: "mypassword",
        longitude: 2.3522,
        latitude: 48.8566
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("User successfully registered");
  });

  it("User login", async () => {
    await request(app).post("/auth/register").send({
      email: testEmail,
      name: "John",
      lastName: "Doe",
      password: "mypassword",
      longitude: 2.3522,
      latitude: 48.8566
    });

    const res = await request(app)
      .post("/auth/login")
      .send({
        email: testEmail,
        password: "mypassword"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    token = res.body.token;
  });

  it("Retrieve logged-in user info", async () => {
    await request(app).post("/auth/register").send({
      email: testEmail,
      name: "John",
      lastName: "Doe",
      password: "mypassword",
      longitude: 2.3522,
      latitude: 48.8566
    });

    const loginRes = await request(app).post("/auth/login").send({
      email: testEmail,
      password: "mypassword"
    });

    token = loginRes.body.token;

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("email", testEmail);
  });

  afterEach(async () => {
    await pool.query("DELETE FROM users WHERE email = ?", [testEmail]);
  });

  afterAll(async () => {
    await pool.end();
  });
});
