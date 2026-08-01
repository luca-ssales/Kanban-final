const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = parseInt(process.env.PORT || '8080', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'kanbanflow_secret_key_jwt_2026';
const JWT_EXPIRATION = parseInt(process.env.JWT_EXPIRATION || '3600', 10); // Em segundos (1h padrão)

const DATA_FILE = path.join(__dirname, 'kanban_data.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const REVOKED_TOKENS_FILE = path.join(__dirname, 'revoked-tokens.json');

// MIME Types Map
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// --- HELPER CRIPTO & JWT NATIVO ---
function base64UrlEncode(strOrBuf) {
  const buf = Buffer.isBuffer(strOrBuf) ? strOrBuf : Buffer.from(strOrBuf);
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

function generateUuid() {
  if (typeof crypto.randomUUID === 'function') {
    try { return crypto.randomUUID(); } catch (e) {}
  }
  return 'uuid-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === originalHash;
}

function generateJwt(payload, secret = JWT_SECRET) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  
  const signature = crypto.createHmac('sha256', secret)
    .update(signatureInput)
    .digest();
  
  const encodedSignature = base64UrlEncode(signature);
  return `${signatureInput}.${encodedSignature}`;
}

function verifyJwt(token, secret = JWT_SECRET) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = base64UrlEncode(
    crypto.createHmac('sha256', secret).update(signatureInput).digest()
  );

  if (encodedSignature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowInSeconds) {
      return null; // Expired token
    }
    return payload;
  } catch (e) {
    return null;
  }
}

// --- BLACKLIST & REVOCATION HELPER ---
function getRevokedTokens() {
  if (!fs.existsSync(REVOKED_TOKENS_FILE)) return [];
  try {
    const content = fs.readFileSync(REVOKED_TOKENS_FILE, 'utf8');
    return JSON.parse(content || '[]');
  } catch (e) {
    return [];
  }
}

