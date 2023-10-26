import { isUsernameAvailable, getHashedPassword, verifyPassword } from '~/services/auth.server.ts';
import { AccountFactory, AccountRepository } from './account.server.ts';
import { prisma } from '~/db.server.ts';

describe('UserRepository', () => {
  describe('isNameAvaliable', () => {
    it('should return true if name is avaliable', async () => {
      const isAvaliable = await isUsernameAvailable('test');
      expect(isAvaliable).toBe(true);
    });
    it('should return false if name is not avaliable', async () => {
      await prisma.user.create({
        data: {
          name: 'test',
        },
      });
      const isAvaliable = await isUsernameAvailable('test');
      expect(isAvaliable).toBe(false);
    });
  });
});

describe('AccountFactory', () => {
  describe('create', () => {
    it('should create an account with given name', async () => {
      const account = await AccountFactory.create({
        name: 'test',
      });
      expect(account.name).toBe('test');
    });
    it('should create an account with given id', async () => {
      const account = await AccountFactory.create({
        name: 'test',
        id: 'testID',
      });
      expect(account.id).toBe('testID');
    });
    it('should create an account with given authenticators', async () => {
      const account = await AccountFactory.create({
        name: 'test',
        id: 'testID',
        authenticators: [
          {
            credentialID: 'testCredentialID',
            name: null,
            credentialPublicKey: 'testCredentialPublicKey',
            counter: 0,
            credentialDeviceType: 'testCredentialDeviceType',
            credentialBackedUp: 0,
            transports: ['testTransports', 'testTransports2'],
          },
        ],
      });
      expect(account.authenticators[0].credentialID).toBe('testCredentialID');
    });
  });

  it('should hash password and create an account with the hash', async () => {
    const account = await AccountFactory.create({
      name: 'test',
      id: 'testID',
      passwordHash: await getHashedPassword('testPassword'),
    });
    expect(verifyPassword('testPassword', account.passwordHash ?? '')).resolves.toBe(true);
  });
  it('should throw error if name is not avaliable', async () => {
    await AccountFactory.create({
      name: 'test',
    });
    await expect(
      AccountFactory.create({
        name: 'test',
      }),
    ).rejects.toThrow('username already taken');
  });
  it('should save account to database', async () => {
    await AccountFactory.create({
      name: 'test',
      id: 'testID',
    });
    const account = await prisma.user.findUnique({
      where: { name: 'test' },
    });
    expect(account).toBeDefined();
  });
  it('should save password to database', async () => {
    await AccountFactory.create({
      name: 'test',
      id: 'testID',
      passwordHash: await getHashedPassword('testPassword'),
    });
    const password = await prisma.password.findUnique({
      where: { userId: 'testID' },
    });
    expect(password).toBeDefined();
  });
  it('should save authenticators to database', async () => {
    await AccountFactory.create({
      name: 'test',
      id: 'testID',
      authenticators: [
        {
          credentialID: 'testCredentialID',
          name: null,
          credentialPublicKey: 'testCredentialPublicKey',
          counter: 0,
          credentialDeviceType: 'testCredentialDeviceType',
          credentialBackedUp: 0,
          transports: ['testTransports', 'testTransports2'],
        },
      ],
    });
    const authenticator = await prisma.authenticator.findUnique({
      where: { credentialID: 'testCredentialID' },
    });
    expect(authenticator).toBeDefined();
  });
});

