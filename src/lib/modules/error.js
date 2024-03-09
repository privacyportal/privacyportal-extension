import browser from 'webextension-polyfill';
import { crypto } from './crypto';

export const DEFAULT_ERROR_ACTION = 'Please try again later.';

export class CustomError extends Error {
  constructor({ message, notification_id = undefined }) {
    super(message);
    if (notification_id) Object.defineProperty(this, 'notification_id', { value: notification_id });
  }
}

export function displayError(err) {
  if (err instanceof CustomError) {
    const notificationId = err?.notification_id || crypto.randomUUID();
    browser.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: '/favicons/icon-48.png',
      title: 'Privacy Portal Extension',
      message: err.message,
      priority: 2
    });

    setTimeout(() => browser.notifications.clear(notificationId), 20_000);
  }
}
