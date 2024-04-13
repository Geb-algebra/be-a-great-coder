import { isUsernameAvailable } from "~/services/auth.server.ts";
import { AccountFactory, AccountRepository } from "./account.server.ts";
import { prisma } from "~/db.server.ts";
import invariant from "tiny-invariant";

describe("UserRepository", () => {
  describe("isNameAvaliable", () => {
    it("should return true if name is avaliable", async () => {
      const isAvaliable = await isUsernameAvailable("test");
      expect(isAvaliable).toBe(true);
    });
    it("should return false if name is not avaliable", async () => {
      await prisma.user.create({
        data: {
          name: "test",
        },
      });
      const isAvaliable = await isUsernameAvailable("test");
      expect(isAvaliable).toBe(false);
    });
  });
});

describe("AccountFactory", () => {
  describe("create", () => {
    it("should create an account with given name", async () => {
      const account = await AccountFactory.create({
        name: "test",
      });
      expect(account.name).toBe("test");
    });
    it("should create an account with auto-generated id", async () => {
      const account = await AccountFactory.create({
        name: "test",
      });
      expect(account.id).toBeDefined();
      expect(account.name).toBe("test");
    });
    it("should create an account with given id", async () => {
      const account = await AccountFactory.create({
        name: "test",
        id: "testID",
      });
      expect(account.id).toBe("testID");
    });
    it("should create an account with given authenticators", async () => {
      const account = await AccountFactory.create({
        name: "test",
        id: "testID",
        authenticators: [
          {
            credentialID: "testCredentialID",
            name: null,
            credentialPublicKey: "testCredentialPublicKey",
            counter: 0,
            credentialDeviceType: "testCredentialDeviceType",
            credentialBackedUp: 0,
            transports: ["testTransports", "testTransports2"],
          },
        ],
      });
      expect(account.authenticators[0].credentialID).toBe("testCredentialID");
    });
  });

  it("should throw error if name is not avaliable", async () => {
    const user = await AccountFactory.create({
      name: "test",
    });
    await AccountRepository.save(user);
    await expect(
      AccountFactory.create({
        name: "test",
      }),
    ).rejects.toThrow("username already taken");
  });
  it("should not save account to database", async () => {
    await AccountFactory.create({
      name: "test",
      id: "testID",
    });
    const account = await prisma.user.findUnique({
      where: { name: "test" },
    });
    expect(account).toBeNull();
  });
  it("should not save authenticators to database", async () => {
    await AccountFactory.create({
      name: "test",
      id: "testID",
      authenticators: [
        {
          credentialID: "testCredentialID",
          name: null,
          credentialPublicKey: "testCredentialPublicKey",
          counter: 0,
          credentialDeviceType: "testCredentialDeviceType",
          credentialBackedUp: 0,
          transports: ["testTransports", "testTransports2"],
        },
      ],
    });
    const authenticator = await prisma.authenticator.findUnique({
      where: { credentialID: "testCredentialID" },
    });
    expect(authenticator).toBeNull();
  });
});

