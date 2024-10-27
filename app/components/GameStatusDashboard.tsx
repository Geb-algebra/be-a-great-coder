import type { Ingredient } from "~/game/models";
import type { LaboratoryValue, TotalAssets } from "~/game/models/game";
import { INGREDIENTS, calcLvAndResidual } from "~/game/services/config";

function CashBoard(props: { amount: number }) {
  return (
    <div className="p-4 w-96 h-16 text-right text-2xl font-bold rounded-xl">
      <span>$ {props.amount}</span>
    </div>
  );
}

function IngredientStock(props: { ingredient: Ingredient; amount: number }) {
  return (
    <li
      aria-labelledby={`stocked-ingredient-${props.ingredient.id}`}
      className="w-24 h-16 py-2 text-center align-middle"
    >
      <p id={`stocked-ingredient-${props.ingredient.id}`}>{props.ingredient.name}</p>
      <p>{props.amount}</p>
    </li>
  );
}

function RankBoard(props: { rank: number }) {
  return (
    <div className="p-4 bg-accent rounded-lg w-96 h-16 text-right text-2xl font-bold">
      <span>Rank: {props.rank}</span>
    </div>
  );
}

function ExperimentBar(props: { residual: number; nextLvExp: number }) {
  return (
    <div className="h-4 bg-accent-1 rounded-lg">
      <div
        className="h-full bg-accent-1"
        style={{ width: `${(props.residual / props.nextLvExp) * 100}%` }}
      />
    </div>
  );
}

function RobotStatus(props: {
  battery: number;
  batteryCapacityExp: number;
  performanceExp: number;
}) {
  const batteryState = calcLvAndResidual(props.batteryCapacityExp);
  const performanceState = calcLvAndResidual(props.performanceExp);
  return (
    <ul
      aria-label="robot-status"
      className="p-4 w-auto h-16 text-center flex gap-6 bg-white bg-opacity-5 rounded-lg"
    >
      <li className="w-48">
        battery: {props.battery} / {batteryState.lv}
        <ExperimentBar residual={batteryState.residual} nextLvExp={batteryState.nextLvExp} />
      </li>
      <li className="w-48">
        robot performance: {performanceState.lv}
        <ExperimentBar
          residual={performanceState.residual}
          nextLvExp={performanceState.nextLvExp}
        />
      </li>
    </ul>
  );
}

export default function GameStatusDashboard(props: {
  totalAssets: TotalAssets;
  laboratoryValue: LaboratoryValue;
}) {
  return (
    <div aria-label="player's status" className="bg-card rounded-xl mx-6 my-4">
      <div className="flex gap-6">
        <CashBoard amount={props.totalAssets.cash} />
        <ul aria-label="ingredient stock" className="flex bg-card text-text-dark rounded-lg gap-2">
          {Array.from(props.totalAssets.ingredientStock).map(([id, amount]) => {
            const ingredient = INGREDIENTS.get(id);
            if (!ingredient) {
              throw new Error(`Invalid ingredient id: ${id}`);
            }
            return <IngredientStock key={id} ingredient={ingredient} amount={amount} />;
          })}
        </ul>
      </div>
      <div className="flex gap-6">
        <RankBoard rank={props.laboratoryValue.researcherRank} />
        <RobotStatus
          battery={props.totalAssets.battery}
          batteryCapacityExp={props.laboratoryValue.batteryCapacityExp}
          performanceExp={props.laboratoryValue.performanceExp}
        />
      </div>
    </div>
  );
}
