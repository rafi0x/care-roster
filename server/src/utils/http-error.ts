export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new HttpError(404, 'NOT_FOUND', `${what} not found`);
