import type { LaboratoryValue, TotalAssets, Turn } from "~/game/models/game";

function CashBoard(props: { amount: number; className: string }) {
  return (
    <div className={`p-4 w-96 h-16 text-right text-2xl font-bold ${props.className} rounded-xl`}>
      <span>$ {props.amount}</span>
    </div>
  );
}

function IngredientStock(props: { name: string; amount: number; className: string }) {
  return (
    <li className={`w-24 h-16 py-2 text-center align-middle ${props.className}`}>
      <p>{props.name}</p>
      <p>{props.amount}</p>
    </li>
  );
}

function RankBoard(props: { rank: number; className: string }) {
  return (
    <div
      className={`p-4 bg-factory-accent rounded-lg w-96 h-16 text-right text-2xl font-bold ${props.className}`}
    >
      <span>Rank: {props.rank}</span>
    </div>
  );
}

function RobotStatus(props: {
  battery: number;
  batteryCapacity: number;
  performance: number;
  className: string;
}) {
  return (
    <ul
      aria-label="robot-status"
      className={`p-4 w-auto h-16 text-center flex gap-6 bg-white bg-opacity-5 rounded-lg ${props.className}`}
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
  const colors =
    props.theme === "factory"
      ? {
          bg: "bg-factory-base",
          card: "bg-factory-card",
          accent: "bg-factory-accent-1",
          textDark: "text-factory-text-dark",
          textLight: "text-factory-text-light",
        }
      : {
          bg: "bg-lab-base",
          card: "bg-lab-card",
          accent: "bg-lab-accent-1",
          textDark: "text-lab-text-dark",
          textLight: "text-lab-text-light",
        };
  return (
    <div className={`${colors.card} rounded-xl mx-6 my-4`}>
      <div className="flex gap-6">
        <CashBoard
          amount={props.totalAssets.cash}
          className={`${colors.card} ${colors.textDark}`}
        />
        <ul
          aria-label="ingredients"
          className={`flex ${colors.card} ${colors.textDark} rounded-lg gap-2`}
        >
          {Array.from(props.totalAssets.ingredientStock).map(([name, amount]) => (
            <IngredientStock key={name} name={name} amount={amount} className="" />
          ))}
        </ul>
      </div>
      <div className="flex gap-6">
        <RankBoard
          rank={props.laboratoryValue.researcherRank}
          className={`${colors.card} ${colors.textDark}`}
        />
        <RobotStatus
          battery={props.totalAssets.battery}
          batteryCapacity={props.laboratoryValue.batteryCapacity}
          performance={props.laboratoryValue.performance}
          className={`${colors.card} ${colors.textDark}`}
        />
      </div>
    </div>
  );
}
