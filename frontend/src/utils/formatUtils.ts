/**
 * Format a database name for display in the UI
 * Replaces underscores with spaces for better readability
 * @param name - The database name (table, column, attribute, etc.)
 * @returns The formatted name with spaces instead of underscores
 */
export function formatDisplayName(name: string): string {
  if (!name) return '';
  return name.replace(/_/g, ' ');
}

