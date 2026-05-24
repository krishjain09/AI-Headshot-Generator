const sharp = require("sharp");

const BRAND = "NOVARA AI";

async function applyCornerBadge(imageBuffer) {
  const badgeWidth = 320;
  const badgeHeight = 70;

  const svgBadge = `
    <svg width="${badgeWidth}" height="${badgeHeight}" xmlns="http://www.w3.org/2000/svg">

      <rect
        width="${badgeWidth}"
        height="${badgeHeight}"
        rx="14"
        ry="14"
        fill="black"
        fill-opacity="0.62"
      />

      <text
        x="${badgeWidth / 2}"
        y="45"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="28"
        font-weight="700"
        fill="white"
        fill-opacity="0.95"
        letter-spacing="1"
      >
        ${BRAND}
      </text>

    </svg>
  `;

  return sharp(imageBuffer)
    .composite([
      {
        input: Buffer.from(svgBadge),

        gravity: "southeast",
      },
    ])
    .jpeg({
      quality: 92,
    })
    .toBuffer();
}

module.exports = {
  applyCornerBadge,
};
