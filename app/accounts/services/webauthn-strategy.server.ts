import type { SessionStorage, SessionData } from '@remix-run/server-runtime';
import type { AuthenticateOptions, StrategyVerifyCallback } from 'remix-auth';
import { Strategy } from 'remix-auth';
import { verifyAuthenticationResponse } from '~/utils/simplewebauthn.server.ts';
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  PublicKeyCredentialDescriptorJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';
import { verifyNewAuthenticator } from './auth.server.ts';
import invariant from 'tiny-invariant';

interface WebAuthnAuthenticator {
  credentialID: string;
  transports: string[];
}

export interface Authenticator {
  credentialID: string;
  credentialPublicKey: string;
  counter: number;
  credentialDeviceType: string;
  credentialBackedUp: number;
  transports: string[];
}

export interface UserDetails {
  id: string;
  username: string;
  displayName?: string;
}

export interface WebAuthnOptionsResponse {
  usernameAvailable: boolean | null;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    username: string;
    displayName: string;
  } | null;
  challenge: string;
  authenticators: PublicKeyCredentialDescriptorJSON[];
}

/**
 * This interface declares what configuration the strategy needs from the
 * developer to correctly work.
 *
 * this is a slightly modified version of the remix-auth-webauthn
 * https://github.com/alexanderson1993/remix-auth-webauthn
 */
export interface WebAuthnOptions<User> {
  /**
   * Relaying Party name - The human-readable name of your app
   */
  rpName: string | ((request: Request) => Promise<string> | string);
  /**
   * Relaying Party ID -The hostname of the website, determines where passkeys can be used
   * @link https://www.w3.org/TR/webauthn-2/#relying-party-identifier
   */
  rpID: string | ((request: Request) => Promise<string> | string);
  /**
   * Website URL (or array of URLs) where the registration can occur
   */
  origin: string | string[];
  /**
   * Return a list of authenticators associated with the user.
   * @param user object
   * @returns Authenticator
   */
  getUserAuthenticators: (
    user: User | null,
  ) => Promise<WebAuthnAuthenticator[]> | WebAuthnAuthenticator[];
  /**
   * Transform the user object into the shape expected by the strategy.
   * You can use a regular username, the users email address, or something else.
   * @param user object
   * @returns UserDetails
   */
  getUserDetails: (user: User | null) => Promise<UserDetails | null> | UserDetails | null;
  /**
   * Find a user in the database with their username/email.
   * @param username
   * @returns User object
   */
  getUserByUsername: (username: string) => Promise<User | null> | User | null;
  /**
   * Find an authenticator in the database by its credential ID
   * @param id
   * @returns Authenticator
   */
  getAuthenticatorById: (id: string) => Promise<Authenticator | null> | Authenticator | null;
}

/**
 * This interface declares what the developer will receive from the strategy
 * to verify the user identity in their system.
 */
export type WebAuthnVerifyParams = {
  authenticator: Authenticator;
  type: 'registration' | 'authentication';
  username: string | null;
  userId: string | null;
};

export class WebAuthnStrategy<User> extends Strategy<User, WebAuthnVerifyParams> {
  name = 'webauthn';

  rpName: string | ((request: Request) => Promise<string> | string);
  rpID: string | ((request: Request) => Promise<string> | string);
  origin: string | string[];
  getUserAuthenticators: (
    user: User | null,
  ) => Promise<WebAuthnAuthenticator[]> | WebAuthnAuthenticator[];
  getUserDetails: (user: User | null) => Promise<UserDetails | null> | UserDetails | null;
  getUserByUsername: (username: string) => Promise<User | null> | User | null;
  getAuthenticatorById: (id: string) => Promise<Authenticator | null> | Authenticator | null;

  constructor(
    options: WebAuthnOptions<User>,
    verify: StrategyVerifyCallback<User, WebAuthnVerifyParams>,
  ) {
    super(verify);
    this.rpName = options.rpName;
    this.rpID = options.rpID;
    this.origin = options.origin;
    this.getUserAuthenticators = options.getUserAuthenticators;
    this.getUserDetails = options.getUserDetails;
    this.getUserByUsername = options.getUserByUsername;
    this.getAuthenticatorById = options.getAuthenticatorById;
  }

  async authenticate(
    request: Request,
    sessionStorage: SessionStorage<SessionData, SessionData>,
    options: AuthenticateOptions,
  ): Promise<User> {
    let session = await sessionStorage.getSession(request.headers.get('Cookie'));
    try {
      let user: User | null = session.get(options.sessionKey) ?? null;

      // User is already authenticated
      if (user && request.method === 'POST') {
        return this.success(user, request, sessionStorage, options);
      }

      const rp = {
        name: typeof this.rpName === 'function' ? await this.rpName(request) : this.rpName,
        id: typeof this.rpID === 'function' ? await this.rpID(request) : this.rpID,
      };

      if (request.method !== 'POST')
        throw new Error('Only use the WebAuthn authenticate with POST or GET requests.');

      const expectedChallenge = session.get('challenge');

      // Based on the authenticator response, either verify registration,
      // or verify authentication
      const formData = await request.formData();
      let data: unknown;
      try {
        const responseData = formData.get('response');
        if (typeof responseData !== 'string') throw new Error('Error');
        data = JSON.parse(responseData);
      } catch {
        throw new Error('Invalid passkey response JSON.');
      }
      const type = formData.get('type');
      if (type === 'registration') {
        const userId = formData.get('user-id');
        if (!userId) throw new Error('user-id is required');
        invariant(typeof userId === 'string', 'user-id is not a string');
        let username = formData.get('username');
        if (!username) throw new Error('username is required');
        invariant(typeof username === 'string', 'username is not a string');
        const newAuthenticator = await verifyNewAuthenticator(
          data as RegistrationResponseJSON,
          expectedChallenge,
        );
        user = await this.verify({
          authenticator: newAuthenticator,
          type: 'registration',
          username,
          userId,
        });
      } else if (type === 'authentication') {
        const authenticationData = data as AuthenticationResponseJSON;
        const authenticator = await this.getAuthenticatorById(authenticationData.id);
        if (!authenticator) throw new Error('Passkey not found.');

        const verification = await verifyAuthenticationResponse({
          response: authenticationData,
          expectedChallenge,
          expectedOrigin: this.origin,
          expectedRPID: rp.id,
          authenticator: {
            ...authenticator,
            credentialPublicKey: Buffer.from(authenticator.credentialPublicKey, 'base64url'),
            credentialID: Buffer.from(authenticator.credentialID, 'base64url'),
            transports: authenticator.transports as AuthenticatorTransportFuture[],
          },
        });

        if (!verification.verified) throw new Error('Passkey verification failed.');

        user = await this.verify({
          authenticator,
          type: 'authentication',
          username: null,
          userId: null,
        });
      } else {
        throw new Error('Invalid verification type.');
      }

      // Verify either registration or authentication
      return this.success(user, request, sessionStorage, options);
    } catch (error) {
      if (error instanceof Response) throw error;
      if (error instanceof Error) {
        return await this.failure(error.message, request, sessionStorage, options, error);
      }

      if (typeof error === 'string') {
        return await this.failure(error, request, sessionStorage, options, new Error(error));
      }

      return await this.failure(
        'Unknown error',
        request,
        sessionStorage,
        options,
        new Error(JSON.stringify(error, null, 2)),
      );
    }
  }
}
