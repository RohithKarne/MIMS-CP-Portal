'use strict';
// Rohith, 2026-09-05: MIMS must not send warning or alert mail. utils/mailer.js is
// the one gate every outbound email passes through. These tests hold that gate shut
// by default, and prove a blocked send is reported as a failure rather than being
// swallowed — a silent "sent" would put a false record in the audit trail.

const mockCreateTransport = jest.fn(() => ({ sendMail: jest.fn(), verify: jest.fn() }));
jest.mock('nodemailer', () => ({ createTransport: (...args) => mockCreateTransport(...args) }), { virtual: true });

const mailer = require('../utils/mailer');

const SMTP = { host: 'smtp.example.com', port: 587 };

beforeEach(() => {
  mockCreateTransport.mockClear();
  delete process.env.MIMS_OUTBOUND_EMAIL;
});

describe('outbound email gate', () => {
  test('is closed when MIMS_OUTBOUND_EMAIL is unset', () => {
    expect(mailer.outboundEmailEnabled()).toBe(false);
  });

  test('never builds a real SMTP transport while closed', () => {
    mailer.createTransport(SMTP);
    expect(mockCreateTransport).not.toHaveBeenCalled();
  });

  test('a send while closed fails loudly instead of reporting success', async () => {
    const transport = mailer.createTransport(SMTP);
    await expect(
      transport.sendMail({ to: 'someone@gmail.com', subject: 'Expiry alert' })
    ).rejects.toThrow(/Outbound email is disabled/);
  });

  test('a connection test while closed does not claim the connection works', async () => {
    const transport = mailer.createTransport(SMTP);
    await expect(transport.verify()).rejects.toThrow(/Outbound email is disabled/);
  });

  test.each(['on', 'true', '1', 'ON'])('opens on MIMS_OUTBOUND_EMAIL=%s', (value) => {
    process.env.MIMS_OUTBOUND_EMAIL = value;
    mailer.createTransport(SMTP);
    expect(mailer.outboundEmailEnabled()).toBe(true);
    expect(mockCreateTransport).toHaveBeenCalledWith(SMTP);
  });

  test.each(['off', 'false', '0', '', 'yes'])('stays closed on MIMS_OUTBOUND_EMAIL=%s', (value) => {
    process.env.MIMS_OUTBOUND_EMAIL = value;
    mailer.createTransport(SMTP);
    expect(mailer.outboundEmailEnabled()).toBe(false);
    expect(mockCreateTransport).not.toHaveBeenCalled();
  });
});

describe('no service reaches nodemailer directly', () => {
  const { execSync } = require('child_process');

  test('every createTransport call site goes through utils/mailer', () => {
    const hits = execSync(
      "grep -rn \"nodemailer.createTransport\" --exclude-dir=node_modules --exclude-dir=tests . || true",
      { cwd: `${__dirname}/..`, encoding: 'utf8' }
    ).trim();
    const offenders = hits
      .split('\n')
      .filter(Boolean)
      .filter((line) => !line.startsWith('./utils/mailer.js:'));
    expect(offenders).toEqual([]);
  });
});
