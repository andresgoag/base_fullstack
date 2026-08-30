const MINIMUM_LENGTH = 8;

const COMMON_PASSWORD_SAMPLE = [
  "password",
  "password1",
  "password123",
  "passw0rd",
  "12345678",
  "123456789",
  "1234567890",
  "987654321",
  "qwerty123",
  "qwertyuiop",
  "abc12345",
  "a1b2c3d4",
  "iloveyou",
  "letmein1",
  "welcome1",
  "welcome123",
  "admin123",
  "administrator",
  "superman",
  "starwars",
  "football",
  "football1",
  "baseball",
  "basketball",
  "princess",
  "sunshine",
  "trustno1",
  "monkey123",
  "dragon123",
  "michael1",
  "jennifer",
  "computer",
  "internet",
  "whatever",
  "changeme",
  "secret123",
  "master123",
  "shadow123",
  "freedom1",
  "1qaz2wsx",
];

export type PasswordProblem = {
  key: string;
  count?: number;
};

export type PasswordStrength = {
  score: number;
  labelKey: string;
  variant: "danger" | "warning" | "success";
  problems: PasswordProblem[];
};

const toComparableTokens = (values: string[]): string[] =>
  values
    .flatMap((value) => value.toLowerCase().split(/[^a-z0-9]+/))
    .filter((token) => token.length > 3);

const findProblems = (
  password: string,
  similarTo: string[],
): PasswordProblem[] => {
  const normalized = password.toLowerCase();
  const problems: PasswordProblem[] = [];
  if (password.length < MINIMUM_LENGTH) {
    problems.push({
      key: "passwordStrength.problem.minimumLength",
      count: MINIMUM_LENGTH,
    });
  }
  if (/^\d+$/.test(password)) {
    problems.push({ key: "passwordStrength.problem.onlyNumbers" });
  }
  if (COMMON_PASSWORD_SAMPLE.includes(normalized)) {
    problems.push({ key: "passwordStrength.problem.tooCommon" });
  }
  if (
    toComparableTokens(similarTo).some((token) => normalized.includes(token))
  ) {
    problems.push({ key: "passwordStrength.problem.personal" });
  }
  return problems;
};

const countVariety = (password: string): number =>
  [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) =>
    pattern.test(password),
  ).length;

export const evaluatePasswordStrength = (
  password: string,
  similarTo: string[] = [],
): PasswordStrength => {
  const problems = findProblems(password, similarTo);
  if (password.length === 0) {
    return { score: 0, labelKey: "", variant: "danger", problems: [] };
  }
  if (problems.length > 0) {
    return {
      score: 1,
      labelKey: "passwordStrength.weak",
      variant: "danger",
      problems,
    };
  }
  const variety = countVariety(password);
  if (variety >= 3 && password.length >= 12) {
    return {
      score: 4,
      labelKey: "passwordStrength.strong",
      variant: "success",
      problems,
    };
  }
  if (variety >= 2) {
    return {
      score: 3,
      labelKey: "passwordStrength.good",
      variant: "warning",
      problems,
    };
  }
  return {
    score: 2,
    labelKey: "passwordStrength.fair",
    variant: "warning",
    problems,
  };
};

export const isPasswordAcceptable = (
  password: string,
  similarTo: string[] = [],
): boolean => findProblems(password, similarTo).length === 0;
