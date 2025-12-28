import request from "supertest";
import { buildApp } from "../src/app";

let app: any;


beforeAll(async () => {
  app = await buildApp();
  await app.ready();   // ⬅ WAJIB
});

afterAll(async () => {
  await app.close();
});


it("login success returns token", async () => {
  const res = await request(app.server)
    .post("/auth/login")
    .set("Content-Type", "application/json")
    .send({
      username: "ELBSuperUser",
      password: "SPKLU2025",
    });



  expect(res.status).toBe(200);
  expect(res.body.tokens.accessToken).toBeDefined();
});

it("rejects wrong password", async () => {
  const res = await request(app.server)
    .post("/auth/login")
        .set("Content-Type", "application/json")

    .send({
      email: "user@test.com",
      password: "wrong",
    });

  expect(res.status).toBe(400);
});

it("allows access with valid token", async () => {
  const login = await request(app.server)
    .post("/auth/login")
    .set("Content-Type", "application/json")

    .send({
        username: "ELBSuperUser",
      password: "SPKLU2025",
    });

  const res = await request(app.server)
    .get("/auth/me")
            .set("Content-Type", "application/json")


    .set("Authorization", `Bearer ${login.body.tokens.accessToken}`);

  expect(res.status).toBe(200);
  expect(res.body.user.username).toBe("ELBSuperUser");
});

it("rejects invalid token", async () => {
  const res = await request(app.server)
    .get("/auth/me")
    .set("Authorization", "Bearer SALAH");

  expect(res.status).toBe(401);
});
