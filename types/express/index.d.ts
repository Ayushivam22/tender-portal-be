declare namespace Express {
  interface Request {
    userId?: number,
    isAuthorized?: boolean

  }
  interface Response {
    isAuthorized?: boolean
  }
}