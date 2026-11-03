type Props = {
  score: number;
};

export function ScoreGauge({ score }: Props) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div
      className="relative grid h-32 w-32 shrink-0 place-items-center"
      role="img"
      aria-label={`Estimated resume alignment score: ${score} out of 100`}
    >
      <svg viewBox="0 0 104 104" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="52" cy="52" r={radius} fill="none" stroke="#e5ebe5" strokeWidth="8" />
        <circle
          cx="52"
          cy="52"
          r={radius}
          fill="none"
          stroke="#63866e"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="text-center">
        <span className="block text-3xl font-semibold tracking-tight text-[#203629]">{score}</span>
        <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.12em] text-[#7b877d]">
          out of 100
        </span>
      </span>
    </div>
  );
}
