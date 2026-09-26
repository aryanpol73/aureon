import fastify from 'fastify';
import pg from 'pg';
import { trace } from '@opentelemetry/api';
import { registerSpikeSse } from './sse-route.js';
import { API_VERSION } from '@aureon/contracts';

const app = fastify({
  logger: {
    level: 'info',
    formatters: {
      log(object) {
        const span = trace.getActiveSpan();
        if (span) {
          const spanContext = span.spanContext();
          return {
            ...object,
            trace_id: spanContext.traceId,
            span_id: spanContext.spanId,
          };
        }
        return object;
      },
    },
  },
});

const pool = new pg.Pool({
  connectionString: process.env.APP_URL ?? 'postgres://aureon_app:app_spike@localhost:5433/aureon_spike',
});

registerSpikeSse(app);

app.get('/api/v1/spike/db', async (req, reply) => {
  req.log.info({ apiVersion: API_VERSION }, 'Handling /api/v1/spike/db');
  const res = await pool.query('SELECT current_user, now()');
  return { status: 'ok', user: res.rows[0].current_user, now: res.rows[0].now };
});

app.get('/api/v1/health', async () => ({ status: 'healthy' }));

const port = Number(process.env.PORT ?? 3001);
app.listen({ port, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`[s3-api] listening on ${address}`);
});

// reload check