describe("AccountRepository", () => {
  it("should return null if user not exists", async () => {
    const account = await AccountRepository.getById("testID");
    expect(account).toBeNull();
  });
  it("should save user if not exists", async () => {
    await expect(AccountRepository.getById("testID")).resolves.toBeNull();
    const account = await AccountFactory.create({
      name: "test",
      id: "testID",
    });
    await AccountRepository.save(account);
    const savedUser = await prisma.user.findUnique({
      where: { id: "testID" },
    });
    expect(savedUser).toBeDefined();
  });
  it("should save user with authenticator", async () => {
    await expect(AccountRepository.getById("testID")).resolves.toBeNull();
    const account = await AccountFactory.create({
      name: "test",
      id: "testID",
      authenticators: [
        {
          credentialID: "testCredentialID",
          name: null,
          credentialPublicKey: "testCredentialPublicKey",
          counter: 0,
          credentialDeviceType: "testCredentialDeviceType",
          credentialBackedUp: 0,
          transports: ["testTransports", "testTransports2"],
        },
      ],
    });
    await AccountRepository.save(account);
    const savedUser = await prisma.user.findUnique({
      where: { id: "testID" },
      include: {
        authenticators: true,
      },
    });
    expect(savedUser).toBeDefined();
    expect(savedUser?.authenticators[0].credentialID).toBe("testCredentialID");
  });
  it("should not save user if an error occurs on saving authenticator", async () => {
    await expect(AccountRepository.getById("testID")).resolves.toBeNull();
    const account = await AccountFactory.create({
      name: "test",
      id: "testID",
      authenticators: [
        {
          credentialID: "testCredentialID",
          name: null,
          credentialPublicKey: "testCredentialPublicKey",
          counter: 0,
          credentialDeviceType: "testCredentialDeviceType",
          credentialBackedUp: 0,
          transports: ["testTransports", "testTransports2"],
          // @ts-expect-error
          invalidProperty: "Error!",
        },
      ],
    });
    await expect(AccountRepository.save(account)).rejects.toThrow();
    const savedUser = await prisma.user.findUnique({
      where: { id: "testID" },
      include: {
        authenticators: true,
      },
    });
    expect(savedUser).toBeNull();
  });
  it("should update user info", async () => {
    const account = await AccountFactory.create({
      name: "test",
      id: "testID",
    });
    await AccountRepository.save(account);
    const savedAccount = await AccountRepository.getById("testID");
    invariant(savedAccount, "User not found");
    expect(savedAccount.name).toBe("test");
    savedAccount.name = "test2";
    await AccountRepository.save(savedAccount);
    const updatedAccount = await AccountRepository.getById("testID");
    invariant(updatedAccount, "User not found");
    expect(updatedAccount.name).toBe("test2");
  });
  it("should add authenticators", async () => {
    const account = await AccountFactory.create({
      name: "test",
      id: "testID",
    });
    await AccountRepository.save(account);
    const savedAccount = await AccountRepository.getById("testID");
    invariant(savedAccount, "User not found");
    expect(savedAccount.authenticators.length).toBe(0);
    savedAccount.authenticators = [
      {
        credentialID: "testCredentialID",
        name: "testName",
        credentialPublicKey: "testCredentialPublicKey",
        counter: 0,
        credentialDeviceType: "testCredentialDeviceType",
        credentialBackedUp: 0,
        transports: ["testTransports", "testTransports2"],
      },
    ];
    await AccountRepository.save(savedAccount);
    const updatedAccount = await AccountRepository.getById("testID");
    invariant(updatedAccount, "User not found");
    expect(updatedAccount.authenticators.length).toBe(1);
    expect(updatedAccount.authenticators[0].credentialID).toBe("testCredentialID");
  });
  it("should update authenticators", async () => {
    const account = await AccountFactory.create({
      name: "test",
      id: "testID",
      authenticators: [
        {
          credentialID: "testCredentialID",
          name: null,
          credentialPublicKey: "testCredentialPublicKey",
          counter: 0,
          credentialDeviceType: "testCredentialDeviceType",
          credentialBackedUp: 0,
          transports: ["testTransports", "testTransports2"],
        },
      ],
    });
    await AccountRepository.save(account);
    const savedAccount = await AccountRepository.getById("testID");
    invariant(savedAccount, "User not found");
    expect(savedAccount.authenticators.length).toBe(1);
    account.authenticators = [
      {
        credentialID: "testCredentialID",
        name: "testName2",
        credentialPublicKey: "testCredentialPublicKey2",
        counter: 0,
        credentialDeviceType: "testCredentialDeviceType2",
        credentialBackedUp: 0,
        transports: ["testTransports2", "testTransports3"],
      },
    ];
    await AccountRepository.save(account);
    const updatedAccount = await AccountRepository.getById("testID");
    invariant(updatedAccount, "User not found");
    expect(updatedAccount.authenticators.length).toBe(1);
    expect(updatedAccount.authenticators[0].name).toBe("testName2");
    expect(updatedAccount.authenticators[0].transports).toEqual([
      "testTransports2",
      "testTransports3",
    ]);
  });
  it("should delete authenticators", async () => {
    const account = await AccountFactory.create({
      name: "test",
      id: "testID",
      authenticators: [
        {
          credentialID: "testCredentialID",
          name: null,
          credentialPublicKey: "testCredentialPublicKey",
          counter: 0,
          credentialDeviceType: "testCredentialDeviceType",
          credentialBackedUp: 0,
          transports: ["testTransports", "testTransports2"],
        },
      ],
    });
    await AccountRepository.save(account);
    const savedAccount = await AccountRepository.getById("testID");
    invariant(savedAccount, "User not found");
    savedAccount.authenticators = [];
    await AccountRepository.save(savedAccount);
    const updatedAccount = await AccountRepository.getById("testID");
    invariant(updatedAccount, "User not found");
    expect(updatedAccount.authenticators.length).toBe(0);
  });
  it("should get account by id", async () => {
    const user = await AccountFactory.create({
      name: "test",
      id: "testID",
      googleProfileId: "testGoogleProfileId",
    });
    await AccountRepository.save(user);
    const account = await AccountRepository.getById("testID");
    expect(account).toBeDefined();
  });
  it("should get account by name", async () => {
    await AccountFactory.create({
      name: "test",
      id: "testID",
      googleProfileId: "testGoogleProfileId",
    });
    const account = await AccountRepository.getByName("test");
    expect(account).toBeDefined();
  });
  it("should get account by googleProfileId", async () => {
    await AccountFactory.create({
      name: "test",
      id: "testID",
      googleProfileId: "testGoogleProfileId",
    });
    const account = await AccountRepository.getByGoogleProfileId("testGoogleProfileId");
    expect(account).toBeDefined();
  });
  it("should return null if account not found by googleProfileId", async () => {
    await expect(AccountRepository.getByGoogleProfileId("testGoogleProfileId")).resolves.toBeNull();
  });
  it("should return null if account not found by id", async () => {
    await expect(AccountRepository.getById("testID")).resolves.toBeNull();
  });
  it("should return null if account not found by name", async () => {
    await expect(AccountRepository.getByName("test")).resolves.toBeNull();
  });
});
