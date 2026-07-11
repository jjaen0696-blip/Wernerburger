import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users.mjs';
import branchesRouter from './routes/branches.mjs';

const app = express();
app.use(cors());
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

app.use('/users', usersRouter);
app.use('/branches', branchesRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
