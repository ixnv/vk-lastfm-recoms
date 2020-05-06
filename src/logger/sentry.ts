import * as Sentry from '@sentry/browser'

export const sentryError = (extra: object, exception = null) => {
  Sentry.withScope(scope => {
    scope.setExtras(extra)
    if (exception) {
      Sentry.captureException(exception)
    }
  })
}
