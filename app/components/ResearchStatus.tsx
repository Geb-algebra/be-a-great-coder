import type { Research } from "~/game/models/game";
import { StatusText } from "../routes/play+/_game+/solve-problems";

export function ResearchStatus(props: { research: Research }) {
  return (
    <div className="p-6">
      <StatusText
        prefix="Started At"
        time={props.research.startedAt}
        fallBackMessage="Not started yet"
      />
      <StatusText
        prefix="Submitted First At"
        time={props.research.submittedAt}
        fallBackMessage="Not submitted yet"
      />
      <StatusText
        prefix="Solved At"
        time={props.research.solvedAt}
        fallBackMessage="Not solved yet"
      />
    </div>
  );
}
