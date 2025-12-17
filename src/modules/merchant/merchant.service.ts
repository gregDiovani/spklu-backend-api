// modules/merchant/merchant.service.ts
import { MerchantRepository } from "./merchant.repository";

export class MerchantService {
  constructor(private repo: MerchantRepository) { }

  create(data: any, callerId: string) {
    return this.repo.create(data, callerId);
  }

  getMyMerchants(callerId: string, limit: number, page: number) {
    return this.repo.getMyMerchants(callerId, limit, page);
  }

  update(id: string, data: any, callerId: string) {
    return this.repo.update(id, data, callerId);
  }

  delete(id: string, callerId: string) {
    return this.repo.delete(id, callerId);
  }

  forceDelete(id: string, callerId: string) {
    return this.repo.forceDelete(id, callerId);
  }

  async dashboard(userId: string) {
    const r = await this.repo.getDashboard(userId);

    return {
      success: true,
      summary: {
        totalMerchants: r.merchants.rows[0]?.value ?? 0,
        activeChargers: r.chargers.rows[0]?.value ?? 0,
        revenue: r.revenueSummary.rows[0]?.result,
      },
      charts: {
        monthlyRevenue: r.monthlyRevenueChart.rows[0]?.result?.data ?? [],
        chargerStatus: r.chargerStatus.rows[0]?.result?.data ?? [],
      },
    };
  }

  async transactions(merchantId: string) {
    const { rows } = await this.repo.getTransactions(merchantId);
    if (!rows.length) throw new Error("not found");
    return rows;
  }

  async chargers(merchantId: string) {
    const { rows } = await this.repo.getChargers(merchantId);
    return rows;
  }

  createCharger(payload: any) {
    return this.repo.createCharger(payload);
  }

  updateCharger(id: string, payload: any) {
    return this.repo.updateCharger(id, payload);
  }

  deleteCharger(payload: any) {
    return this.repo.deleteCharger(payload);
  }
}