function saveRevokedTokens(tokens) {
  fs.writeFileSync(REVOKED_TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf8');
}

function isTokenRevoked(jti) {
  if (!jti) return true;
  const list = getRevokedTokens();
  return list.some(item => item.jti === jti);
}

function revokeToken(jti, exp) {
  if (!jti) return;
  const list = getRevokedTokens();
  if (!list.some(item => item.jti === jti)) {
    list.push({ jti, exp, revokedAt: new Date().toISOString() });
    saveRevokedTokens(list);
  }
}

function purgeExpiredRevokedTokens() {
  const list = getRevokedTokens();
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const activeRevoked = list.filter(item => item.exp && item.exp > nowInSeconds);
  if (activeRevoked.length !== list.length) {
    saveRevokedTokens(activeRevoked);
    console.log(`[${new Date().toLocaleTimeString()}] 🧹 Blacklist limpa: ${list.length - activeRevoked.length} tokens expirados removidos.`);
  }
}

// Rodar limpeza inicial e agendar periodicamente (a cada 1 hora)
purgeExpiredRevokedTokens();
setInterval(purgeExpiredRevokedTokens, 60 * 60 * 1000);

// --- USERS PERSISTENCE HELPER ---
function getUsers() {
  let users = [];
  if (fs.existsSync(USERS_FILE)) {
    try {
      const content = fs.readFileSync(USERS_FILE, 'utf8');
      users = JSON.parse(content || '[]');
    } catch (e) {
      users = [];
    }
  }

  // Auto-seed do usuário administrador padrão se estiver vazio
  if (users.length === 0) {
    const defaultUser = {
      id: generateUuid(),
      nome: 'Admin Kanban',
      email: 'admin@kanban.com',
      senhaHash: hashPassword('admin123'),
      createdAt: new Date().toISOString()
    };
    users.push(defaultUser);
    saveUsers(users);
    console.log(`✅ Usuário padrão inicializado automaticamente: ${defaultUser.email} (Senha: admin123)`);
  }

  return users;
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// --- HTTP SERVER DEFINITION ---
const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- AUTH ENDPOINTS ---

  // 1. POST /auth/register
  if (req.url === '/auth/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { nome, email, senha } = JSON.parse(body);
        if (!nome || !email || !senha) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Campos nome, email e senha são obrigatórios' }));
          return;
        }

        const users = getUsers();
        const normEmail = email.toLowerCase().trim();

        if (users.some(u => u.email.toLowerCase().trim() === normEmail)) {
          res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Já existe um usuário cadastrado com este e-mail' }));
          return;
        }

        const newUserId = generateUuid();
        const newUser = {
          id: newUserId,
          nome: nome.trim(),
          email: normEmail,
          senhaHash: hashPassword(senha),
          createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);

        // Garante 1º Quadro Padrão para o novo usuário
        const kanbanData = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '{}') : {};
        if (!Array.isArray(kanbanData.boards)) kanbanData.boards = [];
        
        const defaultBoardId = generateUuid();
        const userBoard = {
          id: defaultBoardId,
          userId: newUserId,
          name: 'Projeto Principal',
          columns: [
            { id: generateUuid(), title: 'To Do', color: '#6c5ce7' },
            { id: generateUuid(), title: 'Doing', color: '#fdcb6e' },
            { id: generateUuid(), title: 'Done', color: '#00b894' }
          ],
          tasks: []
        };
        kanbanData.boards.push(userBoard);
        fs.writeFileSync(DATA_FILE, JSON.stringify(kanbanData, null, 2), 'utf8');

        // Gerar Token JWT
        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + JWT_EXPIRATION;
        const jti = generateUuid();

        const payload = { userId: newUser.id, email: newUser.email, iat, exp, jti };
        const token = generateJwt(payload);

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          token,
          user: { id: newUser.id, nome: newUser.nome, email: newUser.email }
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Requisição inválida ou JSON malformado' }));
      }
    });
    return;
  }

  // 2. POST /auth/login
  if (req.url === '/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { email, senha } = JSON.parse(body);
        if (!email || !senha) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'E-mail e senha são obrigatórios' }));
          return;
        }

        const users = getUsers();
        const normEmail = email.toLowerCase().trim();
        const user = users.find(u => u.email.toLowerCase().trim() === normEmail);

        if (!user || !verifyPassword(senha, user.senhaHash)) {
          res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Credenciais inválidas. Verifique e-mail e senha.' }));
          return;
        }

        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + JWT_EXPIRATION;
        const jti = generateUuid();

        const payload = { userId: user.id, email: user.email, iat, exp, jti };
        const token = generateJwt(payload);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          token,
          user: { id: user.id, nome: user.nome, email: user.email }
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'JSON inválido' }));
      }
    });
    return;
  }

  // 3. POST /auth/logout
  if (req.url === '/auth/logout' && req.method === 'POST') {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Cabeçalho Authorization com Bearer token é obrigatório' }));
      return;
    }

    const token = authHeader.substring(7).trim();
    const payload = verifyJwt(token);

    if (payload && payload.jti) {
      revokeToken(payload.jti, payload.exp);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, message: 'Logout realizado e token revogado com sucesso' }));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, message: 'Token já inválido ou expirado' }));
    }
    return;
  }

  // --- MIDDLEWARE DE AUTENTICAÇÃO PARA AS ROTAS PROTEGIDAS /api/* ---
  if (req.url.startsWith('/api/')) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Acesso negado. Token de autenticação não fornecido.' }));
      return;
    }

    const token = authHeader.substring(7).trim();
    const payload = verifyJwt(token);

    if (!payload) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Token inválido ou expirado. Faça login novamente.' }));
      return;
    }

    if (isTokenRevoked(payload.jti)) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Token revogado. Faça login novamente.' }));
      return;
    }

    req.user = payload; // Attach authenticated user payload to request
  }

  // API Endpoint: GET /api/data -> Retorna quadros e tarefas EXCLUSIVOS do usuário autenticado
  if (req.url === '/api/data' && req.method === 'GET') {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Erro ao ler arquivo kanban_data.json' }));
        return;
      }

      let parsedData = { boards: [] };
      try { parsedData = JSON.parse(data); } catch (e) {}

      // Filtrar quadros pertencentes ao userId autenticado
      const userBoards = (parsedData.boards || []).filter(b => b.userId === req.user.userId);

      // Garantir que cada quadro retorne apenas as tarefas deste userId
      userBoards.forEach(b => {
        if (Array.isArray(b.tasks)) {
          b.tasks = b.tasks.filter(t => t.userId === req.user.userId);
        } else {
          b.tasks = [];
        }
      });

      let activeBoardId = userBoards.length > 0 ? userBoards[0].id : null;

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        boards: userBoards,
        activeBoardId: activeBoardId,
        theme: parsedData.theme || { type: 'preset', presetId: 'theme-midnight' }
      }));
    });
    return;
  }

  // API Endpoint: POST /api/data -> Grava/atualiza apenas os dados do usuário autenticado
  if (req.url === '/api/data' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const incomingData = JSON.parse(body);
        let existingData = { boards: [] };
        
        if (fs.existsSync(DATA_FILE)) {
          try { existingData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '{}'); } catch (e) {}
        }
        if (!Array.isArray(existingData.boards)) existingData.boards = [];

        // Remover todos os quadros antigos do usuário atual
        let otherUsersBoards = existingData.boards.filter(b => b.userId !== req.user.userId);

        // Processar novos quadros enviados vinculando ao userId autenticado
        const newUsersBoards = (incomingData.boards || []).map(b => {
          b.userId = req.user.userId;
          if (Array.isArray(b.tasks)) {
            b.tasks.forEach(t => { t.userId = req.user.userId; });
          }
          return b;
        });

        // Fundir os quadros preservando os dos outros usuários
        existingData.boards = [...otherUsersBoards, ...newUsersBoards];
        if (incomingData.theme) existingData.theme = incomingData.theme;

        fs.writeFile(DATA_FILE, JSON.stringify(existingData, null, 2), 'utf8', (err) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, error: 'Erro ao salvar kanban_data.json' }));
            return;
          }
          console.log(`[${new Date().toLocaleTimeString()}] ✅ Dados salvos para o Usuário [${req.user.email}] em kanban_data.json`);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, message: 'Dados salvos com sucesso' }));
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'JSON inválido' }));
      }
    });
    return;
  }

  // Serve Arquivos Estáticos (Tratamento seguro de Query Strings)
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Página não encontrada');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Erro no servidor: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Servidor KanbanFlow (JWT Auth & JSON Storage) rodando em http://localhost:${PORT}`);
  console.log(`🔑 Segredo JWT configurado: ${JWT_SECRET.substring(0, 8)}*** (Expiração: ${JWT_EXPIRATION}s)`);
  console.log(`📂 Persistência de dados: ${DATA_FILE}\n`);
});
