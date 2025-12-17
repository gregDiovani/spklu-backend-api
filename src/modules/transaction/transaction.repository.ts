// modules/payment/payment.repository.ts
import { db } from "../../config/db";
import { callRpc } from "../../lib/pgrpc";

export class TransactionRepository {

  createTransaction(payload: unknown) {
    return callRpc("spklu.create_payment_transaction", [payload]);
  }

  updateTransaction(secret: string, payload: unknown) {
    return callRpc("spklu.update_payment_transaction", [secret, payload]);
  }

  getTransactionById(id: string) {
    return db.query(
      `SELECT transaction_id, merchant_id, amount, provider_ref
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
         SET provider_status = $1,
             provider_response = $2,
             updated_at = now()
         WHERE transaction_id = $3`,
        [params.providerStatus, params.payload, local.transaction_id]
      );

      // 4. audit status change
      await client.query(
        `INSERT INTO spklu.payment_transactions_audit
         (transaction_id, old_status, new_status, provider_event_id, provider_response, changed_by)
         VALUES ($1,$2,$3,$4,$5,'webhook')`,
        [
          local.transaction_id,
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
