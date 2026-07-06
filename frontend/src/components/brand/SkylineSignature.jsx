// Signature visual: a line-art city skyline with lit windows — the "portfolio of
// properties" motif that anchors the brand panel. Kept restrained: one accent color,
// no animation beyond a slow ambient glow on the lit windows.
const SkylineSignature = () => {
  const buildings = [
    { x: 10, w: 34, h: 150, y: 350 },
    { x: 48, w: 26, h: 230, y: 270 },
    { x: 78, w: 40, h: 190, y: 310 },
    { x: 122, w: 28, h: 280, y: 220 },
    { x: 154, w: 46, h: 340, y: 160 },
    { x: 204, w: 30, h: 200, y: 300 },
    { x: 238, w: 38, h: 260, y: 240 },
    { x: 280, w: 24, h: 170, y: 330 },
    { x: 308, w: 42, h: 300, y: 200 },
    { x: 354, w: 30, h: 210, y: 290 },
  ];

  const windowRows = (b, seed) => {
    const rows = Math.floor(b.h / 24);
    const cols = Math.floor(b.w / 12);
    const windows = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lit = (r * cols + c + seed) % 5 === 0;
        windows.push(
          <rect
            key={`${b.x}-${r}-${c}`}
            x={b.x + 6 + c * 12}
            y={b.y + 10 + r * 24}
            width={5}
            height={8}
            rx={0.5}
            fill={lit ? "#E4C766" : "#233350"}
            opacity={lit ? 0.95 : 0.5}
          />
        );
      }
    }
    return windows;
  };

  return (
    <svg viewBox="0 0 400 500" className="w-full h-full" preserveAspectRatio="xMidYEnd meet">
      <defs>
        <linearGradient id="skyFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F1B2D" />
          <stop offset="100%" stopColor="#16233A" />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#skyFade)" />
      {buildings.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="#1B2C46" stroke="#2A3B5A" strokeWidth={1} />
          {windowRows(b, i)}
        </g>
      ))}
      {/* ground line */}
      <rect x="0" y="498" width="400" height="2" fill="#2A3B5A" />
    </svg>
  );
};

export default SkylineSignature;