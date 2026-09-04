import crypto from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 — these get read aloud over phones

/** Produces codes like DA-7K4XQP. */
export const generateTrackingCode = () => {
  const bytes = crypto.randomBytes(6);
  const body = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
  return `DA-${body}`;
};
