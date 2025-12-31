import request from "supertest";
import { buildApp } from "../src/app";
import { db } from "../src/config/db";
import { redis } from "../src/config/redis";
import axios from "axios";

let app : any;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

beforeEach(async () => {
  await redis.flushall();
  await db.query("TRUNCATE spklu.payment_transactions CASCADE");
  await db.query("TRUNCATE spklu.payment_transactions_audit CASCADE");
});

afterAll(async () => {
  await app.close();
  await db.end();
  await redis.quit();
});


it("FULL FLOW: create transaction → webhook updates status", async () => {

  // =============================
  // 1️⃣ CREATE PAYMENT VIA API
  // =============================
  const create = await request(app.server)
    .post("/transaction/payments")
    .send({
        "type": "DYNAMIC",
        "merchant_id": "MRC-000004",
        "currency": "IDR",
        "callback_url": "https://1c1dd4eaccd9.ngrok-free.app/transaction/webhook/xendit", 
        "amount": 75000
        });

  expect(create.status).toBe(200);

  const txId = create.body.transaction_id;
  expect(txId).toBeDefined();


  // pastikan status awal
  const before = await db.query(`
    SELECT status, provider_status
    FROM spklu.payment_transactions
    WHERE transaction_id = $1
  `, [txId]);

  expect(before.rows[0].status).toBe("PENDING");
  expect(before.rows[0].provider_status).toBe("ACTIVE");


  // =============================
  // 2️⃣ SIMULATE WEBHOOK XENDIT
  // =============================

 const webhook =await axios.post(
    `https://api.xendit.co/qr_codes/${txId}/payments/simulate`,
    {},

    
    {
    headers: {
      Authorization: `Basic eG5kX2RldmVsb3BtZW50X09odDBMSmdRZ0dlalVsbXQ4WnlQVjZ6Skw2ZHRPZWg0R2R2c1d1UWJtTm4zUUFYY0Jvb3ViUHVNQVRoS3M6`,
      "Content-Type": "application/json"
    }
  }
  );

  // 3. wait sebentar karena webhook async
  await new Promise(r => setTimeout(r, 1500));

  
  expect(webhook.status).toBe(200);


  // =============================
  // 3️⃣ ASSERT DB UPDATED
  // =============================
  const after = await db.query(`
    SELECT status, provider_status
    FROM spklu.payment_transactions
    WHERE transaction_id = $1
  `, [txId]);

  expect(after.rows[0].provider_status).toBe("COMPLETED");
  expect(after.rows[0].status).toBe("PAID");




});
