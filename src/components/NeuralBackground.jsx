export default function NeuralBackground() {
  return (
    <>
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4 }}
        viewBox="0 0 800 560"
        preserveAspectRatio="xMidYMid slice"
      >
        <g stroke="#2DD4BF" strokeWidth="0.8" fill="none">
          <path className="line-grow" d="M620 60 L700 130 L660 230 L740 300" />
          <path className="line-grow" d="M500 40 L620 60 L580 160" />
          <path className="line-grow" d="M660 230 L600 330 L680 420" />
        </g>
        <g fill="#5EEAD4">
          <circle cx="620" cy="60" r="3" />
          <circle cx="700" cy="130" r="4" />
          <circle cx="660" cy="230" r="3" />
          <circle cx="740" cy="300" r="3.5" />
          <circle cx="500" cy="40" r="2.5" />
          <circle cx="580" cy="160" r="3" />
          <circle cx="600" cy="330" r="3" />
          <circle cx="680" cy="420" r="3.5" />
        </g>
      </svg>
      <div
        className="drift-1 glow-pulse"
        style={{
          position: 'absolute',
          top: 90,
          right: 130,
          width: 90,
          height: 90,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(45,212,191,0.35), transparent 70%)',
          filter: 'blur(2px)',
        }}
      />
      <div
        className="drift-2 glow-pulse"
        style={{
          position: 'absolute',
          bottom: 140,
          right: 60,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,191,36,0.35), transparent 70%)',
          filter: 'blur(2px)',
        }}
      />
    </>
  );
}
