/**
 * Browser error monitoring. The Sentry SDK is only downloaded when NEXT_PUBLIC_SENTRY_DSN is set,
 * so it adds nothing to the bundle otherwise.
 */
type RouterTransitionHook = (href: string, navigationType: string) => void;

let transitionHook: RouterTransitionHook | undefined;

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  void import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({ dsn, environment: process.env.NODE_ENV, tracesSampleRate: 0.1 });
    transitionHook = Sentry.captureRouterTransitionStart;
  });
}

export function onRouterTransitionStart(href: string, navigationType: string) {
  transitionHook?.(href, navigationType);
}
