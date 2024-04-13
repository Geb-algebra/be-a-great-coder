import type { TotalAssets, LaboratoryValue } from "~/game/models/game";

export default function GameStatusDashboard(props: {
  totalAssets: TotalAssets;
  laboratoryValue: LaboratoryValue;
}) {
  return (
    <ul>
      <li>researcher's rank: {props.laboratoryValue.researcherRank}</li>
      <li>cash: {props.totalAssets.cash}</li>
      <li>iron: {props.totalAssets.ingredientStock.get("iron")}</li>
      <li>
        battery: {props.totalAssets.battery} / {props.laboratoryValue.batteryCapacity}
      </li>
      <li>robot performance: {props.laboratoryValue.performance}</li>
    </ul>
  );
}
