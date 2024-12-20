# Sistema de Amigo Oculto

Um sistema web para organizar amigos ocultos de forma fácil e divertida.

## Pré-requisitos

- Node.js (versão 18 ou superior)
- PostgreSQL (versão 12 ou superior)
- NPM ou Yarn

## Configuração do Banco de Dados

1. Crie um banco de dados PostgreSQL:
```sql
CREATE DATABASE amigo_oculto_db;
```

2. Configure o arquivo `.env` na raiz do projeto:
```env
# Configurações do Banco de Dados
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/amigo_oculto_db?schema=public"

# Configurações JWT
JWT_SECRET=sua_chave_secreta_muito_segura_123
JWT_REFRESH_SECRET=outra_chave_secreta_muito_segura_456
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Configurações do Servidor
PORT=3001
NODE_ENV=development
```

## Instalação

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITORIO]
cd [NOME_DA_PASTA]
```

2. Instale as dependências:
```bash
npm install
```

3. Execute as migrações do banco de dados:
```bash
npx prisma migrate dev
```

## Executando o Projeto

1. Inicie o servidor em modo desenvolvimento:
```bash
npm run dev
```

2. Acesse a aplicação:
- Abra o navegador e acesse: `http://localhost:3001`

## Funcionalidades

- Cadastro e login de usuários
- Criação de eventos de amigo oculto
- Gerenciamento de amigos
- Sorteio automático
- Sistema de convites
- Lista de desejos
- Notificações em tempo real

## Estrutura do Projeto

- `/src` - Código fonte do backend
- `/public` - Arquivos estáticos e frontend
- `/prisma` - Schemas e migrações do banco de dados

## Tecnologias Utilizadas

- Backend:
  - Node.js
  - Express
  - Prisma ORM
  - JWT para autenticação
  - PostgreSQL

- Frontend:
  - HTML5
  - CSS3
  - JavaScript
  - Fetch API

## Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das mudanças (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request 