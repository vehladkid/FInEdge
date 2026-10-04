// Password policy, kept pure so it can be tested and mutation-tested in isolation.
// 72 is bcrypt's input limit: longer passwords would be silently truncated.
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export function passwordProblems(password) {
  const problems = [];
  if (typeof password !== "string") return ["Password is required"];
  if (password.length < PASSWORD_MIN)
    problems.push(`Password must be at least ${PASSWORD_MIN} characters`);
  if (password.length > PASSWORD_MAX)
    problems.push(`Password must be at most ${PASSWORD_MAX} characters`);
  if (!/[A-Za-z]/.test(password)) problems.push("Password must contain a letter");
  if (!/[0-9]/.test(password)) problems.push("Password must contain a digit");
  return problems;
}
