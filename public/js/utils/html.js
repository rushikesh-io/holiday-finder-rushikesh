/**
 * Safe HTML templating.
 *
 * `html` is a tagged template: every interpolated value is HTML-escaped unless it
 * is itself the result of `html` (or wrapped in `raw`). That means API data can be
 * dropped straight into templates without any risk of injecting markup.
 *
 *   html`<p>${holiday.name}</p>`          // name is escaped
 *   html`<ul>${items.map((i) => html`<li>${i}</li>`)}</ul>`  // nesting works
 */

class SafeHtml {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function render(value) {
  if (value === null || value === undefined || value === false) return '';
  if (Array.isArray(value)) return value.map(render).join('');
  if (value instanceof SafeHtml) return value.value;
  return escapeHtml(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((value, i) => {
    out += render(value) + strings[i + 1];
  });
  return new SafeHtml(out);
}

/** Mark a string you built yourself (and trust) as safe HTML. */
export const raw = (value) => new SafeHtml(String(value));

/** Replace an element's content with a template result. */
export function mount(element, template) {
  element.innerHTML = template ? template.toString() : '';
}
