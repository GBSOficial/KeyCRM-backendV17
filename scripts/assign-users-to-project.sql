-- Script para atribuir usuários específicos aos projetos
-- Este script deve ser executado no banco de dados PostgreSQL

-- Primeiro, vamos verificar os usuários e projetos existentes
SELECT 'USUÁRIOS:' as info;
SELECT id, name, email, department FROM "User" WHERE email IN ('biel@email.com', 'biel2@email.com', 'biel3@email.com');

SELECT 'PROJETOS:' as info;
SELECT p.id, p.title, c.name as client_name, u.email as owner_email 
FROM "Project" p 
JOIN "Client" c ON p."clientId" = c.id 
JOIN "User" u ON c."userId" = u.id 
WHERE u.email = 'biel@email.com';

-- Inserir atribuições dos usuários aos projetos
-- Substitua os IDs pelos valores corretos encontrados nas consultas acima

-- Exemplo: Se o projeto tem ID 1 e os usuários têm IDs 2 e 3
-- INSERT INTO "ProjectUserAssignment" ("projectId", "userId", "role", "status", "assignedAt", "createdAt", "updatedAt")
-- VALUES 
--   (1, 2, 'MEMBER', 'ACTIVE', NOW(), NOW(), NOW()),
--   (1, 3, 'MEMBER', 'ACTIVE', NOW(), NOW(), NOW());

-- Para executar automaticamente, descomente e ajuste as linhas abaixo:
/*
WITH project_info AS (
  SELECT p.id as project_id
  FROM "Project" p 
  JOIN "Client" c ON p."clientId" = c.id 
  JOIN "User" u ON c."userId" = u.id 
  WHERE u.email = 'biel@email.com'
  LIMIT 1
),
user_info AS (
  SELECT id as user_id, email
  FROM "User" 
  WHERE email IN ('biel2@email.com', 'biel3@email.com')
)
INSERT INTO "ProjectUserAssignment" ("projectId", "userId", "role", "status", "assignedAt", "createdAt", "updatedAt")
SELECT 
  pi.project_id,
  ui.user_id,
  'MEMBER',
  'ACTIVE',
  NOW(),
  NOW(),
  NOW()
FROM project_info pi
CROSS JOIN user_info ui
ON CONFLICT ("projectId", "userId") DO UPDATE SET
  "status" = 'ACTIVE',
  "updatedAt" = NOW();
*/

-- Verificar as atribuições criadas
SELECT 'ATRIBUIÇÕES CRIADAS:' as info;
SELECT 
  pua.id,
  p.title as project_title,
  u.name as user_name,
  u.email as user_email,
  pua.role,
  pua.status,
  pua."assignedAt"
FROM "ProjectUserAssignment" pua
JOIN "Project" p ON pua."projectId" = p.id
JOIN "User" u ON pua."userId" = u.id
WHERE u.email IN ('biel2@email.com', 'biel3@email.com')
ORDER BY pua."assignedAt" DESC; 