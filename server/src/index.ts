import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createRepository, Role, User } from './repository';

const repo = createRepository();
const SECRET = process.env.JWT_SECRET || 'dev-only-secret';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const strip = ({ password, ...rest }: User) => rest;
const wrap = (fn: (req: any, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

const app = express();
app.use(cors(), express.json());

// ?delay=2000 simulates a slow network on any endpoint (capped at 10s)
app.use(async (req, _res, next) => { await sleep(Math.min(Number(req.query.delay) || 0, 10000)); next(); });

interface AuthedRequest extends Request { user?: User; }

const auth = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const { sub } = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET) as { sub: string };
    const user = await repo.user(sub);
    if (!user) throw new Error('missing');
    req.user = user; next();
  } catch { res.status(401).json({ message: 'Session expired. Please sign in again.' }); }
};
const admin = (req: AuthedRequest, res: Response, next: NextFunction) =>
  req.user?.role === 'Admin' ? next() : res.status(403).json({ message: 'Admin access required.' });

app.post('/api/auth/login', wrap(async (req, res) => {
  const { userId, password, role } = req.body;
  const user = await repo.user(userId);
  if (!user || user.role !== role || !(await bcrypt.compare(password ?? '', user.password)))
    return res.status(401).json({ message: 'User ID, password or role is incorrect.' });
  res.json({ token: jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: '2h' }), user: strip(user) });
}));

app.get('/api/auth/me', auth, (req: AuthedRequest, res) => res.json(strip(req.user!)));

app.get('/api/records', auth, wrap(async (req: AuthedRequest, res) => {
  const role = req.user!.role;
  res.json((await repo.records()).filter(r => role === 'Admin' || r.access === 'General User'));
}));

app.get('/api/users', auth, admin, wrap(async (_req, res) => res.json((await repo.users()).map(strip))));

app.post('/api/users', auth, admin, wrap(async (req, res) => {
  const b = req.body as User;
  if (!b.id || !b.password || !b.name) return res.status(400).json({ message: 'ID, name and password are required.' });
  if (await repo.user(b.id)) return res.status(409).json({ message: 'That User ID already exists.' });
  const created: User = { id: b.id, name: b.name, password: await bcrypt.hash(b.password, 10), role: (b.role as Role) || 'General User', department: b.department || '-', email: b.email || '-' };
  await repo.saveUser(created);
  res.status(201).json(strip(created));
}));

app.put('/api/users/:id', auth, admin, wrap(async (req, res) => {
  const existing = await repo.user(req.params.id);
  if (!existing) return res.status(404).json({ message: 'User not found.' });
  const { id, password, ...changes } = req.body;
  const updated = { ...existing, ...changes, password: password ? await bcrypt.hash(password, 10) : existing.password };
  await repo.saveUser(updated);
  res.json(strip(updated));
}));

app.delete('/api/users/:id', auth, admin, wrap(async (req: AuthedRequest, res) => {
  if (req.params.id === req.user!.id) return res.status(400).json({ message: 'You cannot delete your own account.' });
  await repo.deleteUser(req.params.id);
  res.status(204).end();
}));

app.use((e: Error, _req: Request, res: Response, _next: NextFunction) => res.status(500).json({ message: 'Something went wrong on the server.' }));
app.listen(3000, () => console.log(`API on http://localhost:3000 (store: ${process.env.STORE || 'json'})`));
