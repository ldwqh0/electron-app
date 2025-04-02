export default function(e: any): any {
  const result: Record<string, any> = {
    code: e.code,
    errors: e.errors,
    message: e.message,
    name: e.name,
    cause: e.cause,
    stack: e.stack
  };

  if (e.response !== null && e.response !== undefined) {
    result.response = {
      status: e.response.status,
      statusText: e.response.statusText,
      headers: e.response.headers,
      data: e.response.data
    };
  }
  return result;
}
