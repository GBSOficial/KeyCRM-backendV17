import { Request, Response } from "express";
import { NotificationServices } from "../services/notification.services";

export class NotificationControllers {
  async create(req: Request, res: Response): Promise<Response> {
    const notificationServices = new NotificationServices();
    const data = await notificationServices.create(req.body);
    return res.status(201).json(data);
  }

  async findMany(req: Request, res: Response): Promise<Response> {
    const notificationServices = new NotificationServices();
    const userId = Number(req.params.userId);
    const data = await notificationServices.findMany(userId);
    return res.status(200).json(data);
  }

  async markAsRead(req: Request, res: Response): Promise<Response> {
    const notificationServices = new NotificationServices();
    const userId = Number(req.params.userId);
    const id = Number(req.params.id);
    await notificationServices.markAsRead(id, userId);
    return res.status(204).send();
  }

  async markAllAsRead(req: Request, res: Response): Promise<Response> {
    const notificationServices = new NotificationServices();
    const userId = Number(req.params.userId);
    await notificationServices.markAllAsRead(userId);
    return res.status(204).send();
  }

  async delete(req: Request, res: Response): Promise<Response> {
    const notificationServices = new NotificationServices();
    const userId = Number(req.params.userId);
    const id = Number(req.params.id);
    await notificationServices.delete(id, userId);
    return res.status(204).send();
  }
} 