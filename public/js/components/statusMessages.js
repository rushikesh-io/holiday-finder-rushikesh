/**
 * Loading, empty, error and welcome states. Each says what happened and what to do next.
 */

import { html } from '../utils/html.js';

function Message({ title, body, action }) {
  return html`
    <div class="mt-10 max-w-prose border-l-4 border-ink py-1 pl-5">
      <p class="font-display text-2xl font-bold">${title}</p>
      ${body ? html`<p class="mt-2 text-ink-soft">${body}</p>` : ''}
      ${action ?? ''}
    </div>
  `;
}

export function Loading(countryName, year) {
  const row = html`
    <div class="grid grid-cols-[4.5rem_1fr] gap-4 border-t border-rule py-4 first:border-t-0" aria-hidden="true">
      <div class="mx-auto h-9 w-10 animate-pulse rounded bg-paper-deep"></div>
      <div class="space-y-2 pt-1">
        <div class="h-4 w-1/2 animate-pulse rounded bg-paper-deep"></div>
        <div class="h-3 w-3/4 animate-pulse rounded bg-paper-deep"></div>
      </div>
    </div>`;

  return html`
    <div class="mt-10" role="status">
      <p class="flex items-center gap-3 text-ink-soft">
        <span class="h-5 w-5 animate-spin rounded-full border-2 border-letter border-t-transparent"></span>
        Loading holidays for ${countryName}, ${year}…
      </p>
      <div class="mt-6 border-t-2 border-ink pt-2">${[1, 2, 3, 4].map(() => row)}</div>
    </div>
  `;
}

/** Required wording from the brief for an empty result. */
export function NoHolidays(countryName, year) {
  return Message({
    title: 'No holidays found for the selected country and year.',
    body: `The holiday service has no data for ${countryName} in ${year}. Choose another year or country.`,
  });
}

export function NoFilterMatches() {
  return Message({
    title: 'No holidays match these filters.',
    body: 'Choose another month or holiday type, or show everything again.',
    action: html`<button type="button" class="button-quiet mt-4" data-action="reset-filters">Show all holidays</button>`,
  });
}

export function ErrorMessage(message) {
  return html`<div role="alert">${Message({
    title: "Couldn't load holidays",
    body: message,
    action: html`<button type="button" class="button-primary mt-4" data-action="retry">Try again</button>`,
  })}</div>`;
}

export function Welcome() {
  return Message({
    title: 'Choose a country and a year to begin.',
    body: 'Searches you make are kept under Recent, so you can open them again with one click.',
  });
}
