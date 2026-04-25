export function escapeSvgText(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function fallbackImage(title = "Подарок") {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1f2a54"/>
          <stop offset="100%" stop-color="#4b205f"/>
        </linearGradient>
        <linearGradient id="gift" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ff9bc0"/>
          <stop offset="100%" stop-color="#ff6ca0"/>
        </linearGradient>
      </defs>

      <rect width="800" height="500" rx="36" fill="url(#bg)"/>
      <rect x="255" y="165" width="290" height="175" rx="24" fill="url(#gift)"/>
      <rect x="383" y="130" width="34" height="210" rx="14" fill="#ffd86d"/>
      <rect x="255" y="237" width="290" height="32" rx="16" fill="#ffd86d"/>

      <text x="400" y="420" text-anchor="middle" fill="#f7e8ff" font-size="34" font-family="Arial" font-weight="700">
        ${escapeSvgText(title)}
      </text>
    </svg>
  `)}`;
}