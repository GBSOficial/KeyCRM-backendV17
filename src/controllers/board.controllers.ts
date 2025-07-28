import { Request, Response } from "express";
import { BoardServices } from "../services/board.services";

export class BoardControllers {
  async create(req: Request, res: Response) {
    const service = new BoardServices();
    const board = await service.create(req.body);
    return res.status(201).json(board);
  }

  async findMany(req: Request, res: Response) {
    const service = new BoardServices();
    const boards = await service.findMany();
    return res.status(200).json(boards);
  }

  async findOne(req: Request, res: Response) {
    const service = new BoardServices();
    const board = await service.findOne(Number(req.params.id));
    if (!board) return res.status(404).json({ message: "Board não encontrado" });
    return res.status(200).json(board);
  }

  async update(req: Request, res: Response) {
    const service = new BoardServices();
    const board = await service.update(Number(req.params.id), req.body);
    return res.status(200).json(board);
  }

  async delete(req: Request, res: Response) {
    const service = new BoardServices();
    await service.delete(Number(req.params.id));
    return res.status(204).send();
  }
} 