const AIRGAPPED = ['bethel.jw.org', 'jwpub.org'];
const UNDELIVERABLE_HOSTS = new Set(['example.com', 'example.org', 'example.net']);
const UNDELIVERABLE_SUFFIXES = ['.local', '.localhost', '.test', '.invalid', '.example', '.lan'];

export function emailHost(email: string): string {
  return email.split('@')[1]?.trim().toLowerCase() || '';
}

export function isAirgappedEmail(email: string | null | undefined): boolean {
  const host = emailHost(email || '');
  if (!host) return false;
  return AIRGAPPED.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

export function canEmailAddress(email: string | null | undefined, notify = true): boolean {
  if (!notify || !email) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  return !isAirgappedEmail(email);
}

/** Addresses the public mail system will reject. Stored contacts can still use them. */
export function isDeliverableEmail(email: string | null | undefined): boolean {
  if (!canEmailAddress(email)) return false;
  const host = emailHost(email || '');
  if (UNDELIVERABLE_HOSTS.has(host)) return false;
  return !UNDELIVERABLE_SUFFIXES.some((suffix) => host === suffix.slice(1) || host.endsWith(suffix));
}
