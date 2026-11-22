import { expect, test } from '@playwright/test';
import { buildAdminNotification, buildCustomerAcknowledgement } from '../lib/enquiry-email';
import type { EnquiryInput } from '../lib/enquiries';

const enquiry: EnquiryInput = {
  id: 'email-test-id',
  reference: 'DIN-EMAIL-TEST',
  createdAt: '2026-11-01T00:00:00.000Z',
  status: 'new',
  name: '<script>alert("name")</script>',
  phone: '+234 701 717 6611',
  email: 'customer@example.com',
  location: 'Ile-Ife',
  projectType: 'TV Feature Wall',
  design: 'white-marble-walnut-tv-wall',
  preferredContact: 'Email',
  message: 'First line\n<img src=x onerror=alert("message")>',
};

test('Gmail templates preserve enquiry details and escape user-supplied HTML', () => {
  const notification = buildAdminNotification(enquiry);
  expect(notification.subject).toBe('New enquiry DIN-EMAIL-TEST — TV Feature Wall');
  expect(notification.text).toContain('customer@example.com');
  expect(notification.text).toContain('First line\n<img src=x');
  expect(notification.html).toContain('DIN-EMAIL-TEST');
  expect(notification.html).toContain('&lt;script&gt;');
  expect(notification.html).toContain('First line<br />&lt;img src=x');
  expect(notification.html).not.toContain('<script>');
  expect(notification.html).not.toContain('<img src=x');

  const acknowledgement = buildCustomerAcknowledgement(enquiry);
  expect(acknowledgement.subject).toBe('Do It Now enquiry received — DIN-EMAIL-TEST');
  expect(acknowledgement.text).toContain('DIN-EMAIL-TEST');
  expect(acknowledgement.html).toContain('&lt;script&gt;');
  expect(acknowledgement.html).not.toContain('<script>');
  expect(acknowledgement.html).toContain('+234 701 717 6611');
  expect(acknowledgement.html).toContain('https://wa.me/2347017176611');
});
