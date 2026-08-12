import amqp, { Channel, Options } from 'amqplib';
import { getLogger } from '@packages/logger';
import { ExternalServiceError } from '@packages/errors';

// Use return type of amqp.connect
type RabbitMQConnection = Awaited<ReturnType<typeof amqp.connect>>;

let connection: RabbitMQConnection | null = null;
let channel: Channel | null = null;

export async function connectRabbitMQ(): Promise<{ connection: RabbitMQConnection; channel: Channel }> {
  const logger = getLogger();
  if (connection && channel) {
    return { connection, channel };
  }

  const rabbitmqUrl = process.env['RABBITMQ_URL'] || 'amqp://guest:guest@localhost:5672';
  try {
    const conn = await amqp.connect(rabbitmqUrl);
    const ch = await conn.createChannel();

    connection = conn;
    channel = ch;

    conn.on('error', (err) => {
      logger.error({ err }, 'RabbitMQ connection error');
    });

    conn.on('close', () => {
      logger.warn('RabbitMQ connection closed');
      connection = null;
      channel = null;
    });

    logger.info('Successfully connected to RabbitMQ');
    return { connection: conn, channel: ch };
  } catch (error) {
    logger.error({ error }, 'Failed to connect to RabbitMQ');
    throw new ExternalServiceError('Failed to establish RabbitMQ connection', error);
  }
}

export async function disconnectRabbitMQ(): Promise<void> {
  const logger = getLogger();
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    logger.info('Disconnected from RabbitMQ');
  } catch (error) {
    logger.error({ error }, 'Error disconnecting from RabbitMQ');
  }
}

export async function pingRabbitMQ(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const { channel: ch } = await connectRabbitMQ();
    await ch.checkExchange('amq.direct');
    const latencyMs = Date.now() - start;
    return { ok: true, latencyMs };
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { ok: false, latencyMs, error: errorMsg };
  }
}

export interface PublishOptions {
  exchange: string;
  routingKey: string;
  message: unknown;
  correlationId?: string;
  persistent?: boolean;
}

export class EventPublisher {
  public async publish(options: PublishOptions): Promise<boolean> {
    const logger = getLogger();
    const { channel: ch } = await connectRabbitMQ();

    const content = Buffer.from(JSON.stringify(options.message));
    const publishOptions: Options.Publish = {
      persistent: options.persistent ?? true,
      ...(options.correlationId ? { correlationId: options.correlationId } : {}),
      contentType: 'application/json',
      timestamp: Date.now(),
    };

    const success = ch.publish(options.exchange, options.routingKey, content, publishOptions);
    logger.debug({ exchange: options.exchange, routingKey: options.routingKey }, 'Published event to RabbitMQ');
    return success;
  }
}

export interface ConsumeOptions {
  queue: string;
  onMessage: (message: unknown, ack: () => void, nack: (requeue?: boolean) => void) => Promise<void>;
  prefetch?: number;
}

export class EventConsumer {
  public async consume(options: ConsumeOptions): Promise<void> {
    const logger = getLogger();
    const { channel: ch } = await connectRabbitMQ();

    if (options.prefetch) {
      await ch.prefetch(options.prefetch);
    }

    await ch.consume(options.queue, async (msg) => {
      if (!msg) return;

      const ack = () => ch.ack(msg);
      const nack = (requeue = false) => ch.nack(msg, false, requeue);

      try {
        const contentStr = msg.content.toString('utf-8');
        const parsedData = JSON.parse(contentStr);
        await options.onMessage(parsedData, ack, nack);
      } catch (err) {
        logger.error({ err, queue: options.queue }, 'Error handling RabbitMQ message');
        nack(false);
      }
    });
  }
}
