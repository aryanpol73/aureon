// spikes/s3-runtime/api/src/instrumentation.ts: loaded with `--import` before the app
import { register } from 'node:module';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

try {
  register('@opentelemetry/instrumentation/hook.mjs', import.meta.url); // ESM module patching
} catch (e) {
  console.warn('[otel] ESM hook registration:', e);
}

const sdk = new NodeSDK({
  traceExporter: new ConsoleSpanExporter(),
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start();
