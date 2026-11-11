import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

export interface PhoneValidationResult {
  isValid: boolean;
  formatted?: string;
  international?: string;
  national?: string;
  error?: string;
}

/**
 * Validates and formats a phone number
 * @param phoneNumber - The phone number to validate
 * @param defaultCountry - Default country code (default: 'US')
 * @returns PhoneValidationResult with validation status and formatted numbers
 */
export function validateAndFormatPhone(
  phoneNumber: string | null | undefined,
  defaultCountry: CountryCode = 'US'
): PhoneValidationResult {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return { isValid: false, error: 'Phone number is required' };
  }

  const cleanedNumber = phoneNumber.trim();

  try {
    // Check if it's a valid phone number
    if (!isValidPhoneNumber(cleanedNumber, defaultCountry)) {
      return { isValid: false, error: 'Invalid phone number format' };
    }

    // Parse the phone number
    const parsed = parsePhoneNumber(cleanedNumber, defaultCountry);

    if (!parsed) {
      return { isValid: false, error: 'Could not parse phone number' };
    }

    return {
      isValid: true,
      formatted: parsed.formatNational(), // (555) 123-4567
      international: parsed.formatInternational(), // +1 555 123 4567
      national: parsed.nationalNumber, // 5551234567
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format phone number for display (national format)
 * @param phoneNumber - The phone number to format
 * @param defaultCountry - Default country code (default: 'US')
 * @returns Formatted phone number or original if invalid
 */
export function formatPhoneForDisplay(
  phoneNumber: string | null | undefined,
  defaultCountry: CountryCode = 'US'
): string {
  if (!phoneNumber) return '';

  const result = validateAndFormatPhone(phoneNumber, defaultCountry);
  return result.formatted || phoneNumber;
}

/**
 * Format phone number for storage (E.164 format)
 * @param phoneNumber - The phone number to format
 * @param defaultCountry - Default country code (default: 'US')
 * @returns E.164 formatted phone number or original if invalid
 */
export function formatPhoneForStorage(
  phoneNumber: string | null | undefined,
  defaultCountry: CountryCode = 'US'
): string | null {
  if (!phoneNumber) return null;

  try {
    const parsed = parsePhoneNumber(phoneNumber, defaultCountry);
    return parsed ? parsed.format('E.164') : phoneNumber;
  } catch {
    return phoneNumber;
  }
}

/**
 * Auto-format phone number as user types
 * @param value - Current input value
 * @param defaultCountry - Default country code (default: 'US')
 * @returns Formatted phone number
 */
export function autoFormatPhone(
  value: string,
  defaultCountry: CountryCode = 'US'
): string {
  if (!value) return '';

  try {
    const parsed = parsePhoneNumber(value, defaultCountry);
    if (parsed) {
      return parsed.formatNational();
    }
  } catch {
    // If parsing fails, return cleaned input
  }

  // Return cleaned input (remove non-digits except + and spaces)
  return value.replace(/[^\d\s+()-]/g, '');
}

/** Empty stays empty. A real number is stored as E.164 (+15555555555). */
export function storedPhone(
  value: unknown,
  defaultCountry: CountryCode = 'US'
): { phone: string | null; error?: string } {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return { phone: null };
  const check = validateAndFormatPhone(raw, defaultCountry);
  if (!check.isValid) {
    return { phone: null, error: 'Enter a phone number like (555) 555-5555' };
  }
  return { phone: formatPhoneForStorage(raw, defaultCountry) };
}
