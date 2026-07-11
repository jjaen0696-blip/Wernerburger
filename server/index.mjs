import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users.mjs';
import branchesRouter from './routes/branches.mjs';
import authRouter from './routes/auth.mjs';
import productsRouter from './routes/products.mjs';
import ordersRouter from './routes/orders.mjs';
import ingredientsRouter from './routes/ingredients.mjs';
import inventoryRouter from './routes/inventory.mjs';
import purchasesRouter from './routes/purchases.mjs';
import reportsRouter from './routes/reports.mjs';
import alertsRouter from './routes/alerts.mjs';

const app = express();
const corsOrigins = [
  process.env.CORS_ORIGIN,
  'https://wernerburger.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://wernerburger.onrender.com',
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
app.get('/health', (req, res) => res.json({ ok: true, server: 'WernerBurger API' }));

// Protect mutating endpoints: require either Authorization header (JWT from client) or an admin API key header
const publicMutations = ['/auth/lookup', '/orders'];
function protectMutations(req, res, next) {
  if (req.method === 'GET') return next();
  if (publicMutations.includes(req.path)) return next();
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
app.use('/products', productsRouter);
app.use('/ingredients', ingredientsRouter);
app.use('/inventory', inventoryRouter);
app.use('/purchases', purchasesRouter);
app.use('/reports', reportsRouter);
app.use('/alerts', alertsRouter);
app.use('/orders', ordersRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  if (err instanceof Error && err.message.startsWith('Origin ')) {
    return res.status(403).json({ error: 'CORS origin denied' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
