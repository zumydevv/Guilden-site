/*
 * WakiCube — registre des images de Waki.
 *
 * Une seule mascotte, six expressions. Tous les PNG sont carrés (1254 × 1254),
 * transparents et cadrés à l'identique : on peut passer de l'un à l'autre
 * sans que le personnage ne saute.
 *
 * `idle` pointe vers le logo officiel : le fichier assets/waki/waki-idle.png
 * du pack est identique octet pour octet, on évite ainsi de charger deux fois
 * la même image de 940 Ko.
 *
 * Si une image ne charge pas, le site retombe automatiquement sur `idle`.
 */
window.WAKI_ASSETS = {
  idle: "assets/wakicube-mascot-green.png",
  talkA: "assets/waki/waki-talk-a.png",
  talkB: "assets/waki/waki-talk-b.png",
  wink: "assets/waki/waki-wink.png",
  surprised: "assets/waki/waki-surprised.png",
  sleepy: "assets/waki/waki-sleepy.png"
};
