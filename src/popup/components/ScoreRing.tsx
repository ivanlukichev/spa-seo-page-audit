import type { CSSProperties } from "react";
import type { StatusLevel } from "../../shared/types";

interface ScoreRingProps {
  score: number;
  label: string;
  color: StatusLevel;
}

export function ScoreRing({ score, label, color }: ScoreRingProps) {
  const style = { ["--score" as string]: `${score}%` } as CSSProperties;

  return (
    <div className={`score-ring score-ring-${color}`} style={style}>
      <div className="score-ring-inner">
        <strong>{score}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
