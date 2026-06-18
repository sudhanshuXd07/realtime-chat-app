const palettes = [
  ["#7B4B28", "#E8DFD0", "#141414"],
  ["#2563EB", "#DBEAFE", "#111827"],
  ["#059669", "#D1FAE5", "#0F172A"],
  ["#DC2626", "#FEE2E2", "#1F2937"],
  ["#9333EA", "#F3E8FF", "#111827"],
  ["#D97706", "#FEF3C7", "#111827"],
];

const escapeXml = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const hashText = (text = "") => {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const createRandomAvatar = (seed = Date.now().toString()) => {
  const hash = hashText(`${seed}-${Math.random()}`);
  const palette = palettes[hash % palettes.length];
  const initials = escapeXml(seed.trim().slice(0, 2).toUpperCase() || "U");
  const rotation = (hash % 24) - 12;
  const offset = hash % 18;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="36" fill="${palette[0]}"/>
      <circle cx="${34 + offset}" cy="30" r="38" fill="${palette[1]}" opacity=".24"/>
      <circle cx="${102 - offset}" cy="104" r="46" fill="${palette[2]}" opacity=".2"/>
      <g transform="rotate(${rotation} 64 64)">
        <rect x="34" y="38" width="60" height="52" rx="22" fill="${palette[1]}" opacity=".18"/>
      </g>
      <text x="64" y="76" text-anchor="middle" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="${palette[1]}">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};
