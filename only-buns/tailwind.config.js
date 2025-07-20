/** @type {import('tailwindcss').Config} */
module.exports = {
  // Specify the files where Tailwind should look for its classes
  content: [
    "./src/**/*.{html,ts}", // This covers all HTML and TypeScript files in src/
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "dark", "cupcake", "dracula","dim"],
  },
};
