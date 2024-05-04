import type { Research } from "~/game/models/game";

export function ResearchInfo(props: { research: Research }) {
  return (
    <div className="flex">
      <div className="w-96 h-48 p-6 rounded-lg bg-card">
        <p className="text-xl font-bold mb-6">{props.research.problem.title}</p>
        <p>Difficulty: {props.research.problem.difficulty}</p>
        <p>battery: +{props.research.batteryCapacityIncrement}</p>
        <p>performance: +{props.research.performanceIncrement}</p>
      </div>
      <a
        href={`https://atcoder.jp/contests/${props.research.problem.id.split("_")[0]}/tasks/${
          props.research.problem.id
        }`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-4 mt-4 -ml-36 self-start rounded-lg bg-accent-1 text-text-light hover:bg-accent-2 transition-colors duration-300"
      >
        Go to Problem Page!
      </a>
    </div>
  );
}
