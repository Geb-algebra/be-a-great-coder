import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/types';
import { Authenticator } from 'remix-auth';
import invariant from 'tiny-invariant';
import { type User, AccountFactory, AccountRepository } from '~/models/account.server.ts';
import { UserRepository } from '~/models/user.server.ts';

import { WebAuthnStrategy } from '~/services/webauthn-strategy.server.ts';
import { getSession, sessionStorage } from '~/services/session.server.ts';
import { getAuthenticatorById } from '~/models/authenticator.server.ts';
import { GoogleStrategy } from 'remix-auth-google';

export let authenticator = new Authenticator<User>(sessionStorage);

export async function isUsernameAvailable(username: string) {
  try {
    await UserRepository.getByName(username);
    return false;
  } catch (error) {
    return true;
  }
}

// we reuse them to add new passkeys to authenticated users
export const WEBAUTHN_RP_NAME = 'Be a great coder';
// http://localhost:3000 -> localhost, https://8bitstack.com -> 8bitstack.com
export const WEBAUTHN_RP_ID = process.env.APP_URL!.split('://')[1].split(':')[0];
export const WEBAUTHN_ORIGIN = process.env.APP_URL!;

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
        const { authenticators, ...user } = await AccountFactory.create({
          name: username,
          id: userId,
          authenticators: [{ ...authenticator, name: null }],
        });
        return user;
      } else if (type === 'authentication') {
        if (!savedAuthenticator) throw new Error('Authenticator not found');
        const { authenticators, ...user } = await AccountRepository.getById(
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

let googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_AUTH_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET!,
    callbackURL: `${process.env.APP_URL}/google/callback`,
  },
  async ({ accessToken, refreshToken, extraParams, profile }) => {
    // Get the user data from your DB or API using the tokens and profile
    let account;
    try {
      account = await AccountRepository.getByGoogleProfileId(profile.id);
    } catch (error) {
      account = await AccountFactory.create({
        name: profile.displayName,
        googleProfileId: profile.id,
      });
    }
    const { authenticators, ...user } = account;
    return user;
  },
);

authenticator.use(googleStrategy, 'google');

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
