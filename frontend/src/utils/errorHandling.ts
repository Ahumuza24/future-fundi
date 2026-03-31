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
  if (!error || typeof error !== "object") {
    return false;
  }

  if ("code" in error && typeof (error as { code?: string }).code === "string") {
    const code = (error as { code?: string }).code;
    if (code === "ECONNABORTED" || code === "ECONNRESET") {
      return true;
    }
  }

  if ("message" in error && typeof (error as { message?: string }).message === "string") {
    const message = (error as { message?: string }).message?.toLowerCase() ?? "";
    return message.includes("network error") || message.includes("failed to fetch");
  }

  return false;
};
