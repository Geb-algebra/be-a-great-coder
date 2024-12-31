import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import { Authenticator } from "remix-auth";
import invariant from "tiny-invariant";
import { AccountFactory, AccountRepository } from "~/accounts/lifecycle/account.server";
import { UserRepository } from "~/accounts/lifecycle/user.server.ts";
import type { User } from "~/accounts/models/account.ts";
import { verifyRegistrationResponse } from "~/utils/simplewebauthn.server.ts";

import { GoogleStrategy } from "remix-auth-google";
import { WebAuthnStrategy } from "remix-auth-webauthn";
import { getAuthenticatorById } from "~/accounts/lifecycle/authenticator.server.ts";
import { IntegrityError, ObjectNotFoundError, ValueError } from "~/errors.ts";
import { getSession, sessionStorage } from "~/services/session.server.ts";

export const authenticator = new Authenticator<User>(sessionStorage);

export async function isUsernameAvailable(username: string) {
  const user = await UserRepository.getByName(username);
  return !user;
}

// we reuse them to add new passkeys to authenticated users
export const WEBAUTHN_RP_NAME = "Be a great coder";
// http://localhost:3000 -> localhost, https://8bitstack.com -> 8bitstack.com
invariant(process.env.APP_URL, "environment variable APP_URL is required");
export const WEBAUTHN_RP_ID = process.env.APP_URL.split("://")[1].split(":")[0];
export const WEBAUTHN_ORIGIN = process.env.APP_URL;

export const webAuthnStrategy = new WebAuthnStrategy<User>(
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
      if (!account) return [];
      return account.authenticators;
    },
    // Transform the user object into the shape expected by the strategy.
    // You can use a regular username, the users email address, or something else.
    getUserDetails: (user) => {
      invariant(user, "User is required.");
      return { id: user.id, username: user.name };
    },
    getUserByUsername: (username) => UserRepository.getByName(username),
    getAuthenticatorById: async (id) => {
      const authenticator = await getAuthenticatorById(id);
      if (!authenticator) throw new ObjectNotFoundError("Authenticator not found");
      return { ...authenticator, transports: authenticator.transports.join(",") };
    },
  },
  async ({ authenticator, type, username }) => {
    const savedAuthenticator = await getAuthenticatorById(authenticator.credentialID);
    if (type === "registration") {
      // Check if the authenticator exists in the database
      if (savedAuthenticator) {
        throw new IntegrityError("Authenticator has already been registered.");
      }
      invariant(username, "Username is required.");
      const { authenticators, ...user } = await AccountFactory.create({
        name: username,
        authenticators: [
          { ...authenticator, transports: authenticator.transports.split(","), name: null },
        ],
      });
      await AccountRepository.save({ authenticators, ...user });
      return user;
    }
    if (type === "authentication") {
      if (!savedAuthenticator) throw new ObjectNotFoundError("Authenticator not found");
      const account = await AccountRepository.getById(savedAuthenticator.userId);
      if (!account) throw new ObjectNotFoundError("Account not found");
      const { authenticators, ...user } = account;
      return user;
    }
    throw new ValueError("Invalid verification type");
  },
);

authenticator.use(webAuthnStrategy, "webauthn");

invariant(
  process.env.GOOGLE_AUTH_CLIENT_ID,
  "environment variable GOOGLE_AUTH_CLIENT_ID is required",
);
invariant(
  process.env.GOOGLE_AUTH_CLIENT_SECRET,
  "environment variable GOOGLE_AUTH_CLIENT_SECRET is required",
);

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_AUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
    callbackURL: `${process.env.APP_URL}/google/callback`,
  },
  async ({ accessToken, refreshToken, extraParams, profile }) => {
    // Get the user data from your DB or API using the tokens and profile
    let account = await AccountRepository.getByGoogleProfileId(profile.id);
    if (!account) {
      account = await AccountFactory.create({
        name: profile.displayName,
        googleProfileId: profile.id,
      });
      await AccountRepository.save(account);
    }
    const { authenticators, ...user } = account;
    return user;
  },
);

authenticator.use(googleStrategy, "google");

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
    expectedChallenge: expectedChallenge ?? "",
    expectedOrigin: WEBAUTHN_ORIGIN,
    expectedRPID: WEBAUTHN_RP_ID,
  });

  if (verification.verified && verification.registrationInfo) {
    const { credential, credentialBackedUp, credentialDeviceType, aaguid } =
      verification.registrationInfo;

    const newAuthenticator = {
      credentialID: Buffer.from(credential.id).toString("base64url"),
      credentialPublicKey: Buffer.from(credential.publicKey).toString("base64url"),
      counter: credential.counter,
      credentialBackedUp,
      credentialDeviceType,
      transports: [""],
      aaguid,
    };
    const savedAuthenticator = await getAuthenticatorById(newAuthenticator.credentialID);
    if (savedAuthenticator) {
      throw new IntegrityError("Authenticator has already been registered.");
    }
    return newAuthenticator;
  }
  throw new ValueError("Passkey verification failed.");
}
