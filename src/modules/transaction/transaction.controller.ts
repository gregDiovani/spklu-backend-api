import { FastifyReply, FastifyRequest } from 'fastify';
import { paymentService } from '../../container';
import { env } from '../../config/env';
import { XenditQrPaymentWebhook } from './webhook.type';
import { CreatePaymentDTO } from './dto/create-payment.dto';

function generateTransactionId(merchantId?: string) {
  if (!merchantId || typeof merchantId !== 'string' || !merchantId.trim()) {
    throw new Error('merchant_id is required for generating transaction id');
  }

  const cleanMerchantId = merchantId
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();

  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);

  return `TRANS-${cleanMerchantId}-${timestamp}-${random}`;
}

export async function createPayment(
  req: FastifyRequest<{
    Body: {
      merchant_id: string;
      amount: number;
      callback_url?: string;
      metadata?: Record<string, unknown>;
      transaction_id?: string;
      idempotency_key?: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const body = req.body;

    if (!body) {
      return reply.code(400).send({
        success: false,
        message: 'Request body is required',
      });
    }

    if (!body.merchant_id || typeof body.merchant_id !== 'string' || !body.merchant_id.trim()) {
      return reply.code(400).send({
        success: false,
        message: 'merchant_id is required',
      });
    }

    if (body.amount === undefined || body.amount === null) {
      return reply.code(400).send({
        success: false,
        message: 'amount is required',
      });
    }

    if (typeof body.amount !== 'number' || Number.isNaN(body.amount)) {
      return reply.code(400).send({
        success: false,
        message: 'amount must be a number',
      });
    }

    if (!Number.isInteger(body.amount)) {
      return reply.code(400).send({
        success: false,
        message: 'amount must be an integer',
      });
    }

    if (body.amount <= 0) {
      return reply.code(400).send({
        success: false,
        message: 'amount must be greater than 0',
      });
    }

    const transactionId =
      body.transaction_id && body.transaction_id.trim()
        ? body.transaction_id
        : generateTransactionId(body.merchant_id);

    const idempotencyKey =
      body.idempotency_key && body.idempotency_key.trim()
        ? body.idempotency_key
        : req.headers['idempotency-key']?.toString() ?? transactionId;

    const reqcallbackurl =
      body.callback_url && body.callback_url.trim()
        ? body.callback_url
        : `${env.BASE_URL}/transaction/webhook/xendit`;

    const dto: CreatePaymentDTO = {
      merchantId: body.merchant_id,
      amount: body.amount,
      callbackUrl: reqcallbackurl,
      metadata: body.metadata,
      transactionId,
      idempotencyKey,
    };

    const result = await paymentService.createPaymentQRIS(dto);

    return reply.code(200).send({
      success: true,
      transaction_id: transactionId,
      ...result,
    });
  } catch (error: any) {
    req.log.error(
      {
        err: error,
        body: req.body,
        headers: req.headers,
      },
      'Failed to create payment'
    );

    return reply.code(500).send({
      success: false,
      message: error?.message || 'Internal server error',
    });
  }
}

export async function getPayment(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const row = await paymentService.getPayment(req.params.id);
  if (!row) return reply.code(404).send({ success: false });
  return reply.send(row);
}


export async function webhookXendit(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    if (req.headers['x-callback-token'] !== env.XENDIT_WEBHOOK_SECRET) {
      return reply.code(401).send({ success: false });
    }

    const body = req.body as any;

    const transactionId =
      body?.qr_code?.external_id ??
      body?.data?.reference_id ??
      null;

    const providerRef =
      body?.qr_code?.id ??
      body?.data?.id ??
      null;

    const providerStatus =
      body?.status ??
      body?.data?.status ??
      null;

    const providerEventId =
      body?.id ??
      body?.data?.id ??
      null;

    if (!transactionId) {
      req.log.error({ body }, 'Missing transaction identifier in Xendit webhook');
      return reply.code(400).send({
        success: false,
        message: 'Missing transaction identifier',
      });
    }

    if (!providerStatus) {
      req.log.error({ body }, 'Missing provider status in Xendit webhook');
      return reply.code(400).send({
        success: false,
        message: 'Missing provider status',
      });
    }

    await paymentService.receiveWebhook({
      transactionId,
      providerRef,
      providerStatus,
      providerEventId,
      payload: body,
    });

    return reply.code(200).send({ success: true });
  } catch (err) {
    req.log.error({ err, body: req.body }, 'webhookXendit failed');
    return reply.code(500).send({
      success: false,
      message: 'Internal webhook error',
    });
  }
}




