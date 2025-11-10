// Simple analytics tracking utility
// Can be extended to integrate with Google Analytics, Mixpanel, etc.

type EventType = 
  | 'page_view'
  | 'button_click'
  | 'form_submit'
  | 'report_view'
  | 'bill_upload'
  | 'dispute_filed'
  | 'reimbursement_request'
  | 'provider_search';

interface AnalyticsEvent {
  type: EventType;
  page?: string;
  action?: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

class Analytics {
  private enabled: boolean;

  constructor() {
    // Enable analytics in production
    this.enabled = import.meta.env.PROD;
  }

  track(event: AnalyticsEvent) {
    if (!this.enabled) {
      console.log('Analytics (dev):', event);
      return;
    }

    // Log to console for now - can be extended to send to analytics service
    console.log('Analytics:', event);

    // Future: Send to analytics service
    // Example: gtag('event', event.type, { ...event });
  }

  pageView(page: string) {
    this.track({
      type: 'page_view',
      page,
      metadata: {
        timestamp: new Date().toISOString(),
        path: window.location.pathname,
      },
    });
  }

  clickEvent(action: string, label?: string, value?: number) {
    this.track({
      type: 'button_click',
      action,
      label,
      value,
      page: window.location.pathname,
    });
  }

  reportView(reportType: string) {
    this.track({
      type: 'report_view',
      action: reportType,
      page: '/reports',
    });
  }

  billUpload(amount: number, category?: string) {
    this.track({
      type: 'bill_upload',
      value: amount,
      metadata: { category },
    });
  }

  disputeFiled(amount: number, provider?: string) {
    this.track({
      type: 'dispute_filed',
      value: amount,
      metadata: { provider },
    });
  }

  reimbursementRequest(amount: number) {
    this.track({
      type: 'reimbursement_request',
      value: amount,
    });
  }

  providerSearch(query: string) {
    this.track({
      type: 'provider_search',
      action: 'search',
      label: query,
    });
  }
}

export const analytics = new Analytics();
