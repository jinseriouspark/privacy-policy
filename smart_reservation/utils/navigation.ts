/**
 * Navigation utilities for manual routing
 * Dispatches custom 'navigate' event to trigger React re-renders
 */

export function navigateTo(url: string) {
  window.history.pushState({}, '', url);
  window.dispatchEvent(new Event('navigate'));
}

export function replaceTo(url: string) {
  window.history.replaceState({}, '', url);
  window.dispatchEvent(new Event('navigate'));
}
