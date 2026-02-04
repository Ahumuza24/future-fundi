export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = "UNKNOWN_ERROR"
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const handleError = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return "An unexpected error occurred";
};

export const isNetworkError = (error: unknown): boolean => {
  // Logic to determine if it is network error
  return false; // placeholder
};
