/**
 * Format phone number as user types
 * Supports US phone numbers in format: (555) 555-5555
 */
export function formatPhoneNumber(value: string): string {
  if (!value) return '';
  
  // Remove all non-numeric characters
  let phoneNumber = value.replace(/\D/g, '');
  if (phoneNumber.length === 11 && phoneNumber.startsWith('1')) {
    phoneNumber = phoneNumber.slice(1);
  }
  
  // Format based on length
  const phoneNumberLength = phoneNumber.length;
  
  if (phoneNumberLength < 4) {
    return phoneNumber;
  }
  
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }
  
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
}

/**
 * Strip formatting from phone number for storage
 */
export function unformatPhoneNumber(value: string): string {
  return value.replace(/\D/g, '');
}
