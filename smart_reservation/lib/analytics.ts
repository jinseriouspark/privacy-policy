/**
 * Google Analytics 4 Integration
 * Tracks page views, events, and user interactions
 */

import ReactGA from 'react-ga4';

// Google Analytics Measurement ID
// TODO: Replace with your actual GA4 Measurement ID (format: G-XXXXXXXXXX)
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

/**
 * Initialize Google Analytics
 * Call this once when the app starts
 */
export const initGA = () => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.initialize(GA_MEASUREMENT_ID, {
      gaOptions: {
        // Add any additional GA configuration here
        anonymizeIp: true, // Anonymize IP addresses for privacy
      },
    });
    console.log('[Analytics] Google Analytics initialized');
  } else {
    console.warn('[Analytics] GA Measurement ID not set. Analytics disabled.');
  }
};

/**
 * Track page views
 * @param path - Page path (e.g., '/summary', '/class')
 * @param title - Page title
 */
export const trackPageView = (path: string, title?: string) => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.send({
    hitType: 'pageview',
    page: path,
    title: title || document.title,
  });

  console.log('[Analytics] Page view tracked:', path);
};

/**
 * Track custom events
 * @param category - Event category (e.g., 'User', 'Booking', 'Payment')
 * @param action - Event action (e.g., 'Login', 'Create Reservation', 'Purchase')
 * @param label - Event label (optional)
 * @param value - Event value (optional)
 */
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event({
    category,
    action,
    label,
    value,
  });

  console.log('[Analytics] Event tracked:', { category, action, label, value });
};

/**
 * Predefined event trackers for common actions
 */
export const analytics = {
  // User events
  login: (method: 'google' | 'email') => {
    trackEvent('User', 'Login', method);
  },

  logout: () => {
    trackEvent('User', 'Logout');
  },

  signup: (userType: 'instructor' | 'student') => {
    trackEvent('User', 'Signup', userType);
  },

  selectAccountType: (type: 'instructor' | 'student') => {
    trackEvent('User', 'Select Account Type', type);
  },

  // Coaching events
  createCoaching: (coachingId: string) => {
    trackEvent('Coaching', 'Create', coachingId);
  },

  deleteCoaching: (coachingId: string) => {
    trackEvent('Coaching', 'Delete', coachingId);
  },

  connectCalendar: (coachingId: string) => {
    trackEvent('Coaching', 'Connect Calendar', coachingId);
  },

  // Reservation events
  createReservation: (coachingType: 'private' | 'group') => {
    trackEvent('Reservation', 'Create', coachingType);
  },

  cancelReservation: (coachingType: 'private' | 'group') => {
    trackEvent('Reservation', 'Cancel', coachingType);
  },

  // Package events
  createPackage: (packageType: string) => {
    trackEvent('Package', 'Create', packageType);
  },

  deletePackage: (packageType: string) => {
    trackEvent('Package', 'Delete', packageType);
  },

  // Invitation events
  sendInvitation: () => {
    trackEvent('Invitation', 'Send');
  },

  acceptInvitation: () => {
    trackEvent('Invitation', 'Accept');
  },

  // Dashboard events
  viewTab: (tabName: string) => {
    trackEvent('Dashboard', 'View Tab', tabName);
  },

  // Share events
  copyShareLink: (linkType: 'coaching' | 'invitation') => {
    trackEvent('Share', 'Copy Link', linkType);
  },
};
