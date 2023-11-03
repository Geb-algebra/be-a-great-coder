import type { Game, Employee, Project } from '../models/game.server.ts';

export function jsonifyEmployee(employee: Employee) {
  return {
    id: employee.id,
    userId: employee.userId,
    name: employee.name,
    salary: employee.salary,
    codingSkill: employee.codingSkill,
    communicationSkill: employee.communicationSkill,
    projectManagementSkill: employee.projectManagementSkill,
    isAssigned: employee.isAssigned,
    isFired: employee.isFired,
  };
}

export function jsonifyProject(project: Project) {
  return {
    id: project.id,
    userId: project.userId,
    offeredReward: project.offeredReward,
    contractReward: project.contractReward,
    numStoryPoints: project.numStoryPoints,
    problem: project.problem,
    storyPointsHistory: project.storyPointsHistory,
    startContractUnixSeconds: project.startContractUnixSeconds,
  };
}

export function jsonifyGame(game: Game) {
  return {
    userId: game.userId,
    money: game.money,
    year: game.year,
    month: game.month,
    employees: game.employees.map(jsonifyEmployee),
    projects: game.projects.map(jsonifyProject),
  };
}
