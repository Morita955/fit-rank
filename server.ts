import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DB_PATH = path.resolve(process.cwd(), 'data', 'fitrank_db.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  salt: string;
  photoURL?: string;
  emailVerified: boolean;
  verificationCode?: string;
  verificationCodeExpiresAt?: number;
  resetCode?: string;
  resetCodeExpiresAt?: number;
  goalPullUps: number;
  goalPushUps: number;
  goalSitUps: number;
  goalRunningKm: number;
  createdAt: string;
  updatedAt: string;
}

interface ActivityRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  pullUps: number;
  pushUps: number;
  sitUps: number;
  runningKm: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ConnectionRecord {
  id: string;
  userA: string;
  userB: string;
  requesterId: string;
  targetId: string;
  requesterName: string;
  targetName: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  activities: ActivityRecord[];
  connections: ConnectionRecord[];
  sessions: { token: string; userId: string; expiresAt: number }[];
}

function loadDB(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error loading DB, initializing new:', e);
  }
  const initial = initializeSeedDB();
  saveDB(initial);
  return initial;
}

function saveDB(db: DatabaseSchema) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Seed spreadsheet benchmark data (Allan, Samuel, Jose, Jairo, Thiago) from the attachment
function initializeSeedDB(): DatabaseSchema {
  const salt = 'fitrank_benchmark_salt';
  const defaultPassHash = hashPassword('123456', salt);
  const now = new Date().toISOString();

  const benchmarkUsers: UserRecord[] = [
    {
      id: 'usr_allan',
      email: 'allan.kayro95@gmail.com',
      displayName: 'Allan',
      passwordHash: defaultPassHash,
      salt,
      emailVerified: true,
      goalPullUps: 200,
      goalPushUps: 1000,
      goalSitUps: 500,
      goalRunningKm: 50,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_samuel',
      email: 'samuel@fitrank.com',
      displayName: 'Samuel',
      passwordHash: defaultPassHash,
      salt,
      emailVerified: true,
      goalPullUps: 200,
      goalPushUps: 1000,
      goalSitUps: 500,
      goalRunningKm: 50,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_jose',
      email: 'jose@fitrank.com',
      displayName: 'Jose',
      passwordHash: defaultPassHash,
      salt,
      emailVerified: true,
      goalPullUps: 200,
      goalPushUps: 1000,
      goalSitUps: 500,
      goalRunningKm: 50,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_jairo',
      email: 'jairo@fitrank.com',
      displayName: 'Jairo',
      passwordHash: defaultPassHash,
      salt,
      emailVerified: true,
      goalPullUps: 200,
      goalPushUps: 1000,
      goalSitUps: 500,
      goalRunningKm: 50,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_thiago',
      email: 'thiago@fitrank.com',
      displayName: 'Thiago',
      passwordHash: defaultPassHash,
      salt,
      emailVerified: true,
      goalPullUps: 200,
      goalPushUps: 1000,
      goalSitUps: 500,
      goalRunningKm: 50,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Activities faithfully representing the spreadsheet attached image
  const benchmarkActivities: ActivityRecord[] = [
    // Allan: Jan (345 barras, 1835 flexões, 193 abdominais, 15 km), Fev (243 barras, 610 flexões, 20 abdominais, 12.65 km), Mar (52 barras, 10.5 km)
    { id: 'act_a1', userId: 'usr_allan', date: '2026-01-15', pullUps: 345, pushUps: 1835, sitUps: 193, runningKm: 15, notes: 'Janeiro épico', createdAt: now, updatedAt: now },
    { id: 'act_a2', userId: 'usr_allan', date: '2026-02-10', pullUps: 243, pushUps: 610, sitUps: 20, runningKm: 12.65, notes: 'Fevereiro forte', createdAt: now, updatedAt: now },
    { id: 'act_a3', userId: 'usr_allan', date: '2026-03-05', pullUps: 52, pushUps: 0, sitUps: 0, runningKm: 10.5, notes: 'Março', createdAt: now, updatedAt: now },
    { id: 'act_a0', userId: 'usr_allan', date: '2025-12-20', pullUps: 0, pushUps: 245, sitUps: 50, runningKm: 0, notes: 'Dezembro inicial', createdAt: now, updatedAt: now },

    // Samuel: Dez (29 barras, 1110 flexões), Jan (40 barras, 1758 flexões), Fev (109 barras, 2068 flexões), Mar (2006 flexões), Abr (664 flexões), Mai (466 flexões), Jun (414 flexões)
    { id: 'act_s0', userId: 'usr_samuel', date: '2025-12-15', pullUps: 29, pushUps: 1110, sitUps: 0, runningKm: 0, createdAt: now, updatedAt: now },
    { id: 'act_s1', userId: 'usr_samuel', date: '2026-01-20', pullUps: 40, pushUps: 1758, sitUps: 0, runningKm: 0, createdAt: now, updatedAt: now },
    { id: 'act_s2', userId: 'usr_samuel', date: '2026-02-18', pullUps: 109, pushUps: 2068, sitUps: 0, runningKm: 0, createdAt: now, updatedAt: now },
    { id: 'act_s3', userId: 'usr_samuel', date: '2026-03-22', pullUps: 0, pushUps: 2006, sitUps: 0, runningKm: 0, createdAt: now, updatedAt: now },
    { id: 'act_s4', userId: 'usr_samuel', date: '2026-04-10', pullUps: 0, pushUps: 664, sitUps: 0, runningKm: 0, createdAt: now, updatedAt: now },
    { id: 'act_s5', userId: 'usr_samuel', date: '2026-05-15', pullUps: 0, pushUps: 466, sitUps: 0, runningKm: 0, createdAt: now, updatedAt: now },
    { id: 'act_s6', userId: 'usr_samuel', date: '2026-06-12', pullUps: 0, pushUps: 414, sitUps: 0, runningKm: 0, createdAt: now, updatedAt: now },

    // Jose: Dez (730 flexões, 625 abdominais, 55.4 km corrida), Jan (25 flexões, 1 km corrida)
    { id: 'act_j0', userId: 'usr_jose', date: '2025-12-28', pullUps: 0, pushUps: 730, sitUps: 625, runningKm: 55.4, createdAt: now, updatedAt: now },
    { id: 'act_j1', userId: 'usr_jose', date: '2026-01-10', pullUps: 0, pushUps: 25, sitUps: 0, runningKm: 1.0, createdAt: now, updatedAt: now },

    // Jairo: Dez (12 barras, 130 flexões, 50 abdominais)
    { id: 'act_jr0', userId: 'usr_jairo', date: '2025-12-18', pullUps: 12, pushUps: 130, sitUps: 50, runningKm: 0, createdAt: now, updatedAt: now },
  ];

  // Connections between benchmark users
  const connections: ConnectionRecord[] = [
    {
      id: 'conn_allan_samuel',
      userA: 'usr_allan',
      userB: 'usr_samuel',
      requesterId: 'usr_allan',
      targetId: 'usr_samuel',
      requesterName: 'Allan',
      targetName: 'Samuel',
      status: 'accepted',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'conn_allan_jose',
      userA: 'usr_allan',
      userB: 'usr_jose',
      requesterId: 'usr_allan',
      targetId: 'usr_jose',
      requesterName: 'Allan',
      targetName: 'Jose',
      status: 'accepted',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'conn_allan_jairo',
      userA: 'usr_allan',
      userB: 'usr_jairo',
      requesterId: 'usr_allan',
      targetId: 'usr_jairo',
      requesterName: 'Allan',
      targetName: 'Jairo',
      status: 'accepted',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'conn_allan_thiago',
      userA: 'usr_allan',
      userB: 'usr_thiago',
      requesterId: 'usr_allan',
      targetId: 'usr_thiago',
      requesterName: 'Allan',
      targetName: 'Thiago',
      status: 'accepted',
      createdAt: now,
      updatedAt: now,
    },
  ];

  return {
    users: benchmarkUsers,
    activities: benchmarkActivities,
    connections,
    sessions: [],
  };
}

async function start() {
  const app = express();
  app.use(express.json());

  // Database in-memory reference
  let db = loadDB();

  // Middleware: Auth token verification
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    const token = authHeader.split(' ')[1];
    const session = db.sessions.find((s) => s.token === token && s.expiresAt > Date.now());
    if (!session) {
      return res.status(401).json({ error: 'Sessão expirada ou inválida. Faça login novamente.' });
    }
    const user = db.users.find((u) => u.id === session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    (req as any).user = user;
    (req as any).token = token;
    next();
  };

  // 1. Auth: Register (Criar Conta com E-mail e Senha)
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Informe nome, e-mail e senha.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      // If it's a pre-seeded account, allow setting password and claiming account immediately
      if (existing.salt === 'fitrank_benchmark_salt') {
        const salt = crypto.randomBytes(16).toString('hex');
        existing.displayName = name.trim() || existing.displayName;
        existing.salt = salt;
        existing.passwordHash = hashPassword(password, salt);
        existing.updatedAt = new Date().toISOString();

        const token = generateToken();
        db.sessions.push({
          token,
          userId: existing.id,
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        });
        saveDB(db);

        const { passwordHash: _, salt: __, ...userProfile } = existing;
        return res.json({ token, user: userProfile });
      }
      return res.status(400).json({ error: 'Este e-mail já está cadastrado. Faça login com sua senha.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    const verificationCodeExpiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes

    const newUser: UserRecord = {
      id: userId,
      email: cleanEmail,
      displayName: name.trim(),
      passwordHash,
      salt,
      emailVerified: false,
      verificationCode,
      verificationCodeExpiresAt,
      goalPullUps: 200,
      goalPushUps: 1000,
      goalSitUps: 500,
      goalRunningKm: 50,
      createdAt: now,
      updatedAt: now,
    };

    db.users.push(newUser);

    // Create session
    const token = generateToken();
    db.sessions.push({
      token,
      userId,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    saveDB(db);

    const { passwordHash: _, salt: __, ...userProfile } = newUser;
    return res.json({
      token,
      user: userProfile,
      verificationCode,
      message: 'Conta criada! Enviamos um código de confirmação para o seu e-mail.',
    });
  });

  // 1.1 Verify Email Code
  app.post('/api/auth/verify-email', (req: Request, res: Response) => {
    const { code, email } = req.body;
    let targetUser: UserRecord | undefined;

    // Check if authenticated via Bearer token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const session = db.sessions.find((s) => s.token === token && s.expiresAt > Date.now());
      if (session) {
        targetUser = db.users.find((u) => u.id === session.userId);
      }
    }

    if (!targetUser && email) {
      targetUser = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    }

    if (!targetUser) {
      return res.status(401).json({ error: 'Usuário não autenticado ou e-mail não encontrado.' });
    }

    if (!code) {
      return res.status(400).json({ error: 'Informe o código de 6 dígitos.' });
    }

    if (targetUser.emailVerified) {
      const { passwordHash: _, salt: __, ...userProfile } = targetUser;
      return res.json({ success: true, message: 'E-mail já está confirmado!', user: userProfile });
    }

    if (!targetUser.verificationCode || targetUser.verificationCode !== code.trim()) {
      return res.status(400).json({ error: 'Código de confirmação incorreto.' });
    }

    if (targetUser.verificationCodeExpiresAt && targetUser.verificationCodeExpiresAt < Date.now()) {
      return res.status(400).json({ error: 'Código expirado. Solicite um novo código.' });
    }

    targetUser.emailVerified = true;
    delete targetUser.verificationCode;
    delete targetUser.verificationCodeExpiresAt;
    targetUser.updatedAt = new Date().toISOString();
    saveDB(db);

    const { passwordHash: _, salt: __, ...userProfile } = targetUser;
    return res.json({
      success: true,
      message: 'E-mail confirmado com sucesso!',
      user: userProfile,
    });
  });

  // 1.2 Resend Email Verification Code
  app.post('/api/auth/resend-verification', (req: Request, res: Response) => {
    const { email } = req.body;
    let targetUser: UserRecord | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const session = db.sessions.find((s) => s.token === token && s.expiresAt > Date.now());
      if (session) {
        targetUser = db.users.find((u) => u.id === session.userId);
      }
    }

    if (!targetUser && email) {
      targetUser = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    targetUser.verificationCode = verificationCode;
    targetUser.verificationCodeExpiresAt = Date.now() + 30 * 60 * 1000;
    saveDB(db);

    return res.json({
      success: true,
      verificationCode,
      message: 'Novo código de confirmação enviado para seu e-mail.',
    });
  });

  // 1.3 Forgot Password (Solicitar Recuperação de Senha)
  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Informe seu e-mail.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return res.status(404).json({ error: 'Nenhum atleta cadastrado com este e-mail.' });
    }

    const resetCode = String(Math.floor(100000 + Math.random() * 900000));
    user.resetCode = resetCode;
    user.resetCodeExpiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes
    saveDB(db);

    return res.json({
      success: true,
      resetCode,
      message: `Código de recuperação gerado para ${cleanEmail}.`,
    });
  });

  // 1.4 Reset Password (Redefinir Senha com Código)
  app.post('/api/auth/reset-password', (req: Request, res: Response) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Preencha o e-mail, código e a nova senha.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (!user.resetCode || user.resetCode !== code.trim()) {
      return res.status(400).json({ error: 'Código de recuperação inválido.' });
    }

    if (user.resetCodeExpiresAt && user.resetCodeExpiresAt < Date.now()) {
      return res.status(400).json({ error: 'Código expirado. Solicite outro código.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    user.salt = salt;
    user.passwordHash = hashPassword(newPassword, salt);
    delete user.resetCode;
    delete user.resetCodeExpiresAt;
    user.updatedAt = new Date().toISOString();
    saveDB(db);

    return res.json({
      success: true,
      message: 'Senha redefinida com sucesso! Você já pode entrar com sua nova senha.',
    });
  });

  // 2. Auth: Login (Entrar com E-mail e Senha)
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Informe e-mail e senha.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const hash = hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const token = generateToken();
    db.sessions.push({
      token,
      userId: user.id,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });
    saveDB(db);

    const { passwordHash: _, salt: __, ...userProfile } = user;
    return res.json({ token, user: userProfile });
  });

  // 3. Auth: Current User
  app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user as UserRecord;
    const { passwordHash: _, salt: __, ...userProfile } = user;
    return res.json({ user: userProfile });
  });

  // 4. Auth: Logout
  app.post('/api/auth/logout', requireAuth, (req: Request, res: Response) => {
    const token = (req as any).token;
    db.sessions = db.sessions.filter((s) => s.token !== token);
    saveDB(db);
    return res.json({ success: true });
  });

  // 5. Auth: Update Goals / Profile
  app.put('/api/auth/profile', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user as UserRecord;
    const { displayName, goalPullUps, goalPushUps, goalSitUps, goalRunningKm } = req.body;

    if (displayName) user.displayName = displayName.trim();
    if (goalPullUps !== undefined) user.goalPullUps = Number(goalPullUps) || 200;
    if (goalPushUps !== undefined) user.goalPushUps = Number(goalPushUps) || 1000;
    if (goalSitUps !== undefined) user.goalSitUps = Number(goalSitUps) || 500;
    if (goalRunningKm !== undefined) user.goalRunningKm = Number(goalRunningKm) || 50;
    user.updatedAt = new Date().toISOString();

    saveDB(db);
    const { passwordHash: _, salt: __, ...userProfile } = user;
    return res.json({ user: userProfile });
  });

  // 6. Users: Search athletes
  app.get('/api/users/search', requireAuth, (req: Request, res: Response) => {
    const currentUserId = (req as any).user.id;
    const query = (req.query.q as string || '').toLowerCase().trim();

    const results = db.users
      .filter((u) => u.id !== currentUserId)
      .filter((u) => !query || u.displayName.toLowerCase().includes(query) || u.email.toLowerCase().includes(query))
      .map((u) => ({
        id: u.id,
        uid: u.id,
        displayName: u.displayName,
        email: u.email,
        photoURL: u.photoURL,
      }));

    return res.json(results);
  });

  // 7. Workouts: Get user's activities for a month ("cada usuario pode ver somente suas coisas")
  app.get('/api/workouts', requireAuth, (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const year = parseInt(req.query.year as string, 10);
    const month = parseInt(req.query.month as string, 10);

    let list = db.activities.filter((a) => a.userId === userId);

    if (year && month) {
      const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
      list = list.filter((a) => a.date.startsWith(monthPrefix));
    }

    list.sort((a, b) => b.date.localeCompare(a.date));
    return res.json(list);
  });

  // 8. Workouts: Log or edit daily activity
  app.post('/api/workouts', requireAuth, (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { id, date, pullUps, pushUps, sitUps, runningKm, notes } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Data do treino é obrigatória.' });
    }

    const now = new Date().toISOString();

    if (id) {
      // Edit existing
      const existing = db.activities.find((a) => a.id === id && a.userId === userId);
      if (!existing) {
        return res.status(404).json({ error: 'Treino não encontrado ou não pertence a você.' });
      }
      existing.date = date;
      existing.pullUps = Number(pullUps) || 0;
      existing.pushUps = Number(pushUps) || 0;
      existing.sitUps = Number(sitUps) || 0;
      existing.runningKm = Math.round((Number(runningKm) || 0) * 100) / 100;
      existing.notes = notes?.trim() || '';
      existing.updatedAt = now;
      saveDB(db);
      return res.json(existing);
    } else {
      // Create new
      const newAct: ActivityRecord = {
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        date,
        pullUps: Number(pullUps) || 0,
        pushUps: Number(pushUps) || 0,
        sitUps: Number(sitUps) || 0,
        runningKm: Math.round((Number(runningKm) || 0) * 100) / 100,
        notes: notes?.trim() || '',
        createdAt: now,
        updatedAt: now,
      };
      db.activities.push(newAct);
      saveDB(db);
      return res.json(newAct);
    }
  });

  // 9. Workouts: Delete
  app.delete('/api/workouts/:id', requireAuth, (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const actId = req.params.id;

    const initialLen = db.activities.length;
    db.activities = db.activities.filter((a) => !(a.id === actId && a.userId === userId));

    if (db.activities.length === initialLen) {
      return res.status(404).json({ error: 'Treino não encontrado.' });
    }

    saveDB(db);
    return res.json({ success: true });
  });

  // 10. Connections: List all connections for current user
  app.get('/api/connections', requireAuth, (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const list = db.connections.filter((c) => c.userA === userId || c.userB === userId);
    return res.json(list);
  });

  // 11. Connections: Send invite ("para ver o rank precisa se inscrever")
  app.post('/api/connections/request', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user as UserRecord;
    const { targetUserId } = req.body;

    if (!targetUserId || targetUserId === user.id) {
      return res.status(400).json({ error: 'Usuário alvo inválido.' });
    }

    const targetUser = db.users.find((u) => u.id === targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Atleta não encontrado.' });
    }

    // Check existing
    const existing = db.connections.find(
      (c) =>
        (c.userA === user.id && c.userB === targetUserId) ||
        (c.userA === targetUserId && c.userB === user.id)
    );

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ error: 'Vocês já estão conectados no ranking!' });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({ error: 'Já existe uma solicitação pendente.' });
      }
    }

    const now = new Date().toISOString();
    const newConn: ConnectionRecord = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userA: user.id < targetUserId ? user.id : targetUserId,
      userB: user.id < targetUserId ? targetUserId : user.id,
      requesterId: user.id,
      targetId: targetUserId,
      requesterName: user.displayName,
      targetName: targetUser.displayName,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    db.connections.push(newConn);
    saveDB(db);
    return res.json(newConn);
  });

  // 12. Connections: Accept invite ("precisa ser aceito pelo outro usuario")
  app.put('/api/connections/:id/accept', requireAuth, (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const connId = req.params.id;

    const conn = db.connections.find((c) => c.id === connId);
    if (!conn) {
      return res.status(404).json({ error: 'Solicitação não encontrada.' });
    }

    if (conn.targetId !== userId) {
      return res.status(403).json({ error: 'Apenas quem recebeu a solicitação pode aceitar.' });
    }

    conn.status = 'accepted';
    conn.updatedAt = new Date().toISOString();
    saveDB(db);
    return res.json(conn);
  });

  // 13. Connections: Decline / Remove
  app.delete('/api/connections/:id', requireAuth, (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const connId = req.params.id;

    db.connections = db.connections.filter(
      (c) => !(c.id === connId && (c.userA === userId || c.userB === userId))
    );
    saveDB(db);
    return res.json({ success: true });
  });

  // 14. Ranking: Month ranking for current user + accepted connections
  app.get('/api/ranking', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserRecord;
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();
    const month = parseInt(req.query.month as string, 10) || (new Date().getMonth() + 1);

    // Find all accepted friends
    const acceptedConns = db.connections.filter(
      (c) => (c.userA === currentUser.id || c.userB === currentUser.id) && c.status === 'accepted'
    );

    const athleteIds = [currentUser.id];
    acceptedConns.forEach((c) => {
      const otherId = c.userA === currentUser.id ? c.userB : c.userA;
      if (!athleteIds.includes(otherId)) athleteIds.push(otherId);
    });

    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

    const USER_COLORS: Record<string, string> = {
      Allan: '#2563eb',
      Jairo: '#dc2626',
      Samuel: '#eab308',
      Jose: '#16a34a',
      José: '#16a34a',
      Thiago: '#ea580c',
    };

    const summaries = athleteIds.map((uid) => {
      const user = db.users.find((u) => u.id === uid) || {
        id: uid,
        displayName: 'Atleta',
        goalPullUps: 200,
        goalPushUps: 1000,
        goalSitUps: 500,
        goalRunningKm: 50,
      };

      const userActs = db.activities.filter((a) => a.userId === uid && a.date.startsWith(monthPrefix));

      let pullUps = 0;
      let pushUps = 0;
      let sitUps = 0;
      let runningKm = 0;

      userActs.forEach((a) => {
        pullUps += a.pullUps || 0;
        pushUps += a.pushUps || 0;
        sitUps += a.sitUps || 0;
        runningKm += a.runningKm || 0;
      });

      runningKm = Math.round(runningKm * 100) / 100;

      const gPull = user.goalPullUps || 200;
      const gPush = user.goalPushUps || 1000;
      const gSit = user.goalSitUps || 500;
      const gRun = user.goalRunningKm || 50;

      const pctPullUps = Math.round((pullUps / gPull) * 100);
      const pctPushUps = Math.round((pushUps / gPush) * 100);
      const pctSitUps = Math.round((sitUps / gSit) * 100);
      const pctRunningKm = Math.round((runningKm / gRun) * 100);
      const averageScore = Math.round((pctPullUps + pctPushUps + pctSitUps + pctRunningKm) / 4);

      const cleanName = user.displayName.split(' ')[0];
      const color = USER_COLORS[cleanName] || (uid === currentUser.id ? '#2563eb' : '#64748b');

      return {
        userId: user.id,
        userName: user.displayName,
        color,
        isCurrentUser: uid === currentUser.id,
        pullUps,
        pushUps,
        sitUps,
        runningKm,
        pctPullUps,
        pctPushUps,
        pctSitUps,
        pctRunningKm,
        averageScore,
      };
    });

    summaries.sort((a, b) => b.averageScore - a.averageScore);
    return res.json(summaries);
  });

  // 15. Multi-Month History (for the 4 spreadsheet charts: Dezembro a Novembro)
  app.get('/api/ranking/multi-month', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserRecord;
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();

    const acceptedConns = db.connections.filter(
      (c) => (c.userA === currentUser.id || c.userB === currentUser.id) && c.status === 'accepted'
    );

    const athleteIds = [currentUser.id];
    acceptedConns.forEach((c) => {
      const otherId = c.userA === currentUser.id ? c.userB : c.userA;
      if (!athleteIds.includes(otherId)) athleteIds.push(otherId);
    });

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const USER_COLORS: Record<string, string> = {
      Allan: '#2563eb',
      Jairo: '#dc2626',
      Samuel: '#eab308',
      Jose: '#16a34a',
      José: '#16a34a',
      Thiago: '#ea580c',
    };

    const results = athleteIds.map((uid) => {
      const user = db.users.find((u) => u.id === uid) || { id: uid, displayName: 'Atleta' };
      const monthlyData = [];

      for (let m = 1; m <= 12; m++) {
        // If month is 12 (Dezembro), consider either previous year or current year December
        const mStr = String(m).padStart(2, '0');
        const prefix = `${year}-${mStr}`;
        const prevPrefix = `${year - 1}-${mStr}`;

        const acts = db.activities.filter(
          (a) => a.userId === uid && (a.date.startsWith(prefix) || (m === 12 && a.date.startsWith(prevPrefix)))
        );

        let pullUps = 0;
        let pushUps = 0;
        let sitUps = 0;
        let runningKm = 0;

        acts.forEach((a) => {
          pullUps += a.pullUps || 0;
          pushUps += a.pushUps || 0;
          sitUps += a.sitUps || 0;
          runningKm += a.runningKm || 0;
        });

        monthlyData.push({
          month: m,
          monthName: monthNames[m - 1],
          pullUps,
          pushUps,
          sitUps,
          runningKm: Math.round(runningKm * 100) / 100,
        });
      }

      const cleanName = user.displayName.split(' ')[0];
      const color = USER_COLORS[cleanName] || (uid === currentUser.id ? '#2563eb' : '#64748b');

      return {
        userId: user.id,
        userName: user.displayName,
        color,
        isCurrentUser: uid === currentUser.id,
        monthlyData,
      };
    });

    return res.json(results);
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FitRank server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
});
