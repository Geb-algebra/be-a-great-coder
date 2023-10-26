import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/typescript-types';
import { Authenticator } from 'remix-auth';
import { FormStrategy } from 'remix-auth-form';
import invariant from 'tiny-invariant';
import bcrypt from 'bcryptjs';
import { type User, AccountFactory, AccountRepository } from '~/models/account.server.ts';
import { UserRepository } from '~/models/user.server.ts';

import { WebAuthnStrategy } from '~/services/webauthn-strategy.server.ts';
import { getSession, sessionStorage } from '~/services/session.server.ts';
import { getRequiredStringFromFormData } from '~/utils.ts';
import { getAuthenticatorById } from '~/models/authenticator.server.ts';

export let authenticator = new Authenticator<User>(sessionStorage);

export async function isUsernameAvailable(username: string) {
  try {
    await UserRepository.getByName(username);
    return false;
  } catch (error) {
    return true;
  }
}

export async function getHashedPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function validatePassword(password: string) {
  if (password.length < 8) throw new Error('password must be at least 8 characters');
  if (password.length > 128) throw new Error('password must be less than 128 characters');
  if (!/[a-z]/.test(password)) throw new Error('password must contain a lowercase letter');
  if (!/[A-Z]/.test(password)) throw new Error('password must contain an uppercase letter');
  if (!/[0-9]/.test(password)) throw new Error('password must contain a number');
}

// we reuse them to add new passkeys to authenticated users
export const WEBAUTHN_RP_NAME = '8bit Stack';
export const WEBAUTHN_RP_ID =
  process.env.NODE_ENV === 'development' ? 'localhost' : process.env.APP_DOMAIN!;
export const WEBAUTHN_ORIGIN =
  process.env.NODE_ENV === 'development'
    ? `http://localhost:${process.env.PORT ?? 3000}`
    : `https://${process.env.APP_DOMAIN!}`;

authenticator.use(
  new WebAuthnStrategy(
    {
      // The human-readable name of your app
      // Type: string | (response:Response) => Promise<string> | string
      rpName: WEBAUTHN_RP_NAME,
      // The hostname of the website, determines where passkeys can be used
      // See https://www.w3.org/TR/webauthn-2/#relying-party-identifier
      // Type: string | (response:Response) => Promise<string> | string
      rpID: WEBAUTHN_RP_ID,
      // Website URL (or array of URLs) where the registration can occur
      origin: WEBAUTHN_ORIGIN,
      // Return the list of authenticators associated with this user. You might
      // need to transform a CSV string into a list of strings at this step.
      getUserAuthenticators: async (user) => {
        if (!user) return [];
        const account = await AccountRepository.getById(user.id);
        return account.authenticators.map((authenticator) => {
          return {
            ...authenticator,
            transports: authenticator.transports,
          };
        });
      },
      // Transform the user object into the shape expected by the strategy.
      // You can use a regular username, the users email address, or something else.
      getUserDetails: (user) => ({ id: user!.id, username: user!.name }),
      getUserByUsername: (username) => UserRepository.getByName(username),
      getAuthenticatorById: (id) => getAuthenticatorById(id),
    },
    async ({ authenticator, type, username, userId }) => {
      const savedAuthenticator = await getAuthenticatorById(authenticator.credentialID);
      if (type === 'registration') {
        // Check if the authenticator exists in the database
        if (savedAuthenticator) {
          throw new Error('Authenticator has already been registered.');
        }
        invariant(userId, 'User id is required.');
        invariant(username, 'Username is required.');
        const { passwordHash, authenticators, ...user } = await AccountFactory.create({
          name: username,
          id: userId,
          authenticators: [{ ...authenticator, name: null }],
        });
        return user;
      } else if (type === 'authentication') {
        if (!savedAuthenticator) throw new Error('Authenticator not found');
        const { passwordHash, authenticators, ...user } = await AccountRepository.getById(
          savedAuthenticator.userId,
        );
        return user;
      } else {
        throw new Error('Invalid verification type');
      }
    },
  ),
  'webauthn',
);

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const username = getRequiredStringFromFormData(form, 'username');
    const password = getRequiredStringFromFormData(form, 'password');
    const type = form.get('type');
    if (type === 'registration') {
      const userId = getRequiredStringFromFormData(form, 'user-id');
      validatePassword(password);
      const {
        passwordHash: _passwordHash,
        authenticators,
        ...user
      } = await AccountFactory.create({
        name: username,
        id: userId,
        passwordHash: await getHashedPassword(password),
      });
      return user;
    } else if (type === 'authentication') {
      const { passwordHash, authenticators, ...user } = await AccountRepository.getByName(username);
      if (!(await verifyPassword(password, passwordHash ?? '')))
        throw new Error('Invalid password');
      return user;
    } else {
      throw new Error('Invalid type');
    }
  }),
  'user-pass',
);

export async function getAuthErrorMessage(request: Request) {
  const session = await getSession(request);
  const error = session.get(authenticator.sessionErrorKey);
  if (error) {
    return error.message;
  }
}

export async function verifyNewAuthenticator(
  responseData: RegistrationResponseJSON,
  expectedChallenge: string,
) {
  const verification = await verifyRegistrationResponse({
    response: responseData as RegistrationResponseJSON,
    expectedChallenge: expectedChallenge ?? '',
    expectedOrigin: WEBAUTHN_ORIGIN,
    expectedRPID: WEBAUTHN_RP_ID,
  });

  if (verification.verified && verification.registrationInfo) {
    const { credentialPublicKey, credentialID, counter, credentialBackedUp, credentialDeviceType } =
      verification.registrationInfo;

    const newAuthenticator = {
      credentialID: Buffer.from(credentialID).toString('base64url'),
      credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64url'),
      counter,
      credentialBackedUp: credentialBackedUp ? 1 : 0,
      credentialDeviceType,
      transports: [''],
    };
    const savedAuthenticator = await getAuthenticatorById(newAuthenticator.credentialID);
    if (savedAuthenticator) {
      throw new Error('Authenticator has already been registered.');
    }
    return newAuthenticator;
  } else {
    throw new Error('Passkey verification failed.');
  }
}
