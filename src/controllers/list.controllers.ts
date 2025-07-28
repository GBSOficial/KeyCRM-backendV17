import { Request, Response } from "express";
import { ListServices } from "../services/list.services";

export class ListControllers {
  async create(req: Request, res: Response) {
    const service = new ListServices();
    const list = await service.create(req.body);
    return res.status(201).json(list);
  }

  async findManyByBoard(req: Request, res: Response) {
    const service = new ListServices();
    const lists = await service.findManyByBoard(Number(req.params.boardId));
    return res.status(200).json(lists);
  }

  async findOne(req: Request, res: Response) {
    const service = new ListServices();
    const list = await service.findOne(Number(req.params.id));
    if (!list) return res.status(404).json({ message: "Lista não encontrada" });
    return res.status(200).json(list);
  }

  async update(req: Request, res: Response) {
    const service = new ListServices();
    const list = await service.update(Number(req.params.id), req.body);
    return res.status(200).json(list);
  }

  async delete(req: Request, res: Response) {
    const service = new ListServices();
    await service.delete(Number(req.params.id));
    return res.status(204).send();
  }
} 