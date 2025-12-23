/**
 * Ensure image path is correctly formatted for Vite public folder
 * Adds leading slash if not present
 */
export function getPublicImagePath(path: string | null | undefined): string {
  if (!path) return ''

  // If path already starts with /, return as-is
  if (path.startsWith('/')) return path

  // Add leading slash for public folder access
  return `/${path}`
}
