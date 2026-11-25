import { test } from 'node:test';
import assert from 'node:assert/strict';
import { html, raw } from '../public/js/utils/html.js';

test('html escapes interpolated values', () => {
  const name = '<img src=x onerror=alert(1)>';
  assert.equal(String(html`<p>${name}</p>`), '<p>&lt;img src=x onerror=alert(1)&gt;</p>');
});

test('html keeps nested templates and arrays as markup', () => {
  const items = ['a', 'b'];
  assert.equal(String(html`<ul>${items.map((i) => html`<li>${i}</li>`)}</ul>`), '<ul><li>a</li><li>b</li></ul>');
});

test('html skips null, undefined and false', () => {
  assert.equal(String(html`[${null}${undefined}${false}]`), '[]');
});

test('raw passes trusted markup through', () => {
  assert.equal(String(html`${raw('<b>ok</b>')}`), '<b>ok</b>');
});
