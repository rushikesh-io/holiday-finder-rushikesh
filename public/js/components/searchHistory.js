/**
 * Recent searches. Each one can be opened again (which re-fetches it) or removed.
 */

import { html } from '../utils/html.js';
import { Flag } from './shared.js';

export function SearchHistory(entries, current) {
  return entries.map((entry) => {
    const isCurrent = current && current.countryCode === entry.countryCode && current.year === entry.year;
    const label = `${entry.countryName} ${entry.year}`;
    return html`
      <li class="flex items-center rounded-md border ${isCurrent ? 'border-ink bg-surface' : 'border-rule bg-surface/60'}">
        <button type="button" class="flex items-center gap-2 py-1.5 pl-2.5 pr-1 text-sm hover:underline"
          data-open-country="${entry.countryCode}" data-open-year="${entry.year}" title="Show ${label} again">
          ${Flag(entry.countryCode, 'h-3 w-[18px]')}
          <span>${entry.countryName}</span>
          <span class="tabular-nums text-ink-soft">${entry.year}</span>
        </button>
        <button type="button" class="grid h-8 w-7 place-items-center text-ink-faint hover:text-letter"
          data-remove-country="${entry.countryCode}" data-remove-year="${entry.year}" aria-label="Remove ${label} from recent searches">
          <svg viewBox="0 0 16 16" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
        </button>
      </li>
    `;
  });
}
