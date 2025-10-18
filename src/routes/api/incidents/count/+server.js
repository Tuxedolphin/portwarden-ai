import { json } from '@sveltejs/kit';
import { incidents } from '$lib/data/incidents.js';

export async function GET() {
  // Since our mock incidents don't have status, we'll count all incidents as "open"
  // In a real system, you would filter by status === 'open'
  const count = incidents.length;
  return json({ count });
}
