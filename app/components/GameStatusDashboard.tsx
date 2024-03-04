import type { TotalAssets } from '~/game/models/game';

export default function GameStatusDashboard(props: {
  totalAssets: TotalAssets;
  batteryCapacity: number;
  performance: number;
}) {
  return (
    <ul>
      <li>cash: {props.totalAssets.cash}</li>
      <li>iron: {props.totalAssets.ingredientStock.get('iron')}</li>
      <li>battery capacity: {props.batteryCapacity}</li>
      <li>robot performance: {props.performance}</li>
    </ul>
  );
}
