import React from "react";
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router";
import * as Sentry from "@sentry/react";

const numberOr = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const dsn = import.meta.env.VITE_SENTRY_DSN;
const tracesSampleRate = numberOr(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE, 0.2);
const replaysSessionSampleRate = numberOr(
  import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
  0.1,
);
const replaysOnErrorSampleRate = numberOr(
  import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
  1.0,
);

const tracePropagationTargets: Array<string | RegExp> = ["localhost"];
if (import.meta.env.VITE_API_URL) {
  tracePropagationTargets.push(import.meta.env.VITE_API_URL);
}

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_APP_VERSION,
  sendDefaultPii: true,
  integrations: [
    Sentry.reactRouterV7BrowserTracingIntegration({
      useEffect: React.useEffect,
      useLocation,
      useNavigationType,
      matchRoutes,
      createRoutesFromChildren,
    }),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate,
  tracePropagationTargets,
  replaysSessionSampleRate,
  replaysOnErrorSampleRate,
  enableLogs: true,
});