describe('AccountRepository', () => {
  it('should get account by id', async () => {
    await AccountFactory.create({
      name: 'test',
      id: 'testID',
    });
    const account = await AccountRepository.getById('testID');
    expect(account).toBeDefined();
  });
  it('should get account by name', async () => {
    await AccountFactory.create({
      name: 'test',
      id: 'testID',
    });
    const account = await AccountRepository.getByName('test');
    expect(account).toBeDefined();
  });
  it('should throw error if account not found by id', async () => {
    await expect(AccountRepository.getById('testID')).rejects.toThrow();
  });
  it('should throw error if account not found by name', async () => {
    await expect(AccountRepository.getByName('test')).rejects.toThrow();
  });
  it('should update user info', async () => {
    await AccountFactory.create({
      name: 'test',
      id: 'testID',
    });
    const account = await AccountRepository.getById('testID');
    account.name = 'test2';
    await AccountRepository.save(account);
    const updatedAccount = await AccountRepository.getById('testID');
    expect(updatedAccount.name).toBe('test2');
  });
  it('should update password', async () => {
    await AccountFactory.create({
      name: 'test',
      id: 'testID',
      passwordHash: await getHashedPassword('testPassword'),
    });
    const account = await AccountRepository.getById('testID');
    account.passwordHash = await getHashedPassword('testPassword2');
    await AccountRepository.save(account);
    const updatedAccount = await AccountRepository.getById('testID');
    expect(verifyPassword('testPassword2', updatedAccount.passwordHash ?? '')).resolves.toBe(true);
  });
  it('should add authenticators', async () => {
    await AccountFactory.create({
      name: 'test',
      id: 'testID',
    });
    const account = await AccountRepository.getById('testID');
    expect(account.authenticators.length).toBe(0);
    account.authenticators = [
      {
        credentialID: 'testCredentialID',
        name: 'testName',
        credentialPublicKey: 'testCredentialPublicKey',
        counter: 0,
        credentialDeviceType: 'testCredentialDeviceType',
        credentialBackedUp: 0,
        transports: ['testTransports', 'testTransports2'],
      },
    ];
    await AccountRepository.save(account);
    const updatedAccount = await AccountRepository.getById('testID');
    expect(updatedAccount.authenticators.length).toBe(1);
    expect(updatedAccount.authenticators[0].credentialID).toBe('testCredentialID');
  });
  it('should update authenticators', async () => {
    await AccountFactory.create({
      name: 'test',
      id: 'testID',
      authenticators: [
        {
          credentialID: 'testCredentialID',
          name: null,
          credentialPublicKey: 'testCredentialPublicKey',
          counter: 0,
          credentialDeviceType: 'testCredentialDeviceType',
          credentialBackedUp: 0,
          transports: ['testTransports', 'testTransports2'],
        },
      ],
    });
    const account = await AccountRepository.getById('testID');
    expect(account.authenticators.length).toBe(1);
    const createdAt = account.authenticators[0].createdAt;
    const updatedAt = account.authenticators[0].updatedAt;
    account.authenticators = [
      {
        credentialID: 'testCredentialID',
        name: 'testName2',
        credentialPublicKey: 'testCredentialPublicKey2',
        counter: 0,
        credentialDeviceType: 'testCredentialDeviceType2',
        credentialBackedUp: 0,
        transports: ['testTransports2', 'testTransports3'],
      },
    ];
    await AccountRepository.save(account);
    const updatedAccount = await AccountRepository.getById('testID');
    expect(updatedAccount.authenticators.length).toBe(1);
    expect(updatedAccount.authenticators[0].name).toBe('testName2');
    expect(updatedAccount.authenticators[0].createdAt).toEqual(createdAt);
    expect(updatedAccount.authenticators[0].updatedAt).not.toEqual(updatedAt);
    expect(updatedAccount.authenticators[0].transports).toEqual([
      'testTransports2',
      'testTransports3',
    ]);
  });
  it('should delete authenticators', async () => {
    await AccountFactory.create({
      name: 'test',
      id: 'testID',
      authenticators: [
        {
          credentialID: 'testCredentialID',
          name: null,
          credentialPublicKey: 'testCredentialPublicKey',
          counter: 0,
          credentialDeviceType: 'testCredentialDeviceType',
          credentialBackedUp: 0,
          transports: ['testTransports', 'testTransports2'],
        },
      ],
    });
    const account = await AccountRepository.getById('testID');
    account.authenticators = [];
    await AccountRepository.save(account);
    const updatedAccount = await AccountRepository.getById('testID');
    expect(updatedAccount.authenticators.length).toBe(0);
  });
});
