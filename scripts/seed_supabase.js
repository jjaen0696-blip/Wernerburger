/*
Seed products (menu) into Supabase.
Usage:
  SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed_supabase.js

This script requires: npm install @supabase/supabase-js node-fetch
*/
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function main() {
  const file = path.join(__dirname, 'menuData.json');
  const items = JSON.parse(fs.readFileSync(file, 'utf8'));

  console.log(`Seeding ${items.length} products...`);

  for (const it of items) {
    const payload = {
      id: it.id,
      name: it.name,
      price: it.price,
      description: it.description,
      category: it.category,
      image: it.image,
      is_popular: !!it.isPopular,
      is_featured: !!it.isFeatured
    };
    const { data, error } = await supabase.from('products').upsert(payload).select().single();
    if (error) {
      console.error('Failed to upsert', it.id, error.message || error);
    } else {
      console.log('Upserted', data.id);
    }
  }

  console.log('Seeding complete');
}

main().catch((err) => { console.error(err); process.exit(1); });
