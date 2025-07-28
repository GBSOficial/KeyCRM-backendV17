# KeyCRM Backend

API REST para o sistema KeyCRM, desenvolvida com Node.js, TypeScript e Prisma ORM.

## Tecnologias Utilizadas

- Node.js
- TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- JWT para autenticação
- Swagger para documentação
- Multer para upload de arquivos

## Requisitos

- Node.js 20.x ou superior
- PostgreSQL
- npm ou yarn

## Configuração do Ambiente

1. Clone o repositório:
```bash
git clone https://github.com/gbsoficial/KeyCRM-backend
cd KeyCRM-backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Banco de dados
DATABASE_URL="postgresql://user:password@localhost:5432/keycrm?schema=public"

# JWT
JWT_SECRET="seu-segredo-jwt"

# Servidor
PORT=3000
```

4. Execute as migrações do banco de dados:
```bash
npx prisma migrate dev
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

6. Para produção:
```bash
npm run build
npm start
```

## Estrutura do Projeto

```
src/
├── controllers/    # Controladores da aplicação
├── middlewares/    # Middlewares (auth, upload, etc)
├── routes/         # Rotas da API
├── services/       # Lógica de negócio
└── utils/          # Funções utilitárias
```

## Documentação da API

A documentação da API está disponível através do Swagger UI em:
- Desenvolvimento: `http://localhost:3000/api-docs`
- Produção: `https://seu-dominio.com/api-docs`

## Endpoints Principais

- `POST /auth/login` - Autenticação de usuários
- `POST /auth/register` - Registro de novos usuários
- `GET /users` - Lista de usuários
- `POST /clients` - Criação de clientes
- `GET /clients` - Lista de clientes
- `POST /uploads` - Upload de arquivos

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm run build` - Compila o projeto
- `npm start` - Inicia o servidor em modo produção
- `npm run test` - Executa os testes
- `npx prisma studio` - Abre o Prisma Studio para gerenciar o banco de dados

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE.MIT](LICENSE.MIT) para mais detalhes. 