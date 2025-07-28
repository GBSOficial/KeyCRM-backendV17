import { z } from "zod";

export const createLeadSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  company: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  status: z.enum([
    "NOVOS_LEADS",
    "CONTATO_INICIAL",
    "QUALIFICACAO",
    "NEGATIVA",
    "SEM_RETORNO",
    "NEGOCIACAO",
    "REGISTRO_CONTRATO",
    "CONVERTIDOS"
  ]),
  source: z.string().optional(),
  notes: z.string().optional(),
  value: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateLeadSchema = createLeadSchema.partial(); 