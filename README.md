# 🗓️ Holiday Finder Rushikesh

A clean, responsive web app to **find public holidays for any country and year**. Filter them by month or type, see which ones are coming up next, and export the list to CSV.
Built with **HTML, Tailwind CSS and vanilla JavaScript (ES modules)**, with no frameworks.

**🔗 Live demo:** https://holiday-finder-rushikesh.netlify.app

**💻 Source code:** https://github.com/rushikesh-io/holiday-finder-rushikesh

**👤 Author:** Rushikesh Gaikwad ([@rushikesh-io](https://github.com/rushikesh-io))

---

## ✨ Features

### Core
- 🌍 **Country dropdown** loaded live from the API (100+ countries, with flags)
- 📅 **Year field** with previous/next buttons (1975–2075)
- 🔎 Holidays are fetched and shown **dynamically** when you search
- 📋 Each holiday shows its **name, date, local name, country code, holiday type and day of the week**
- 🚫 Empty state: **"No holidays found for the selected country and year."**
- ⏳ **Loading indicator** (spinner + skeleton cards) while the request runs
- 🕘 **Search history** saved in `localStorage`
  - click a previous search to **re-fetch and show it again**
  - remove a single entry, or **Clear history** for all
- 📱 Fully **responsive** (mobile → desktop)
- 🛡️ API errors handled with `try/catch` and `.catch()`, plus a **Try again** button

### Bonus
- 🗓️ **Filter by month**
- 🏷️ **Filter by holiday type** (Public, Bank, School, Optional, Observance, Authorities)
- 🌗 **Dark / Light mode** (remembers your choice, follows your system preference)
- ⬇️ **Export to CSV** (exports exactly what the filters show)
- 🔢 **Total number of holidays** found
- ⭐ **Upcoming holidays highlighted**, with the next holiday, a countdown ("in 12 days") and past holidays dimmed

### Extras
- 🧾 Switch between **cards** and a **table** layout
- 🔗 Shareable URLs, e.g. `?country=GB&year=2026`
- 🏳️ Country flags, and a **National / Regional** label for each holiday
- ♿ Accessible: semantic HTML, ARIA live regions, keyboard-friendly controls
- 🔒 All API text is escaped before rendering

---

## 🛠️ Tech Stack

| Layer   | Tool |
|---------|------|
| Markup  | HTML5 |
| Styling | Tailwind CSS 3 (built with the Tailwind CLI) |
| Logic   | Vanilla JavaScript (ES modules) |
| Data    | [Nager.Date Public Holiday API](https://date.nager.at/) (no API key) |
| Hosting | Netlify |

## 📁 Project Structure

```
├── public/                 # Everything that gets deployed
│   ├── index.html
│   ├── css/styles.css      # Compiled Tailwind output
│   └── js/
│       ├── app.js          # State + event wiring
│       ├── api.js          # Nager.Date requests and error handling
│       ├── storage.js      # localStorage: search history, theme, layout
│       ├── ui.js           # Rendering: cards, table, filters, history
│       └── utils.js        # Date helpers, CSV export, HTML escaping
├── src/input.css           # Tailwind source + custom components
├── tailwind.config.js      # Theme colours, fonts, animations
├── netlify.toml            # Netlify build settings
└── package.json
```

## 🚀 Run Locally

```bash
npm install
npm run build     # compile Tailwind -> public/css/styles.css
npm start         # serve at http://localhost:5174
```

Run `npm run dev` while editing styles to rebuild the CSS automatically.

## 📡 API Reference

```
GET https://date.nager.at/api/v3/AvailableCountries
GET https://date.nager.at/api/v3/PublicHolidays/{year}/{countryCode}
```

The API answers `204 No Content` when it has no data for a country and year (for example India), which the app shows as the "No holidays found" message.

## 👤 Author

**Rushikesh Gaikwad** · Aspiring Full-Stack Developer, Mumbai
- GitHub: [@rushikesh-io](https://github.com/rushikesh-io)
- Portfolio: [rushikeshux.framer.ai](https://rushikeshux.framer.ai/)

## 📄 License

MIT © Rushikesh Gaikwad
