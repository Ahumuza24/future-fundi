export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long." };
  }
  if (!/\d/.test(password)) {
    return { isValid: false, message: "Password must contain at least one digit." };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one uppercase letter." };
  }
  return { isValid: true };
};

export const validateRequired = (value: unknown): boolean => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};
