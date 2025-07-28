import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
const ms = require("ms");

const prisma = new PrismaClient();

export class ApiTokenServices {
  async create({ userId, name, expiresIn }: { userId: number, name: string, expiresIn: string }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Usuário não encontrado");

    const now = new Date();
    const msValue = ms(expiresIn || "1d");
    if (typeof msValue !== "number") {
      throw new Error("Formato de expiresIn inválido. Use exemplos como '1d', '30d', '12h'.");
    }
    const expires = new Date(now.getTime() + msValue);

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: expiresIn || "1d" }
    );

    const apiToken = await prisma.apiToken.create({
      data: {
        userId: user.id,
        name,
        token,
        createdAt: now,
        expiresAt: expires,
      },
      include: { user: true }
    });

    return apiToken;
  }

  async findMany() {
    return prisma.apiToken.findMany({ include: { user: true } });
  }

  async findOne(id: number) {
    const token = await prisma.apiToken.findUnique({ where: { id }, include: { user: true } });
    if (!token) throw new Error("Token não encontrado");
    return token;
  }

  async update(id: number, data: { name?: string; expiresIn?: string }) {
    const token = await prisma.apiToken.findUnique({ where: { id } });
    if (!token) throw new Error("Token não encontrado");

    let expiresAt = token.expiresAt;
    if (data.expiresIn) {
      const msValue = require("ms")(data.expiresIn);
      if (typeof msValue !== "number") {
        throw new Error("Formato de expiresIn inválido. Use exemplos como '1d', '30d', '12h'.");
      }
      expiresAt = new Date(Date.now() + msValue);
    }

    return prisma.apiToken.update({
      where: { id },
      data: {
        name: data.name ?? token.name,
        expiresAt,
      },
      include: { user: true }
    });
  }

  async delete(id: number) {
    const token = await prisma.apiToken.findUnique({ where: { id } });
    if (!token) throw new Error("Token não encontrado");
    await prisma.apiToken.delete({ where: { id } });
    return { message: "Token deletado com sucesso" };
  }
}
