const SLATE = "#0f172a";
const GOLD = "#d89634";

/**
 * Decoration along the bottom of the hero card: an outline golf course with a cart driving
 * across it. Purely presentational — it sits behind the slides, so on wide screens the slide
 * photo covers the right of it and the scene reads under the text. Hidden from assistive tech.
 * The cart stops moving under prefers-reduced-motion (see globals.css).
 */
export function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 select-none" aria-hidden>
      {/* The course, standing on the ground line below it. `slice` keeps it in proportion:
          narrow cards crop to the middle of the scene rather than squashing it. */}
      <div className="absolute inset-x-0 bottom-[26px] h-36 overflow-hidden sm:h-44">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1440 220"
          preserveAspectRatio="xMidYMax slice"
          fill="none"
          stroke={SLATE}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* rolling fairway in the distance */}
          <path opacity={0.12} d="M0 132c180-30 320-16 470-24s310-30 530-6 320 18 440-10" />

          {/* trees on the left */}
          <circle opacity={0.13} cx={100} cy={140} r={46} />
          <path opacity={0.13} d="M100 186v32" />
          <circle opacity={0.1} cx={196} cy={166} r={28} />
          <path opacity={0.1} d="M196 194v24" />

          {/* bunker */}
          <path opacity={0.13} d="M348 196c34-20 104-22 140-4 30 15-14 34-74 30-44-4-98-6-66-26Z" />

          {/* the green, the hole and the flag */}
          <ellipse opacity={0.16} cx={640} cy={198} rx={150} ry={26} />
          <ellipse opacity={0.16} cx={640} cy={192} rx={7} ry={3} />
          <path opacity={0.2} d="M640 192V96" />
          <path stroke={GOLD} strokeWidth={3} opacity={0.5} d="M640 98 698 114l-58 16Z" />

          {/* the shot: ball on the tee, then its flight to the green */}
          <circle opacity={0.16} cx={250} cy={210} r={5} />
          <path opacity={0.14} strokeDasharray="4 12" d="M250 204Q450 66 636 190" />

          {/* more of the course off to the right, for cards that show their full width */}
          <circle opacity={0.11} cx={1140} cy={148} r={40} />
          <path opacity={0.11} d="M1140 188v30" />
          <circle opacity={0.09} cx={1256} cy={176} r={26} />
          <path opacity={0.09} d="M1256 202v16" />
          <path opacity={0.1} d="M1290 208c26-14 74-14 96-2 20 11-10 26-48 22-32-3-68-9-48-20Z" />
        </svg>
      </div>

      {/* The ground the cart runs along. Held apart from the scenery so the wheels always
          meet the line, whatever the card's width does to the rest. */}
      <div className="absolute inset-x-0 bottom-0 h-10 overflow-hidden">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
          fill="none"
          stroke={SLATE}
          strokeWidth={2}
          strokeLinecap="round"
        >
          <path opacity={0.18} vectorEffect="non-scaling-stroke" d="M0 14c210-8 430 8 660 1s460-11 780-2" />
          <path opacity={0.1} vectorEffect="non-scaling-stroke" d="M0 27c260-8 470 6 720-1s460-10 720-1" />
          <path opacity={0.07} vectorEffect="non-scaling-stroke" d="M0 37c300-6 560 4 840-2s380-7 600 0" />
        </svg>
      </div>

      {/* The track is the full width of the card, so the cart's journey is measured in
          percentages of it rather than of the viewport. */}
      <div className="hero-cart-drive absolute bottom-6 left-0 w-full">
        <div className="w-[88px] sm:w-[124px]">
          <GolfCart />
        </div>
      </div>
    </div>
  );
}

/** Side-on outline of a golf cart, wheels on the bottom edge so it can be parked on a line. */
function GolfCart() {
  return (
    <svg
      viewBox="0 0 160 106"
      className="h-auto w-full"
      fill="none"
      stroke={SLATE}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g opacity={0.26}>
        {/* bag of clubs on the rear deck */}
        <path d="M8 74q-4 0-4-6l3-22q1-5 6-5h7q5 0 5 5l-1 22q0 6-4 6Z" />
        <path d="M11 41 6 26M16 41l-1-17M21 41l6-14" />

        {/* seat, floor and front cowl in one outline */}
        <path d="M24 58h28V34q0-4 4-4h6q4 0 4 4v24h34l6-13q1-4 5-4h17q4 0 6 3l17 25v7q0 4-4 4H28q-4 0-4-4Z" />

        {/* windscreen */}
        <path d="M136 23 121 40" />

        {/* roof posts */}
        <path d="M44 18v40M138 18v32" />

        <g className="hero-cart-wheel">
          <circle cx={46} cy={90} r={14} />
          <circle cx={46} cy={90} r={4} />
          <path d="M46 76v10M46 94v10M32 90h10M50 90h10" />
        </g>
        <g className="hero-cart-wheel">
          <circle cx={130} cy={90} r={14} />
          <circle cx={130} cy={90} r={4} />
          <path d="M130 76v10M130 94v10M116 90h10M134 90h10" />
        </g>
      </g>

      {/* the canopy picks up the logo gold */}
      <rect x={34} y={8} width={112} height={10} rx={5} stroke={GOLD} opacity={0.5} />
    </svg>
  );
}
