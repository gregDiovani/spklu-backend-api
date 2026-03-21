import { PaymentStatus } from '@prisma/client';

export function mapProviderToInternalStatus(status: string): PaymentStatus {
  const s = String(status || '').toUpperCase();
  switch (s) {
    case 'ACTIVE':
    case 'PENDING':
      return PaymentStatus.PENDING;
    case 'SUCCEEDED':
    case 'COMPLETED':
      return PaymentStatus.PAID;
    case 'EXPIRED':
      return PaymentStatus.EXPIRED;
    case 'FAILED':
      return PaymentStatus.FAILED;
    default:
      return PaymentStatus.PENDING;
  }
}
