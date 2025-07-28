-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'string',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "SystemSetting_category_idx" ON "SystemSetting"("category");

-- Insert default settings
INSERT INTO "SystemSetting" ("key", "value", "category", "description", "type", "isPublic") VALUES
-- Configurações Gerais
('site_name', 'KeyCRM', 'general', 'Nome do sistema', 'string', true),
('site_description', 'Sistema de Gestão de Relacionamento com Cliente', 'general', 'Descrição do sistema', 'string', true),
('timezone', 'America/Sao_Paulo', 'general', 'Fuso horário padrão', 'string', true),
('language', 'pt-BR', 'general', 'Idioma padrão', 'string', true),
('maintenance_mode', 'false', 'general', 'Modo manutenção ativo', 'boolean', true),
('registration_enabled', 'true', 'general', 'Permitir registro de novos usuários', 'boolean', false),
('max_users', '100', 'general', 'Máximo de usuários permitidos', 'number', false),
('session_timeout', '30', 'general', 'Timeout de sessão em minutos', 'number', false),

-- Configurações de Segurança
('password_min_length', '8', 'security', 'Comprimento mínimo da senha', 'number', false),
('require_special_chars', 'true', 'security', 'Exigir caracteres especiais', 'boolean', false),
('require_numbers', 'true', 'security', 'Exigir números na senha', 'boolean', false),
('require_uppercase', 'true', 'security', 'Exigir maiúsculas na senha', 'boolean', false),
('max_login_attempts', '5', 'security', 'Máximo de tentativas de login', 'number', false),
('lockout_duration', '15', 'security', 'Duração do bloqueio em minutos', 'number', false),
('two_factor_enabled', 'false', 'security', 'Autenticação de dois fatores', 'boolean', false),
('password_expiration', '90', 'security', 'Expiração da senha em dias', 'number', false),
('ip_whitelist', '', 'security', 'Lista de IPs permitidos', 'string', false),
('api_rate_limit', '1000', 'security', 'Limite de taxa da API por hora', 'number', false),

-- Configurações de E-mail
('smtp_host', '', 'email', 'Servidor SMTP', 'string', false),
('smtp_port', '587', 'email', 'Porta SMTP', 'number', false),
('smtp_user', '', 'email', 'Usuário SMTP', 'string', false),
('smtp_password', '', 'email', 'Senha SMTP', 'password', false),
('smtp_secure', 'true', 'email', 'Usar SSL/TLS', 'boolean', false),
('from_name', 'KeyCRM', 'email', 'Nome do remetente', 'string', false),
('from_email', '', 'email', 'E-mail do remetente', 'string', false),
('email_verification_required', 'true', 'email', 'Exigir verificação de e-mail', 'boolean', false),
('welcome_email_enabled', 'true', 'email', 'E-mail de boas-vindas', 'boolean', false),
('notification_email_enabled', 'true', 'email', 'E-mails de notificação', 'boolean', false),

-- Configurações do Sistema
('auto_backup', 'true', 'system', 'Backup automático', 'boolean', false),
('backup_frequency', 'daily', 'system', 'Frequência do backup', 'string', false),
('max_backups', '7', 'system', 'Máximo de backups mantidos', 'number', false),
('log_level', 'info', 'system', 'Nível de log', 'string', false),
('max_log_size', '100', 'system', 'Tamanho máximo do log em MB', 'number', false),
('cache_enabled', 'true', 'system', 'Cache habilitado', 'boolean', false),
('cache_timeout', '3600', 'system', 'Timeout do cache em segundos', 'number', false),
('compression_enabled', 'true', 'system', 'Compressão Gzip', 'boolean', false),
('cdn_enabled', 'false', 'system', 'CDN habilitado', 'boolean', false),
('cdn_url', '', 'system', 'URL do CDN', 'string', false),

-- Configurações de Notificações
('email_notifications', 'true', 'notifications', 'Notificações por e-mail', 'boolean', false),
('push_notifications', 'false', 'notifications', 'Push notifications', 'boolean', false),
('desktop_notifications', 'true', 'notifications', 'Notificações desktop', 'boolean', false),
('sound_enabled', 'true', 'notifications', 'Som das notificações', 'boolean', false),
('notification_frequency', 'immediate', 'notifications', 'Frequência de notificações', 'string', false),
('quiet_hours_enabled', 'false', 'notifications', 'Horário silencioso ativo', 'boolean', false),
('quiet_hours_start', '22:00', 'notifications', 'Início do horário silencioso', 'string', false),
('quiet_hours_end', '08:00', 'notifications', 'Fim do horário silencioso', 'string', false); 