/** @type {import('tailwindcss').Config} */

// Colours come from CSS variables (see src/input.css) so light and dark themes
// share one set of class names.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: 'class',
  content: ['./public/**/*.html', './public/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: token('paper'), deep: token('paper-deep') },
        surface: token('surface'),
        ink: { DEFAULT: token('ink'), soft: token('ink-soft'), faint: token('ink-faint') },
        rule: token('rule'),
        letter: { DEFAULT: token('letter'), soft: token('letter-soft') }, // "red-letter day" red
        marker: { DEFAULT: token('marker'), soft: token('marker-soft') }, // highlighter yellow
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      },
      maxWidth: { prose: '68ch' },
    },
  },
  plugins: [],
};
