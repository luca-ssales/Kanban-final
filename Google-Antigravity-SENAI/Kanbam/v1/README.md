# 🚀 KanbanFlow - Sistema Kanban com Autenticação JWT e Persistência JSON

O **KanbanFlow** é uma aplicação completa de gerenciamento visual de tarefas e projetos com **Autenticação JWT segura**, isolamento de dados por usuário, revogação de tokens (blacklist), dashboard analítico em tempo real e persistência puramente em arquivos JSON (sem banco de dados).

---

## 🛠️ Stack Tecnológica

- **Front-End**: Vanilla JavaScript (HTML5 / CSS3 / ES6+) com manipuladores de eventos assíncronos, formulários responsivos e suporte a temas (Modo Claro e Modo Escuro).
- **Back-End**: Servidor HTTP em Node.js com módulos nativos (`http`, `fs`, `path`, `crypto`).
- **Autenticação**: JSON Web Token (JWT) nativo HMAC-SHA256 contendo `jti` (UUID único do token) e expiração configurável.
- **Segurança de Senhas**: Criptografia unilateral segura via `crypto.scryptSync` com sal único por usuário.
- **Persistência**: Arquivos JSON locais (`kanban_data.json`, `users.json`, `revoked-tokens.json`).

---

## ⚙️ Variáveis de Ambiente

As seguintes variáveis de ambiente podem ser configuradas antes de iniciar o servidor (ou serão aplicados os valores padrão):

| Variável | Descrição | Valor Padrão |
| :--- | :--- | :--- |
| `PORT` | Porta de execução do servidor HTTP | `8080` |
| `JWT_SECRET` | Chave secreta usada para assinar e validar os tokens JWT | `kanbanflow_secret_key_jwt_2026` |
| `JWT_EXPIRATION` | Tempo de expiração do token JWT em segundos | `3600` (1 hora) |

---

## 🔄 Executando a Migração de Dados Existentes

Se o sistema já possui dados em `kanban_data.json` criados anteriormente sem um `userId`, execute o script de migração para atribuí-los a um usuário padrão de forma segura:

```bash
node migrate.js
```

### O que o script de migração faz:
1. Verifica o arquivo `users.json`. Se não houver nenhum usuário cadastrado, cria o usuário administrador padrão:
   - **E-mail**: `admin@kanban.com`
   - **Senha**: `admin123`
2. Associa todas as tarefas e quadros existentes em `kanban_data.json` que não possuem `userId` ao ID do usuário `admin@kanban.com`.

---

## 🚀 Como Iniciar a Aplicação

1. Entre na pasta do projeto:
   ```cmd
   cd "c:\Users\Aluno\Downloads\Nova pasta\Google-Antigravity-SENAI\Kanbam\v1"
   ```

2. (Primeira execução) Rode o script de migração:
   ```cmd
   node migrate.js
   ```

3. Inicie o servidor Node.js:
   ```cmd
   node server.js
   ```

4. Acesse no seu navegador: **[http://localhost:8080](http://localhost:8080)**

---

## 🔒 Arquitetura de Autenticação & Revogação

1. **Cadastro (`POST /auth/register`)**:
   - Cria um novo registro em `users.json` com senha com hash seguro (`scrypt`).
   - Inicializa um quadro padrão ("Projeto Principal") para o novo usuário.
   - Retorna um token JWT assinado.

2. **Login (`POST /auth/login`)**:
   - Compara o e-mail e verifica a hash da senha.
   - Retorna um access token JWT contendo `userId`, `email`, `iat`, `exp` e `jti`.

3. **Intersecção & Proteção (`/api/data`)**:
   - Toda chamada a `/api/data` exige o cabeçalho `Authorization: Bearer <token>`.
   - O servidor valida a assinatura, a expiração e verifica se o `jti` não consta em `revoked-tokens.json`.
   - **Isolamento de dados**: O servidor retorna e grava exclusivamente os quadros e tarefas pertencentes ao `userId` do token autenticado.

4. **Logout & Blacklist (`POST /auth/logout`)**:
   - Ao fazer logout, o `jti` do token é salvo no arquivo `revoked-tokens.json`.
   - Qualquer tentativa posterior de reutilizar esse token é rejeitada com status **401 Unauthorized**.
   - O servidor executa uma rotina automática periódica para remover da blacklist tokens cuja data original de expiração já passou.

---

## 📁 Lista de Arquivos Criados / Alterados

- 🟢 `v1/users.json` *(Novo)*: Armazenamento da base de usuários cadastrados.
- 🟢 `v1/revoked-tokens.json` *(Novo)*: Lista de revogação de tokens JWT (blacklist).
- 🟢 `v1/migrate.js` *(Novo)*: Script de migração de uso único para atribuição de `userId`.
- 🟢 `v1/README.md` *(Novo)*: Documentação completa da solução e instruções de execução.
- 🟡 `v1/server.js` *(Modificado)*: Adicionados endpoints `/auth/*`, validação de JWT, blacklist e isolamento por `userId`.
- 🟡 `v1/index.html` *(Modificado)*: Adicionados overlay/modal de autenticação (Login e Cadastro) e badge do usuário com Logout no header.
- 🟡 `v1/styles.css` *(Modificado)*: Adicionados estilos para a tela de autenticação e badge do usuário logado.
- 🟡 `v1/app.js` *(Modificado)*: Adicionado `AuthService` com interceptador de requisições, tratamento de erro 401 e manipulação de sessão.
