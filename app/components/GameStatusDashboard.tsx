import type { GameStatus } from '~/game/models/game';

export default function GameStatusDashboard(props: { gameStatus: GameStatus }) {
  return (
    <ul>
      <li>money: {props.gameStatus.money}</li>
      <li>iron: {props.gameStatus.ingredientStock.get('iron')}</li>
      <li>robot efficiency: {props.gameStatus.robotEfficiencyLevel}</li>
      <li>robot quality: {props.gameStatus.robotQualityLevel}</li>
    </ul>
  );
}
