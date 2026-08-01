const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, 'users.json');
const KANBAN_FILE = path.join(__dirname, 'kanban_data.json');

// Helper to hash password using scrypt
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function runMigration() {
  console.log('🔄 Iniciando migração de dados do KanbanFlow...');

  // 1. Load or Initialize Users
  let users = [];
  if (fs.existsSync(USERS_FILE)) {
    try {
      const content = fs.readFileSync(USERS_FILE, 'utf8');
      users = JSON.parse(content || '[]');
    } catch (e) {
      users = [];
    }
  }

  let defaultUser = users[0];
  if (!defaultUser) {
    const defaultUserId = crypto.randomUUID ? crypto.randomUUID() : 'admin-uuid-1000-0000';
    defaultUser = {
      id: defaultUserId,
      nome: 'Admin Kanban',
      email: 'admin@kanban.com',
      senhaHash: hashPassword('admin123'),
      createdAt: new Date().toISOString()
    };
    users.push(defaultUser);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    console.log(`✅ Usuário padrão criado: ${defaultUser.email} (Senha: admin123) [ID: ${defaultUser.id}]`);
  } else {
    console.log(`ℹ️ Usuário existente encontrado: ${defaultUser.email} [ID: ${defaultUser.id}]`);
  }

  // 2. Load and Migrate Kanban Data
  if (fs.existsSync(KANBAN_FILE)) {
    try {
      const content = fs.readFileSync(KANBAN_FILE, 'utf8');
      const data = JSON.parse(content || '{}');

      let boardsMigrated = 0;
      let tasksMigrated = 0;

      if (Array.isArray(data.boards)) {
        data.boards.forEach(board => {
          if (!board.userId) {
            board.userId = defaultUser.id;
            boardsMigrated++;
          }
          if (Array.isArray(board.tasks)) {
            board.tasks.forEach(task => {
              if (!task.userId) {
                task.userId = defaultUser.id;
                tasksMigrated++;
              }
            });
          }
        });
      }

      fs.writeFileSync(KANBAN_FILE, JSON.stringify(data, null, 2), 'utf8');
      console.log(`✅ Migração concluída com sucesso!`);
      console.log(`   - Quadros migrados: ${boardsMigrated}`);
      console.log(`   - Tarefas migradas: ${tasksMigrated}`);
    } catch (e) {
      console.error('❌ Erro ao processar kanban_data.json:', e);
    }
  } else {
    console.log('⚠️ Arquivo kanban_data.json não encontrado. Nenhuma tarefa para migrar.');
  }
}

runMigration();
