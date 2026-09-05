'use strict';
/**
 * utils/mailer.js — the single gate every outbound MIMS email passes through.
 *
 * Set by Rohith 2026-09-05: MIMS is not to send warning or alert mail. Outbound
 * email is OFF unless MIMS_OUTBOUND_EMAIL is explicitly set to on/true/1.
 *
 * Every caller builds its transport here instead of calling
 * nodemailer.createTransport() directly, so one switch covers all of them.
 *
 * A blocked send THROWS rather than resolving quietly. Callers already catch a
 * send failure and write it to the audit trail; resolving silently would record
 * "Sent" for mail that never left the machine, which is a false record in a
 * regulated system. Same reason verify() throws: a Test SMTP button that
 * reports success without testing anything is worse than one that fails.
 */
const nodemailer = require('nodemailer');

const OFF_MESSAGE =
  'Outbound email is disabled (MIMS_OUTBOUND_EMAIL is not on). No mail was sent.';

function outboundEmailEnabled() {
  const raw = String(process.env.MIMS_OUTBOUND_EMAIL || '').trim().toLowerCase();
  return raw === 'on' || raw === 'true' || raw === '1';
}

function blockedTransport() {
  return {
    async sendMail(message) {
      console.warn(
        '[MIMS Mail] BLOCKED — to=%s subject=%s',
        message?.to || '(none)',
        message?.subject || '(none)'
      );
      throw new Error(OFF_MESSAGE);
    },
    async verify() {
      throw new Error(OFF_MESSAGE);
    },
    close() {},
  };
}

function createTransport(options) {
  return outboundEmailEnabled() ? nodemailer.createTransport(options) : blockedTransport();
}

module.exports = { createTransport, outboundEmailEnabled, OFF_MESSAGE };
