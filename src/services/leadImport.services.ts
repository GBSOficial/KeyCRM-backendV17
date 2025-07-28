import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors/appError";
import { TLeadImport, TLeadImportRequest, TLeadImportSimulationResponse } from "../schemas/leadImport.schema";
import { LeadServices } from "./lead.services";
import { NotificationServices } from "./notification.services";
import { parse } from 'csv-parse';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Criar diretório de upload se não existir
const uploadDir = '/var/www/backend/uploads/temp';

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  } 
  
  // Verificar permissões
  fs.accessSync(uploadDir, fs.constants.W_OK);
} catch (error) {
  console.error('Erro ao criar/verificar diretório:', error);
}

export class LeadImportServices {
  private leadServices: LeadServices;
  private notificationServices: NotificationServices;

  constructor() {
    this.leadServices = new LeadServices();
    this.notificationServices = new NotificationServices();
  }

  private async parseCSV(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      fs.createReadStream(filePath)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true
        }))
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  private async parseExcel(filePath: string): Promise<any[]> {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  }

  private async parseJSON(filePath: string): Promise<any[]> {
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return Array.isArray(data) ? data : [data];
  }

  async processFile(file: Express.Multer.File, userId: number, fallback?: any): Promise<TLeadImportRequest> {
    try {
      let leads: any[] = [];
      const fileExtension = path.extname(file.originalname).toLowerCase();

      switch (fileExtension) {
        case '.csv':
          leads = await this.parseCSV(file.path);
          break;
        case '.xlsx':
        case '.xls':
          leads = await this.parseExcel(file.path);
          break;
        case '.json':
          leads = await this.parseJSON(file.path);
          break;
        default:
          throw new AppError(400, 'Formato de arquivo não suportado');
      }

      // Mapear os campos do arquivo para o formato esperado
      const mappedLeads = leads.map(lead => {
        // Garantir que o telefone seja uma string válida
        const phoneValue = lead.phone || lead.telefone || lead.Telefone;
        if (!phoneValue) {
          throw new AppError(400, `Telefone é obrigatório para o lead ${lead.name || lead.Nome || 'sem nome'}`);
        }
        const phone = String(phoneValue).trim();
        if (phone.length < 10) {
          throw new AppError(400, `Telefone inválido para o lead ${lead.name || lead.Nome || 'sem nome'}: deve ter pelo menos 10 dígitos`);
        }

        return {
          name: lead.name || lead.Nome,
          email: lead.email || lead.Email,
          phone,
          company: lead.company || lead.empresa || lead.Empresa,
          position: lead.position || lead.cargo || lead.Cargo,
          description: lead.description || lead.descricao || lead.Descricao,
          country: lead.country || lead.pais || lead.Pais,
          zip: lead.zip || lead.cep || lead.CEP,
          city: lead.city || lead.cidade || lead.Cidade,
          state: lead.state || lead.estado || lead.Estado,
          address: lead.address || lead.endereco || lead.Endereco,
          status: lead.status || fallback?.status || "NOVOS_LEADS",
          source: lead.source || lead.origem || fallback?.source || "IMPORTACAO",
          website: lead.website || lead.site || lead.Site
        };
      });

      // Limpar o arquivo temporário
      await fs.promises.unlink(file.path);

      return {
        leads: mappedLeads,
        fallback: fallback || {}
      };
    } catch (error) {
      // Garantir que o arquivo temporário seja removido em caso de erro
      if (file.path && fs.existsSync(file.path)) {
        await fs.promises.unlink(file.path);
      }
      throw error;
    }
  }

  async simulate(data: TLeadImportRequest, userId: number): Promise<TLeadImportSimulationResponse> {
    const { leads, fallback } = data;
    const validLeads: TLeadImport[] = [];
    const invalidLeads: { data: any; errors: { field: string; message: string }[] }[] = [];

    for (const lead of leads) {
      try {
        // Aplicar fallback values se necessário
        const processedLead = {
          ...lead,
          status: lead.status || fallback?.status || "NOVOS_LEADS",
          source: lead.source || fallback?.source || "IMPORTACAO"
        };

        // A validação acontecerá automaticamente através do Zod schema
        validLeads.push(processedLead);
      } catch (error: any) {
        invalidLeads.push({
          data: lead,
          errors: error.errors || [{ field: "unknown", message: error.message }],
        });
      }
    }

    return {
      valid: validLeads,
      invalid: invalidLeads,
      summary: {
        total: leads.length,
        valid: validLeads.length,
        invalid: invalidLeads.length,
      },
    };
  }

  async import(data: TLeadImportRequest, userId: number): Promise<{
    imported: number;
    failed: number;
    total: number;
  }> {
    const { leads, fallback } = data;
    let imported = 0;
    let failed = 0;

    for (const lead of leads) {
      try {
        // Aplicar fallback values se necessário
        const processedLead = {
          ...lead,
          status: lead.status || fallback?.status || "NOVOS_LEADS",
          source: lead.source || fallback?.source || "IMPORTACAO"
        };

        // Usar o serviço existente para criar o lead
        await this.leadServices.create(processedLead, userId);
        imported++;
      } catch (error) {
        console.error("Erro ao importar lead:", error);
        failed++;
      }
    }

    // Criar notificação sobre a importação
    await this.notificationServices.create({
      title: "Importação de Leads Concluída",
      message: `${imported} leads importados com sucesso. ${failed} falhas.`,
      userId,
    });

    return {
      imported,
      failed,
      total: leads.length,
    };
  }
} 