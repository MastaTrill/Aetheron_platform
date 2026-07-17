/**
 * Vercel Web Analytics Entry Point
 * This file is bundled and included in the main HTML files
 */

import { inject } from '@vercel/analytics';

// Initialize Vercel Analytics when the page loads
if (typeof window !== 'undefined') {
  inject();
  console.log('Vercel Analytics initialized');
}
