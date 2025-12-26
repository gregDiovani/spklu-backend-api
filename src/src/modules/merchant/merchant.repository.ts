// modules/merchant/merchant.repository.ts
import { db } from "../../config/db";
import { callRpc } from "../../lib/pgrpc";

export class MerchantRepository {
  create(payload: any, callerId: string) {
    return callRpc("spklu.create_merchant", [payload, callerId]);
  }

  getMyMerchants(callerId: string, limit: number, page: number) {
    return callRpc("spklu.get_my_merchants", [callerId, limit, page]);
  }

  update(merchantId: string, payload: any, callerId: string) {
    return callRpc("spklu.update_merchant", [merchantId, payload, callerId]);
  }

  delete(merchantId: string, callerId: string) {
    return callRpc("spklu.delete_merchant", [merchantId, callerId]);
  }

  forceDelete(merchantId: string, callerId: string) {
    return callRpc("spklu.force_delete_merchant", [merchantId, callerId]);
  }

  async getDashboard(userId: string) {
    const [
      merchants,
      chargers,
      monthlyRevenueChart,
      chargerStatus,
      revenueSummary,
    ] = await Promise.all([
      db.query(`SELECT spklu.get_total_active_merchants_by_user($1) AS value`, [userId]),
      db.query(`SELECT spklu.get_total_active_chargers_by_user($1) AS value`, [userId]),
      db.query(`SELECT spklu.get_monthly_revenue_chart_by_user($1) AS result`, [userId]),
      db.query(`SELECT spklu.get_charger_status_distribution($1) AS result`, [userId]),
      db.query(`SELECT spklu.get_monthly_revenue_summary_by_user($1) AS result`, [userId]),
    ]);

    return {
      merchants,
      chargers,
      monthlyRevenueChart,
      chargerStatus,
      revenueSummary,
    };
  }

  getTransactions(merchantId: string) {
    return db.query(
      `SELECT * FROM spklu.payment_transactions
       WHERE merchant_id = $1
       ORDER BY created_at DESC`,
      [merchantId]
    );
  }

  getChargers(merchantId: string) {
    return db.query(
      `SELECT *
       FROM spklu.merchant_chargers
       WHERE merchant_id = $1
         AND deleted_at IS NULL`,
      [merchantId]
    );
  }

  createCharger(payload: any) {
    return callRpc("spklu.create_merchant_charger", [payload]);
  }

  updateCharger(chargerId: string, payload: any) {
    return callRpc("spklu.update_merchant_charger", [chargerId, payload]);
  }

  deleteCharger(payload: any) {
    return callRpc("spklu.delete_merchant_charger_v2", [payload]);
  }
}
