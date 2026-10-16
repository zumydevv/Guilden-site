/* Guilden — configuration des jeux et des contacts. Les valeurs nulles sont masquées. */
window.GUILDEN_CONFIG = {
  name: "Guilden",
  siteUrl: 'https://www.guilden.app/',

  /* Vignettes décoratives du mur animé. Les images de games sont aussi reprises. */
  heroThumbnails: [
    'assets/jeux/vignette-01.webp',
    'assets/jeux/vignette-02.webp',
    'assets/jeux/vignette-03.webp',
    'assets/jeux/vignette-04.webp',
    'assets/jeux/vignette-05.webp',
    'assets/jeux/vignette-06.webp',
    'assets/jeux/clean-all-the-bugs.png',
    'assets/jeux/army-merge-evolution.png',
    'assets/jeux/vignette-09.webp',
    'assets/jeux/vignette-10.webp',
    'assets/jeux/vignette-11.webp'
  ],

  /* Liens des vignettes, à renseigner plus tard : 'vignette-01': { title, url }. */
  galleryDetails: {},

  /* Voir docs/AJOUTER-UN-JEU.md. Une liste vide conserve la galerie de vignettes. */
  games: [],

  /* Sujet et canevas utilisés lorsqu'une adresse e-mail est renseignée. */
  quote: {
    subject: "Custom Roblox project — Guilden",
    body: [
      "Company:",
      "Idea:",
      "Goals:",
      "Estimated budget (optional):",
      "Desired timeline (optional):"
    ].join("\n"),
    hint: "Please include your company, your idea and your goals. A budget range and a desired timeline are optional but helpful."
  },

  /* Ajouter uniquement des coordonnées réelles. */
  contacts: {
    email: "guilden.business@gmail.com",
    discord: null,
    discordUser: "zumyv",
    roblox: null,
    youtube: null,
    tiktok: null,
    x: null,
    instagram: null
  }
};
