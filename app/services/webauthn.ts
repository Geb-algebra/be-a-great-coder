import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/typescript-types';

export function handleFormSubmit(
  options: PublicKeyCredentialCreationOptionsJSON | PublicKeyCredentialRequestOptionsJSON,
  type: 'authentication' | 'registration' = 'registration',
) {
  return async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (
      !(event.nativeEvent instanceof SubmitEvent) ||
      !(event.nativeEvent.submitter instanceof HTMLButtonElement)
    ) {
      event.preventDefault();
      return false;
    }
    if (event.nativeEvent.submitter.formMethod === 'get') {
      return true;
    }

    const target = event.currentTarget;
    type = event.nativeEvent.submitter.value || target.type.value || type;
    event.preventDefault();

    const responseValue =
      type === 'authentication'
        ? JSON.stringify(await startAuthentication(options))
        : JSON.stringify(await startRegistration(options));
    let responseEl = target.querySelector('input[name="response"]') as HTMLInputElement;
    if (!responseEl) {
      responseEl = Object.assign(document.createElement('input'), {
        type: 'hidden',
        name: 'response',
      });
      target.prepend(responseEl);
    }
    responseEl.value = responseValue;

    let typeEl = target.querySelector('input[name="type"]') as HTMLInputElement;
    if (!typeEl) {
      typeEl = Object.assign(document.createElement('input'), {
        type: 'hidden',
        name: 'type',
      });
      target.prepend(typeEl);
    }
    typeEl.value = type;

    target.submit();
  };
}
