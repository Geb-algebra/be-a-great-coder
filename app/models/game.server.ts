import type { Problem } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';
import { prisma } from '~/db.server.ts';
import {
  WEEKS_PER_PROJECT,
  calcContractedReward,
  calcNumStoryPoints,
  calcOfferedReward,
} from '~/services/game-config.ts';
import { UserRepository } from './user.server.ts';

export class Project {
  readonly id: string;
  readonly userId: string;
  readonly offeredReward: number;
  readonly numStoryPoints: number;
  readonly problem: Problem;

  private _contractReward: number | null = null;
  private _storyPointsHistory: number[];
  private _startContractUnixSeconds: number | null = null;

  get contractReward() {
    return this._contractReward;
  }

  get storyPointsHistory() {
    return this._storyPointsHistory;
  }

  get startContractUnixSeconds() {
    return this._startContractUnixSeconds;
  }

  constructor(
    id: string,
    userId: string,
    offeredReward: number,
    numStoryPoints: number,
    problem: Problem,
    contractReward: number | null = null,
    storyPointsHistory: number[] = [],
  ) {
    this.id = id;
    this.userId = userId;
    this.offeredReward = offeredReward;
    this.numStoryPoints = numStoryPoints;
    this.problem = problem;
    this._contractReward = contractReward;
    this._storyPointsHistory = storyPointsHistory;
  }

  contract(problemSolveLevel: number) {
    if (this._contractReward !== null) {
      throw new Error('Already contracted');
    }
    this._startContractUnixSeconds = Math.round(Date.now() / 1000);
    this._contractReward = calcContractedReward(this.offeredReward, problemSolveLevel);
  }

  addStoryPointsHistory(storyPoints: number) {
    if (this._storyPointsHistory.length >= WEEKS_PER_PROJECT) {
      throw new Error('This project is already finished');
    }
    this._storyPointsHistory.push(storyPoints);
  }
}

export class ProjectFactory {
  readonly userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async create(problem: Problem) {
    await UserRepository.getById(this.userId); // check if user exists
    const offeredReward = calcOfferedReward(problem.difficulty);
    const numStoryPoints = calcNumStoryPoints(problem.difficulty);
    const project = new Project(createId(), this.userId, offeredReward, numStoryPoints, problem);
    return project;
  }
}

export class ProjectRepository {
  readonly userId: string;
  constructor(userId: string) {
    this.userId = userId;
  }

  async save(project: Project) {
    await UserRepository.getById(this.userId); // check if user exists
    if (project.userId !== this.userId) {
      throw new Error('Project cannot be saved by other user than the owner');
    }
    const storyPointsHistory = project.storyPointsHistory.join(',');
    const data = {
      id: project.id,
      user: {
        connect: {
          id: project.userId,
        },
      },
      problem: {
        connect: {
          id: project.problem.id,
        },
      },
      offeredReward: project.offeredReward,
      numStoryPoints: project.numStoryPoints,
      contractReward: project.contractReward,
      storyPointsHistory,
      startContractUnixSeconds: project.startContractUnixSeconds,
    };
    await prisma.project.upsert({
      where: {
        id: project.id,
      },
      update: data,
      create: data,
    });
  }

  async findById(id: string) {
    const project = await prisma.project.findUnique({
      where: {
        id,
        userId: this.userId,
      },
      include: {
        problem: true,
      },
    });
    if (project === null) {
      return null;
    }
    const storyPointsHistory = project.storyPointsHistory.split(',').map((s) => parseInt(s, 10));
    return new Project(
      project.id,
      project.userId,
      Number(project.offeredReward),
      project.numStoryPoints,
      project.problem,
      project.contractReward ? Number(project.contractReward) : null,
      storyPointsHistory,
    );
  }

  async findAll() {
    const projects = await prisma.project.findMany({
      where: {
        userId: this.userId,
      },
      include: {
        problem: true,
      },
    });
    return projects.map((project) => {
      const storyPointsHistory = project.storyPointsHistory.split(',').map((s) => parseInt(s, 10));
      return new Project(
        project.id,
        project.userId,
        Number(project.offeredReward),
        project.numStoryPoints,
        project.problem,
        project.contractReward ? Number(project.contractReward) : null,
        storyPointsHistory,
      );
    });
  }
}

export class Employee {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  public salary: number;
  public codingSkill: number;
  public communicationSkill: number;
  public projectManagementSkill: number;
  public isAssigned: boolean;
  public isFired: boolean;

