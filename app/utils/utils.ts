export function getRequiredStringFromFormData(
  formData: FormData,
  key: string,
  requiredMessage?: string,
) {
  const value = formData.get(key);
  if (!value) throw new Error(requiredMessage ?? `${key} is required`);
  if (typeof value !== "string") throw new Error(`${key} must be a string`);
  return value;
}
