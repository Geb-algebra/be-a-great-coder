import type { Research } from "~/game/models/game";
import Button from "./Button";

export function ResearchInfo(props: { research: Research }) {
  return (
    <div className="flex">
      <div className="w-96 h-48 p-6 rounded-lg bg-card">
        <p className="text-xl font-bold mb-6">{props.research.problem.title}</p>
        <p>Difficulty: {props.research.problem.difficulty}</p>
        <p>battery: +{props.research.batteryCapacityExp}</p>
        <p>performance: +{props.research.performanceExp}</p>
      </div>
      <a
        href={`https://atcoder.jp/contests/${props.research.problem.id.split("_")[0]}/tasks/${
          props.research.problem.id
        }`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 -ml-36 self-start"
      >
        <Button type="button" className="p-4">
          Go to Problem Page!
        </Button>
      </a>
    </div>
  );
}
