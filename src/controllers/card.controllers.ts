import { Request, Response } from "express";
import { CardServices } from "../services/card.services";

export class CardControllers {
  async create(req: Request, res: Response) {
    const service = new CardServices();
    const card = await service.create(req.body);
    return res.status(201).json(card);
  }

  async findManyByList(req: Request, res: Response) {
    const service = new CardServices();
    const cards = await service.findManyByList(Number(req.params.listId));
    return res.status(200).json(cards);
  }

  async findOne(req: Request, res: Response) {
    const service = new CardServices();
    const card = await service.findOne(Number(req.params.id));
    if (!card) return res.status(404).json({ message: "Card não encontrado" });
    return res.status(200).json(card);
  }

  async update(req: Request, res: Response) {
    const service = new CardServices();
    const card = await service.update(Number(req.params.id), req.body);
    return res.status(200).json(card);
  }

  async delete(req: Request, res: Response) {
    const service = new CardServices();
    await service.delete(Number(req.params.id));
    return res.status(204).send();
  }
} 