  constructor(
    id: string,
    userId: string,
    name: string,
    salary: number,
    codingSkill: number,
    communicationSkill: number,
    projectManagementSkill: number,
    isAssigned: boolean,
    isFired: boolean,
  ) {
    this.id = id;
    this.userId = userId;
    this.name = name;
    this.salary = salary;
    this.codingSkill = codingSkill;
    this.communicationSkill = communicationSkill;
    this.projectManagementSkill = projectManagementSkill;
    this.isAssigned = isAssigned;
    this.isFired = isFired;
  }
}

export class EmployeeFactory {
  readonly userId: string;
  constructor(userId: string) {
    this.userId = userId;
  }
  async create(name: string) {
    const employee = new Employee(createId(), this.userId, name, 100, 100, 100, 100, false, false); // TODO: should be random
    return employee;
  }
}

export class EmployeeRepository {
  readonly userId: string;
  constructor(userId: string) {
    this.userId = userId;
  }

  async save(employee: Employee) {
    await UserRepository.getById(this.userId); // check if user exists
    if (employee.userId !== this.userId) {
      throw new Error('Employee cannot be saved by other user than the owner');
    }
    const data = {
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
    await prisma.employee.upsert({
      where: {
        id: employee.id,
      },
      update: data,
      create: data,
    });
  }

  async findById(id: string) {
    await UserRepository.getById(this.userId); // check if user exists
    const employee = await prisma.employee.findUnique({
      where: {
        id,
        userId: this.userId,
      },
    });
    if (employee === null) {
      return null;
    }
    return new Employee(
      employee.id,
      employee.userId,
      employee.name,
      Number(employee.salary),
      employee.codingSkill,
      employee.communicationSkill,
      employee.projectManagementSkill,
      employee.isAssigned,
      employee.isFired,
    );
  }

  async findAll() {
    await UserRepository.getById(this.userId); // check if user exists

    const employees = await prisma.employee.findMany({
      where: {
        userId: this.userId,
      },
    });
    return employees.map((employee) => {
      return new Employee(
        employee.id,
        employee.userId,
        employee.name,
        Number(employee.salary),
        employee.codingSkill,
        employee.communicationSkill,
        employee.projectManagementSkill,
        employee.isAssigned,
        employee.isFired,
      );
    });
  }
}

export class Game {
  readonly userId: string;

  private _money: number;
  private _year: number;
  private _month: number;
  private _employees: Employee[];
  private _projects: Project[];

  get year() {
    return this._year;
  }

  get month() {
    return this._month;
  }

  get employees() {
    return this._employees;
  }

  get projects() {
    return this._projects;
  }

  get money() {
    return this._money;
  }

  constructor(
    userId: string,
    employees: Employee[],
    projects: Project[],
    money: number,
    year: number,
    month: number,
  ) {
    this.userId = userId;
    this._employees = employees;
    this._projects = projects;
    this._money = money;
    this._year = year;
    this._month = month;
  }

  nextMonth() {
    this._month++;
    if (this._month > 12) {
      this._month = 1;
      this._year++;
    }
  }

  hire(employee: Employee) {
    this._employees.push(employee);
  }

  fire(employee: Employee) {
    employee.isFired = true;
  }

  assign(employee: Employee) {
    employee.isAssigned = true;
  }

  unassign(employee: Employee) {
    employee.isAssigned = false;
  }
}

export class GameRepository {
  readonly userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async save(game: Game) {
    if (game.userId !== this.userId) {
      throw new Error('Game cannot be saved by other user than the owner');
    }
    for (const employee of game.employees) {
      await new EmployeeRepository(this.userId).save(employee);
    }
    for (const project of game.projects) {
      await new ProjectRepository(this.userId).save(project);
    }
    const data = {
      userId: game.userId,
      money: game.money,
      year: game.year,
      month: game.month,
    };
    await prisma.gameStatus.upsert({
      where: {
        userId: game.userId,
      },
      update: data,
      create: data,
    });
  }

  async find() {
    const game = await prisma.gameStatus.findUnique({
      where: {
        userId: this.userId,
      },
    });
    if (game === null) {
      return null;
    }
    const employees = await new EmployeeRepository(this.userId).findAll();
    const projects = await new ProjectRepository(this.userId).findAll();
    return new Game(this.userId, employees, projects, Number(game.money), game.year, game.month);
  }
}
