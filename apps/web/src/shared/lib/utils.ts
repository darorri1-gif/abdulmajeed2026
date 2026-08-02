import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names, resolving Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitize a user-supplied search term before interpolating it into a
 * PostgREST `.ilike()` / `.or()` filter. Strips characters that carry
 * meaning in PostgREST filter syntax (`,` `(` `)`) and SQL LIKE wildcards
 * (`%` `_`), so the term can never alter the query structure.
 */
export function likeTerm(input: string): string {
  return input.replace(/[%_,()\\]/g, ' ').replace(/\s+/g, ' ').trim();
}
