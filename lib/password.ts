// password rules in one place so register / reset / account settings all match

export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordRule {
  key: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { key: "length", label: `At least ${PASSWORD_MIN_LENGTH} characters`, test: (pw) => pw.length >= PASSWORD_MIN_LENGTH },
  { key: "upper",  label: "One uppercase letter",                        test: (pw) => /[A-Z]/.test(pw) },
  { key: "number", label: "One number",                                  test: (pw) => /[0-9]/.test(pw) },
  { key: "symbol", label: "One symbol (!?#$%…)",                         test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export function passwordMeetsPolicy(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

export function firstUnmetRule(password: string): PasswordRule | null {
  return PASSWORD_RULES.find((rule) => !rule.test(password)) ?? null;
}
