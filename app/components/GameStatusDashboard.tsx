import type { TotalAssets, LaboratoryValue } from "~/game/models/game";

export default function GameStatusDashboard(props: {
  totalAssets: TotalAssets;
  laboratoryValue: LaboratoryValue;
}) {
  return (
    <>
      <ul>
        <li>researcher's rank: {props.laboratoryValue.researcherRank}</li>
        <li>cash: {props.totalAssets.cash}</li>
        <li>
          battery: {props.totalAssets.battery} / {props.laboratoryValue.batteryCapacity}
        </li>
        <li>robot performance: {props.laboratoryValue.performance}</li>
      </ul>
      <h3 id="ingredient-header">Ingredients</h3>
      <ul aria-labelledby="ingredient-header">
        {Array.from(props.totalAssets.ingredientStock).map(([name, amount]) => (
          <li key={name}>
            {name}: {amount}
          </li>
        ))}
      </ul>
    </>
  );
}
