-- Adiciona o campo chatCodeGenerations à tabela User
ALTER TABLE "User" ADD COLUMN "chatCodeGenerations" INTEGER NOT NULL DEFAULT 0;

-- Atualiza usuários existentes que já têm chatCode para ter 1 geração usada
UPDATE "User" SET "chatCodeGenerations" = 1 WHERE "chatCode" IS NOT NULL; 