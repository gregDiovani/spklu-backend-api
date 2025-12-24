// modules/payment/payment.repository.ts
import { db } from "../../config/db";
import { callRpc } from "../../lib/pgrpc";
import { mapProviderToInternalStatus } from "./helper.transcation";

export class TransactionRepository {

  createTransaction(payload: unknown) {
    return callRpc("spklu.create_payment_transaction", [payload]);
  }

  updateTransaction(secret: string, payload: unknown) {
    return callRpc("spklu.update_payment_transaction", [secret, payload]);
  }

  async insertToAuditTransaction(input: {
    transaction_id: string;
    action: string;
    old_status?: string | null;
    new_status?: string | null;
    payload?: unknown;
    provider_event_id?: string | null;
    provider_response?: unknown;
    note?: string | null;
    performed_by?: "system" | "webhook" | "admin";
    changed_by?: "system" | "webhook" | "admin";
  }) {
    const {
      transaction_id,
      action,
      old_status = null,
      new_status = null,
      payload = null,
      provider_event_id = null,
      provider_response = null,
      note = null,
      performed_by = "system",
      changed_by = performed_by,
    } = input;

    await db.query(
      `
    INSERT INTO spklu.payment_transactions_audit
    (
      transaction_id,
      action,
      payload,
      performed_by,
      performed_at,
      note,
      old_status,
      new_status,
      provider_event_id,
      provider_response,
      changed_by,
      created_at
    )
    VALUES
    (
      $1,$2,$3,$4,now(),$5,$6,$7,$8,$9,$10,now()
    )
    `,
      [
        transaction_id,
        action,
        payload,
        performed_by,
        note,
        old_status,
        new_status,
        provider_event_id,
        provider_response,
        changed_by,
      ]
    );
  }

  getTransactionById(id: string) {
    return db.query(
      `SELECT transaction_id, provider_status, amount
       FROM spklu.payment_transactions
       WHERE transaction_id = $1
       LIMIT 1`,
      [id]
    );
  }

  /* =========================
     WEBHOOK HANDLER (FULL DB)
  ========================= */
  async processWebhookUpdate(params: {
    externalId: string | null;
    providerRef: string | null;
    providerStatus: string;
    payload: unknown;
    providerEventId: string | null;
  }) {
    const client = await db.connect();
    try {
      // 1. audit raw event
      try {
        await client.query(
          `INSERT INTO spklu.webhook_events
           (provider_name, provider_event_id, transaction_id, payload)
           VALUES ($1,$2,$3,$4)`,
          ["xendit", params.providerEventId, params.externalId, params.payload]
        );
      } catch {
        // ignore duplicate
      }

      // 2. lock transaction row
      await client.query("BEGIN");

      const { rows } = await client.query(
        `SELECT transaction_id, provider_status
         FROM spklu.payment_transactions
         WHERE transaction_id = $1 OR provider_ref = $2
         LIMIT 1
         FOR UPDATE`,
        [params.externalId, params.providerRef]
      );

      if (!rows.length) {
        await client.query("COMMIT");
        return { skipped: true };
      }

      const local = rows[0];
      const oldStatus = (local.provider_status ?? "").toString().trim();

      if (oldStatus === params.providerStatus) {
        await client.query("COMMIT");
        return { skipped: true };
      }




      // 3. update transaction
      await client.query(
        `UPDATE spklu.payment_transactions
   SET
     provider_status = $1,
     status = COALESCE($2, status),
     updated_at = now()
   WHERE transaction_id = $3`,
        [
          params.providerStatus,
          mapProviderToInternalStatus(params.providerStatus),
          local.transaction_id,
        ]
      );

      // 4. audit status change
      await client.query(
        `INSERT INTO spklu.payment_transactions_audit
   (
     transaction_id,
     action,
     old_status,
     new_status,
     provider_event_id,
     provider_response,
     changed_by
   )
   VALUES ($1,$2,$3,$4,$5,$6,'webhook')`,
        [
          local.transaction_id,
          "STATUS_UPDATE",          // ✅ action (WAJIB)
          oldStatus,
          params.providerStatus,
          params.providerEventId,
          params.payload,
        ]
      );

      await client.query("COMMIT");

      return {
        success: true,
        transaction_id: local.transaction_id,
        provider_status: params.providerStatus,
      };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
}
