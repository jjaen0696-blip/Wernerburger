import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users.mjs';
import branchesRouter from './routes/branches.mjs';
import authRouter from './routes/auth.mjs';

const app = express();
const corsOrigins = [
  process.env.CORS_ORIGIN,
  'https://wernerburger.vercel.app',
  'https://wernerburger.onrender.com',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || corsOrigins.length === 0 || corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-api-key'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Protect mutating endpoints: require either Authorization header (JWT from client) or an admin API key header
function protectMutations(req, res, next) {
  if (req.method === 'GET') return next();
  const adminKey = process.env.ADMIN_API_KEY;
  const provided = req.headers['x-admin-api-key'] || req.headers.authorization;
  if (!provided) return res.status(401).json({ error: 'Missing credentials' });
  if (typeof provided === 'string' && provided.startsWith('Bearer ')) return next();
  if (adminKey && provided === adminKey) return next();
  return res.status(403).json({ error: 'Forbidden' });
}

app.use(protectMutations);

app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/branches', branchesRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
