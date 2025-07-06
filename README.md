
# Quiz App

A clean, responsive quiz application built with **SvelteKit** and **TailwindCSS**, powered by the **Open Trivia Database**. It features animated UI, dynamic scoring, and question fetching with retry logic.

---

# Features

- Google Sign-In authentication
- Random questions from the Open Trivia DB
- Score calculation and result feedback
- Retry logic for network/API issues
- Animated loaders and transitions
- Responsive, mobile-friendly layout
- Simple and minimal UI design

---

# Tech Stack

- SvelteKit (TypeScript)
- TailwindCSS
- Open Trivia DB API

---

# Project Structure

```
src/
├── lib/
│   └── firebase.js         # Auth logic (Google Sign-In)
├── components/
│   └── Quiz.svelte         # Core quiz functionality
├── routes/
│   └── +page.svelte        # Main layout and logic
├── app.html
├── tailwind.config.cjs
└── vite.config.js
```

---

# Development

- Install dependencies:
  
  bash
  npm install
  

- Start the dev server:

  bash
  npm run dev


- Lint the project:

  bash
  npm run lint

- Format code:

  bash
  npm run format

---

## Planned Enhancements

- Add category and difficulty selection
- Save and view past scores
- Leaderboard system
- Offline support
- Dark mode toggle

---

## License

This project is licensed under the **MIT License**.

© 2025 Samarth Muktamath

---

# Motivation

> *“Efforts don't always show results immediately, but they always shape outcomes silently.”*
