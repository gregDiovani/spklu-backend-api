import { Prisma, PaymentStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { CreatePaymentDTO } from './dto/create-payment.dto';


export class TransactionRepository {
  findByIdempotencyKey(idempotencyKey: string) {
    return prisma.paymentTransaction.findFirst({
      where: {
        auditLogs: {
          some: {
            action: 'IDEMPOTENCY_REGISTERED',
            note: idempotencyKey,
          },
        },
      },
    });
  }

  async createTransaction(dto: CreatePaymentDTO, transactionId: string) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.paymentTransaction.create({
        data: {
          transaction_id: transactionId,
          merchant_id: dto.merchantId,
          amount: new Prisma.Decimal(dto.amount),
          provider: 'XENDIT',
          currency: 'IDR',
          payment_method: 'QRIS',
          status: PaymentStatus.CREATED,
          metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });

      await tx.paymentTransactionAudit.create({
        data: {
          transaction_id: transactionId,
          action: 'IDEMPOTENCY_REGISTERED',
          note: dto.idempotencyKey,
          performed_by: 'system',
          changed_by: 'system',
        },
      });

      return payment;
    });
  }
  async updateAfterProvider(input: {
    transactionId: string;
    providerRef: string;
    providerStatus: string;
    internalStatus: PaymentStatus;
    qrString?: string | null;
    providerResponse?: unknown;
  }) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.paymentTransaction.update({
        where: { transaction_id: input.transactionId },
        data: {
          provider_ref: input.providerRef,
          provider_status: input.providerStatus,
          qr_string: input.qrString,
          status: input.internalStatus,
        },
      });

      await tx.paymentTransactionAudit.create({
        data: {
          transaction_id: input.transactionId,
          action: 'PROVIDER_CREATE_SUCCESS',
          old_status: 'CREATED',
          new_status: input.internalStatus,
          payload: (input.providerResponse ?? null) as Prisma.InputJsonValue,
          performed_by: 'system',
          changed_by: 'system',
        },
      });

      return updated;
    });
  }

  async markProviderCreateFailed(transactionId: string, payload: unknown) {
    await prisma.paymentTransactionAudit.create({
      data: {
        transaction_id: transactionId,
        action: 'PROVIDER_CREATE_FAILED',
        old_status: 'CREATED',
        new_status: 'CREATED',
        payload: (payload ?? null) as Prisma.InputJsonValue,
        note: 'Failed to create QR at provider',
        performed_by: 'system',
        changed_by: 'system',
      },
    });
  }

  getTransactionById(id: string) {
    return prisma.paymentTransaction.findUnique({
      where: { transaction_id: id },
    });
  }

  buildEventKey(params: {
    providerName: string;
    providerEventId: string | null;
    transactionId: string | null;
    providerStatus?: string | null;
  }) {
    if (params.providerEventId) {
      return `${params.providerName}:${params.providerEventId}`;
    }

    return `${params.providerName}:${params.transactionId ?? 'unknown'}:${params.providerStatus ?? 'unknown'}`;
  }

  async saveWebhookEvent(params: {
    providerName: string;
    providerEventId: string | null;
    transactionId: string | null;
    providerStatus: string | null;
    payload: unknown;
  }) {
    const eventKey = this.buildEventKey({
      providerName: params.providerName,
      providerEventId: params.providerEventId,
      transactionId: params.transactionId,
      providerStatus: params.providerStatus,
    });

    return prisma.webhookEvent.upsert({
      where: {
        event_key: eventKey,
      },
      update: {},
      create: {
        provider_name: params.providerName,
        provider_event_id: params.providerEventId,
        event_key: eventKey,
        transaction_id: params.transactionId,
        payload: (params.payload ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async processWebhookUpdate(params: {
    transactionId: string | null;
    providerRef: string | null;
    providerStatus: string;
    payload: unknown;
    providerEventId: string | null;
    internalStatus: PaymentStatus;
    providerEventAt?: string | null;
  }) {
    const eventKey = this.buildEventKey({
      providerName: 'xendit',
      providerEventId: params.providerEventId,
      transactionId: params.transactionId,
      providerStatus: params.providerStatus,
    });

    return prisma.$transaction(async (tx) => {
      const payment = await tx.paymentTransaction.findFirst({
        where: {
          OR: [
            { transaction_id: params.transactionId ?? undefined },
            { provider_ref: params.providerRef ?? undefined },
          ],
        },
      });

      if (!payment) {
        return { skipped: true, reason: 'payment_not_found' };
      }

      if (payment.provider_status === params.providerStatus) {
        await tx.webhookEvent.updateMany({
          where: {
            event_key: eventKey,
            processed_at: null,
          },
          data: {
            processed_at: new Date(),
            process_error: null,
          },
        });

        return { skipped: true, reason: 'same_provider_status' };
      }

      const paidAt =
        params.internalStatus === PaymentStatus.PAID
          ? payment.paid_at ??
          (params.providerEventAt ? new Date(params.providerEventAt) : new Date())
          : payment.paid_at;

      const updated = await tx.paymentTransaction.update({
        where: { transaction_id: payment.transaction_id },
        data: {
          provider_status: params.providerStatus,
          status: params.internalStatus,
          paid_at: paidAt,
        },
      });

      await tx.paymentTransactionAudit.create({
        data: {
          transaction_id: payment.transaction_id,
          action: 'STATUS_UPDATE',
          old_status: payment.provider_status,
          new_status: params.providerStatus,
          provider_event_id: params.providerEventId,
          provider_response: (params.payload ?? null) as Prisma.InputJsonValue,
          changed_by: 'webhook',
          performed_by: 'webhook',
        },
      });

      await tx.webhookEvent.updateMany({
        where: {
          event_key: eventKey,
          processed_at: null,
        },
        data: {
          processed_at: new Date(),
          process_error: null,
        },
      });

      return updated;
    });
  }
  async enqueueReconcile(transactionId: string, reason: string, payload?: unknown) {
    return prisma.reconcileJob.create({
      data: {
        transaction_id: transactionId,
        reason,
        payload: (payload ?? null) as Prisma.InputJsonValue,
      },
    });
  }

  async touchLastChecked(transactionId: string) {
    return prisma.paymentTransaction.update({
      where: { transaction_id: transactionId },
      data: { last_checked_at: new Date() },
    });
  }

  async findPendingForReconcile(limit = 20) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    return prisma.paymentTransaction.findMany({
      where: {
        status: { in: [PaymentStatus.CREATED, PaymentStatus.PENDING] },
        created_at: { lt: fiveMinutesAgo },
        OR: [
          { last_checked_at: null },
          { last_checked_at: { lt: oneMinuteAgo } },
        ],
        provider_ref: { not: null },
      },
      orderBy: { created_at: 'asc' },
      take: limit,
    });
  }

  async createRetryJob(transactionId: string, errorMessage: string) {
    return prisma.paymentTransactionJob.upsert({
      where: { transaction_id: transactionId },
      update: {
        send_attempts: { increment: 1 },
        last_attempt_at: new Date(),
        last_error: errorMessage,
        next_retry_at: new Date(Date.now() + 60_000),
      },
      create: {
        transaction_id: transactionId,
        send_attempts: 1,
        last_attempt_at: new Date(),
        last_error: errorMessage,
        next_retry_at: new Date(Date.now() + 60_000),
      },
    });
  }
}