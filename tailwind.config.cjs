// tailwind.config.cjs
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.vue" // Tous les fichiers Vue
  ],
  safelist: [
    { pattern: /^text-(indigo|slate|gray|red|blue)-(400|500|600)/ }
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          500: '#6366f1' // Définition explicite
        }
      }
    }
  }
}
