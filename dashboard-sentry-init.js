Sentry.init({
  dsn: 'YOUR_SENTRY_DSN', // TODO: Replace with your Sentry DSN
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
