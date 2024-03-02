export type User = {
  id: string;
  name: string;
  googleProfileId: string | null;
};

export type Authenticator = {
  credentialID: string;
  name: string | null;
  credentialPublicKey: string;
  counter: number;
  credentialDeviceType: string;
  credentialBackedUp: number;
  transports: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type Account = User & {
  authenticators: Authenticator[];
};
