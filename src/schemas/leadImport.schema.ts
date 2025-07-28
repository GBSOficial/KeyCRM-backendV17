import { z } from "zod";
import { createLeadSchema } from "./lead.schema";

// Schema para validar cada lead individual na importação
export const importLeadSchema = createLeadSchema.extend({
  position: z.string().optional(),
  description: z.string().optional(),
  country: z.string().optional(),
  zip: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url("Website inválido").optional(),
});

// Schema para os campos de fallback
export const importFallbackSchema = z.object({
  status: z.enum([
    "NOVOS_LEADS",
    "CONTATO_INICIAL",
    "QUALIFICACAO",
    "NEGATIVA",
    "SEM_RETORNO",
    "NEGOCIACAO",
    "REGISTRO_CONTRATO",
    "CONVERTIDOS"
  ]).optional(),
  source: z.string().optional(),
});

// Schema para validar tipos de arquivo permitidos
export const allowedFileTypes = z.enum([
  "csv",
  "xls",
  "xlsx",
  "json"
]);

// Schema para validação do arquivo de importação
export const fileImportSchema = z.object({
  file: z.any(),
  fileType: allowedFileTypes,
  fallback: importFallbackSchema.optional()
});

// Schema principal para a requisição de importação
export const leadImportRequestSchema = z.object({
  leads: z.array(importLeadSchema),
  fallback: importFallbackSchema
});

// Schema para a resposta da simulação
export const leadImportSimulationResponseSchema = z.object({
  valid: z.array(importLeadSchema),
  invalid: z.array(z.object({
    data: z.any(),
    errors: z.array(z.object({
      field: z.string(),
      message: z.string()
    }))
  })),
  summary: z.object({
    total: z.number(),
    valid: z.number(),
    invalid: z.number()
  })
});

// Tipos TypeScript
export type TLeadImport = z.infer<typeof importLeadSchema>;
export type TLeadImportRequest = z.infer<typeof leadImportRequestSchema>;
export type TLeadImportSimulationResponse = z.infer<typeof leadImportSimulationResponseSchema>;
export type TFileImport = z.infer<typeof fileImportSchema>; 