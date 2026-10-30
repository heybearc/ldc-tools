const AIRGAPPED = ['bethel.jw.org', 'jwpub.org'];

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
