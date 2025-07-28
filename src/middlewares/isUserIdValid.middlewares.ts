import { NextFunction, Request, Response } from "express";
import { prisma } from "../database/prisma";
import { AppError } from "../errors/appError";

export class IsUserIdValid{
    static async execute(req: Request, res: Response, next: NextFunction){
        const id = req.params.id;

        const user = await prisma.user.findFirst({where: { id: Number(id)}});

        if(!user){
            throw new AppError(404, "User not found!");
        }
        next();
    }
}