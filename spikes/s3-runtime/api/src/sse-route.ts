import type { FastifyInstance } from 'fastify';

export function registerSpikeSse(app: FastifyInstance): void {
  app.get('/api/v1/spike/sse', (req, reply) => {
    reply.hijack(); // we own the raw response from here on
    reply.raw.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      'connection': 'keep-alive',
      'x-accel-buffering': 'no',
    });
    let n = 0;
    const timer = setInterval(() => {
      reply.raw.write(`id: ${n}\ndata: ${Date.now()}\n\n`);
      if (++n === 20) {
        clearInterval(timer);
        reply.raw.end();
      }
    }, 250);
    req.raw.on('close', () => clearInterval(timer));
  });
}
