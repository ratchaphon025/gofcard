/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: { glow: "0 0 35px rgba(250, 204, 21, .22)" },
      fontFamily: { display: ["Trebuchet MS", "sans-serif"] },
    },
  },
  plugins: [],
};
