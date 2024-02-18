import { prisma } from '~/db.server.ts';
import { AccountFactory } from '~/accounts/models/account.server.ts';
import {
  ProjectFactory,
  ProjectRepository,
  EmployeeFactory,
  EmployeeRepository,
} from './game.server.ts';

beforeEach(async () => {
  await AccountFactory.create({
    id: 'user123',
    name: 'testuser',
    passwordHash: 'testpasswordhash',
  });
  await AccountFactory.create({
    id: 'user456',
    name: 'testuser2',
    passwordHash: 'testpasswordhash2',
  });
  await prisma.problem.create({
    data: {
      id: 'problem123',
      title: 'Test Problem',
      difficulty: 200,
    },
  });
});

describe('ProjectFactory', () => {
  const userId = 'user123';
  const projectFactory = new ProjectFactory(userId);

  it('should create a new project', async () => {
    const problem = { id: 'problem123', title: 'Test Problem', difficulty: 200 };
    const project = await projectFactory.create(problem);

    expect(project).toBeDefined();
    expect(project.id).toBeDefined();
    expect(project.userId).toBe(userId);
    expect(project.offeredReward).toBeGreaterThan(0);
    expect(project.numStoryPoints).toBeGreaterThan(0);
    expect(project.problem).toBe(problem);
    expect(project.contractReward).toBeNull();
    expect(project.storyPointsHistory).toHaveLength(0);
  });
});

describe('ProjectRepository', () => {
  const userId = 'user123';
  const projectRepository = new ProjectRepository(userId);

  it('should save a project', async () => {
    const problem = { id: 'problem123', title: 'Test Problem', difficulty: 200 };
    const project = await new ProjectFactory(userId).create(problem);
    const initialProject = await prisma.project.findMany();
    expect(initialProject).toHaveLength(0);
    await projectRepository.save(project);
    const savedProject = await prisma.project.findMany();
    expect(savedProject).toHaveLength(1);
    expect(savedProject[0].id).toBe(project.id);
  });

  it('should not save a project if the user is different', async () => {
    const problem = { id: 'problem123', title: 'Test Problem', difficulty: 200 };
    const project = await new ProjectFactory(userId).create(problem);
    const initialProject = await prisma.project.findMany();
    expect(initialProject).toHaveLength(0);
    await expect(new ProjectRepository('user456').save(project)).rejects.toThrow(
      'Project cannot be saved by other user than the owner',
    );
    const savedProject = await prisma.project.findMany();
    expect(savedProject).toHaveLength(0);
  });

  it('should not save a project if the user does not exist', async () => {
    const problem = { id: 'problem123', title: 'Test Problem', difficulty: 200 };
    const project = await new ProjectFactory(userId).create(problem);
    const initialProject = await prisma.project.findMany();
    expect(initialProject).toHaveLength(0);
    await expect(new ProjectRepository('user789').save(project)).rejects.toThrow('No User found');
    const savedProject = await prisma.project.findMany();
    expect(savedProject).toHaveLength(0);
  });

  it('finds a project by id', async () => {
    const problem = { id: 'problem123', title: 'Test Problem', difficulty: 200 };
    const project = await new ProjectFactory(userId).create(problem);
    await projectRepository.save(project);
    const foundProject = await projectRepository.findById(project.id);
    expect(foundProject).toBeDefined();
    expect(foundProject!.id).toBe(project.id);
  });

  it('returns null if the project is not found', async () => {
    const foundProject = await projectRepository.findById('notfound');
    expect(foundProject).toBeNull();
  });

  it('returns null if the project is not owned by the user', async () => {
    const problem = { id: 'problem123', title: 'Test Problem', difficulty: 200 };
    const project = await new ProjectFactory(userId).create(problem);
    await projectRepository.save(project);
    const foundProject = await new ProjectRepository('user456').findById(project.id);
    expect(foundProject).toBeNull();
  });

  it('find all projects for the user', async () => {
    const problem = { id: 'problem123', title: 'Test Problem', difficulty: 200 };
    const project = await new ProjectFactory(userId).create(problem);
    await projectRepository.save(project);
    const foundProjects = await projectRepository.findAll();
    expect(foundProjects).toHaveLength(1);
    expect(foundProjects[0].id).toBe(project.id);
  });
});

describe('EmployeeFactory', () => {
  const userId = 'user123';
  const employeeFactory = new EmployeeFactory(userId);

  it('should create a new employee', async () => {
    const employee = await employeeFactory.create('Geb');
    expect(employee).toBeDefined();
    expect(employee.id).toBeDefined();
    expect(employee.name).toBe('Geb');
    expect(employee.userId).toBe(userId);
    expect(employee.salary).toBeGreaterThan(0);
    expect(employee.codingSkill).toBeGreaterThan(0);
    expect(employee.communicationSkill).toBeGreaterThan(0);
    expect(employee.projectManagementSkill).toBeGreaterThan(0);
    expect(employee.isAssigned).toBe(false);
    expect(employee.isFired).toBe(false);
  });
});

describe('EmployeeRepository', () => {
  const userId = 'user123';
  const employeeRepository = new EmployeeRepository(userId);

  it('should save an employee', async () => {
    const employee = await new EmployeeFactory(userId).create('Geb');
    const initialEmployee = await prisma.employee.findMany();
    expect(initialEmployee).toHaveLength(0);
    await employeeRepository.save(employee);
    const savedEmployee = await prisma.employee.findMany();
    expect(savedEmployee).toHaveLength(1);
    expect(savedEmployee[0].id).toBe(employee.id);
  });

  it('should not save an employee if the user is different', async () => {
    const employee = await new EmployeeFactory(userId).create('Geb');
    const initialEmployee = await prisma.employee.findMany();
    expect(initialEmployee).toHaveLength(0);
    await expect(new EmployeeRepository('user456').save(employee)).rejects.toThrow(
      'Employee cannot be saved by other user than the owner',
    );
    const savedEmployee = await prisma.employee.findMany();
    expect(savedEmployee).toHaveLength(0);
  });

  it('should not save an employee if the user does not exist', async () => {
    const employee = await new EmployeeFactory(userId).create('Geb');
    const initialEmployee = await prisma.employee.findMany();
    expect(initialEmployee).toHaveLength(0);
    await expect(new EmployeeRepository('user789').save(employee)).rejects.toThrow('No User found');
    const savedEmployee = await prisma.employee.findMany();
    expect(savedEmployee).toHaveLength(0);
  });

  it('finds an employee by id', async () => {
    const employee = await new EmployeeFactory(userId).create('Geb');
    await employeeRepository.save(employee);
    const foundEmployee = await employeeRepository.findById(employee.id);
    expect(foundEmployee).toBeDefined();
    expect(foundEmployee!.id).toBe(employee.id);
  });

  it('returns null if the employee is not found', async () => {
    const foundEmployee = await employeeRepository.findById('notfound');
    expect(foundEmployee).toBeNull();
  });

  it('returns null if the employee is not owned by the user', async () => {
    const employee = await new EmployeeFactory(userId).create('Geb');
    await employeeRepository.save(employee);
    const foundEmployee = await new EmployeeRepository('user456').findById(employee.id);
    expect(foundEmployee).toBeNull();
  });

  it('find all employees for the user', async () => {
    const employee = await new EmployeeFactory(userId).create('Geb');
    await employeeRepository.save(employee);
    const foundEmployees = await employeeRepository.findAll();
    expect(foundEmployees).toHaveLength(1);
    expect(foundEmployees[0].id).toBe(employee.id);
  });
});
