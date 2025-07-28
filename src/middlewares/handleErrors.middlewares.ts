import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/appError";
import { ZodError } from "zod";
import { JsonWebTokenError } from "jsonwebtoken";

export class HandleErrors {
  static execute = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ message: err.message });
      return;
    } else if (err instanceof JsonWebTokenError) {
      res.status(403).json({ message: err.message });
      return;
    } else if (err instanceof ZodError) {
      res.status(422).json(err);
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
}
