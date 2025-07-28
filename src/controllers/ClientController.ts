import { Request, Response } from 'express';
import { prisma } from '../database/prismaClient';

export const index = async (req: Request, res: Response) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            img: true
          }
        }
      }
    });
    return res.json(clients);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const show = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const client = await prisma.client.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            img: true
          }
        }
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    return res.json(client);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, nif, marca, consultorNotes, rua, bairro, cep, city, state, country, userId, convertedFromLead } = req.body;

    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        nif,
        marca,
        consultorNotes,
        rua,
        bairro,
        cep,
        city,
        state,
        country,
        userId,
        convertedFromLead
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            img: true
          }
        }
      }
    });

    return res.status(201).json(client);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, nif, marca, consultorNotes, rua, bairro, cep, city, state, country, userId } = req.body;

    const client = await prisma.client.update({
      where: { id: Number(id) },
      data: {
        name,
        email,
        phone,
        nif,
        marca,
        consultorNotes,
        rua,
        bairro,
        cep,
        city,
        state,
        country,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            img: true
          }
        }
      }
    });

    return res.json(client);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.client.delete({
      where: { id: Number(id) }
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const projects = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const projects = await prisma.project.findMany({
      where: { clientId: Number(id) },
      include: {
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
                img: true
              }
            }
          }
        }
      }
    });

    return res.json(projects);
  } catch (error) {
    console.error('Erro ao listar projetos do cliente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}; 