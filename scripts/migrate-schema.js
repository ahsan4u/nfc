const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1].trim();
      let val = (match[2] || '').trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  });
}

async function migrate() {
  const sql = neon(process.env.DATABASE_URL);
  console.log("Migrating database schema...");

  try {
    await sql`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS compare_price NUMERIC(10, 2) DEFAULT NULL;
    `;
    console.log("Added compare_price column to products table.");

    await sql`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT NULL;
    `;
    console.log("Added image_url column to products table.");

    // Add some sample compare_prices to dishes so the discount badges are immediately visible!
    await sql`
      UPDATE products 
      SET compare_price = price + 20 
      WHERE name IN ('Vada Pav', 'Zinger Burger', 'Chicken Pizza', 'Shawarma', 'Falooda', 'BBQ Chicken Wings');
    `;
    console.log("Updated sample compare prices.");

    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration error:", err);
  }
}

migrate();
