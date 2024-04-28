import type { LaboratoryValue, TotalAssets, Turn } from "~/game/models/game";

function CashBoard(props: { amount: number }) {
  return (
    <div className={"p-4 w-96 h-16 text-right text-2xl font-bold rounded-xl"}>
      <span>$ {props.amount}</span>
    </div>
  );
}

function IngredientStock(props: { name: string; amount: number }) {
  return (
    <li className={"w-24 h-16 py-2 text-center align-middle"}>
      <p>{props.name}</p>
      <p>{props.amount}</p>
    </li>
  );
}

function RankBoard(props: { rank: number }) {
  return (
    <div className={"p-4 bg-factory-accent rounded-lg w-96 h-16 text-right text-2xl font-bold"}>
      <span>Rank: {props.rank}</span>
    </div>
  );
}

function RobotStatus(props: {
  battery: number;
  batteryCapacity: number;
  performance: number;
}) {
  return (
    <ul
      aria-label="robot-status"
      className={"p-4 w-auto h-16 text-center flex gap-6 bg-white bg-opacity-5 rounded-lg"}
    >
      <li>
        battery: {props.battery} / {props.batteryCapacity}
      </li>
      <li>robot performance: {props.performance}</li>
    </ul>
  );
}

export default function GameStatusDashboard(props: {
  totalAssets: TotalAssets;
  laboratoryValue: LaboratoryValue;
  theme: string;
}) {
  return (
    <div className={`bg-${props.theme}-card rounded-xl mx-6 my-4`}>
      <div className="flex gap-6">
        <CashBoard amount={props.totalAssets.cash} />
        <ul
          aria-label="ingredients"
          className={`flex bg-${props.theme}-card text-${props.theme}-text-dark rounded-lg gap-2`}
        >
          {Array.from(props.totalAssets.ingredientStock).map(([name, amount]) => (
            <IngredientStock key={name} name={name} amount={amount} />
          ))}
        </ul>
      </div>
      <div className="flex gap-6">
        <RankBoard rank={props.laboratoryValue.researcherRank} />
        <RobotStatus
          battery={props.totalAssets.battery}
          batteryCapacity={props.laboratoryValue.batteryCapacity}
          performance={props.laboratoryValue.performance}
        />
      </div>
    </div>
  );
}
