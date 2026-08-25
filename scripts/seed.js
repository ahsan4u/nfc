const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

// Manually load .env variables
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

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Error: DATABASE_URL environment variable is missing.");
  process.exit(1);
}

const dishesToSeed = [
  {
    img: 'street_bites_chaat',
    head: 'Street Bites & Chaat',
    menu: [
      { name: 'Vada Pav', price: 40 },
      { name: 'Bread Pakoda', price: 40 },
      { name: 'Samosa', price: 30 },
      { name: 'Chicken Samosa', price: 50 },
      { name: 'Bhajia', price: 40 },
      { name: 'Pani Puri', price: 40 }
    ]
  },
  {
    img: 'parathas',
    head: 'Parathas',
    menu: [
      { name: 'Aloo Paratha', price: 50 }
    ]
  },
  {
    img: 'burgers',
    head: 'Burgers',
    menu: [
      { name: 'Veg Burger', price: 80 },
      { name: 'Chicken Burger', price: 100 },
      { name: 'Zinger Burger', price: 120 }
    ]
  },
  {
    img: 'sandwiches',
    head: 'Sandwiches',
    menu: [
      { name: 'Veg Sandwich', price: 60 },
      { name: 'Chicken Sandwich', price: 90 },
      { name: 'Cheese Sandwich', price: 80 }
    ]
  },
  {
    img: 'pizzas',
    head: 'Pizzas',
    menu: [
      { name: 'Veg Pizza', price: 150 },
      { name: 'Chicken Pizza', price: 200 },
      { name: 'Cheese Corn Pizza', price: 170 }
    ]
  },
  {
    img: 'rolls_shawarma',
    head: 'Rolls & Shawarma',
    menu: [
      { name: 'Single Egg Roll', price: 50 },
      { name: 'Double Egg Roll', price: 70 },
      { name: 'Chicken Roll', price: 90 },
      { name: 'Shawarma', price: 100 }
    ]
  },
  {
    img: 'momos',
    head: 'Momos',
    menu: [
      { name: 'Veg Momos – Steam / Fry / Gravy', price: 80 },
      { name: 'Chicken Momos – Steam / Fry / Gravy', price: 100 },
      { name: 'Kurkure Momos', price: 110 }
    ]
  },
  {
    img: 'chinese_quick_bites',
    head: 'Chinese & Quick Bites',
    menu: [
      { name: 'Chicken Fried Rice', price: 120 },
      { name: 'Chicken Noodles', price: 120 },
      { name: 'Chicken Soup', price: 80 },
      { name: 'Manchurian (Dry/Gravy)', price: 110 },
      { name: 'French Fries', price: 80 },
      { name: 'Chilli Potato', price: 90 },
      { name: 'Crispy Corn', price: 100 },
      { name: 'Chicken Lollipop', price: 180 }
    ]
  },
  {
    img: 'mojitos_coolers',
    head: 'Mojitos & Coolers',
    menu: [
      { name: 'Mint Mojito', price: 70 },
      { name: 'Guava Mojito', price: 80 },
      { name: 'Blue Mojito', price: 80 }
    ]
  },
  {
    img: 'shakes_special_drinks',
    head: 'Shakes & Special Drinks',
    menu: [
      { name: 'Falooda', price: 90 },
      { name: 'Shakes', price: 80 },
      { name: 'Cold Coffee', price: 90 }
    ]
  },
  {
    img: 'tea_hot_beverages',
    head: 'Tea & Hot Beverages',
    menu: [
      { name: 'Tea', price: 20 },
      { name: 'Irani Tea', price: 25 }
    ]
  },
  {
    img: 'ice_gola',
    head: 'Ice Gola',
    menu: [
      { name: 'Cola', price: 40 },
      { name: 'Kala Khatta', price: 40 },
      { name: 'Rose', price: 40 },
      { name: 'Mango', price: 40 },
      { name: 'Orange', price: 40 }
    ]
  },
  {
    img: 'bbq_grills',
    head: 'BBQ & Grills',
    menu: [
      { name: 'Chicken Fry', price: 150 },
      { name: 'BBQ Chicken Tikka', price: 180 },
      { name: 'BBQ Chicken Wings', price: 160 },
      { name: 'Seekh Kebab', price: 170 },
      { name: 'Malai Boti', price: 190 }
    ]
  },
  {
    img: 'bakery_delights',
    head: 'Bakery Delights',
    menu: [
      { name: 'Pastries', price: 60 },
      { name: 'Cakes', price: 350 },
      { name: 'Cup Cakes', price: 40 },
      { name: 'Puff', price: 25 },
      { name: 'Cookies', price: 50 },
      { name: 'Brownies', price: 80 },
      { name: 'Donuts', price: 60 },
      { name: 'Maska Bun', price: 30 }
    ]
  },
  {
    img: 'indian_sweets',
    head: 'Indian Sweets (Traditional Delights)',
    menu: [
      { name: 'Jalebi', price: 50 },
      { name: 'Gulab Jamun', price: 40 },
      { name: 'Rasgulla', price: 55 },
      { name: 'Ras Malai', price: 60 },
      { name: 'Malai Roll', price: 70 },
      { name: 'Barfi', price: 80 },
      { name: 'Milk Cake', price: 90 },
      { name: 'Peda', price: 80 },
      { name: 'Motichoor Ladoo', price: 60 },
      { name: 'Chhena Rasgulla', price: 65 },
      { name: 'Chhena Ras Malai', price: 70 },
      { name: 'Sandesh', price: 75 },
      { name: 'Imarti', price: 60 },
      { name: 'Boondi', price: 50 },
      { name: 'Kesar Peda', price: 85 },
      { name: 'Kalakand', price: 90 },
      { name: 'Khoya Barfi', price: 85 },
      { name: 'Balushahi', price: 60 },
      { name: 'Son Papdi', price: 50 }
    ]
  }
];

async function seed() {
  console.log("Connecting to Neon PostgreSQL database...");
  const sql = neon(dbUrl);

  try {
    console.log("Creating tables if they do not exist...");
    
    // Create categories table
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        img VARCHAR(100) NOT NULL,
        display_order INT DEFAULT 0
      );
    `;

    // Create products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        category_id INT REFERENCES categories(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        available BOOLEAN DEFAULT TRUE
      );
    `;

    // Create config table
    await sql`
      CREATE TABLE IF NOT EXISTS config (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL
      );
    `;

    console.log("Seeding data...");

    // Insert config defaults
    await sql`
      INSERT INTO config (key, value)
      VALUES ('site_title', 'THE NAWAB SAHAB')
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    `;

    let displayOrder = 1;
    for (const cat of dishesToSeed) {
      console.log(`Processing category: ${cat.head}`);

      // Insert category
      const [categoryRow] = await sql`
        INSERT INTO categories (name, img, display_order)
        VALUES (${cat.head}, ${cat.img}, ${displayOrder})
        ON CONFLICT (name) DO UPDATE SET img = EXCLUDED.img, display_order = EXCLUDED.display_order
        RETURNING id;
      `;
      const categoryId = categoryRow.id;

      // Insert products for this category
      for (const prod of cat.menu) {
        await sql`
          INSERT INTO products (category_id, name, price, available)
          VALUES (${categoryId}, ${prod.name}, ${prod.price}, true)
          ON CONFLICT DO NOTHING;
        `;
      }
      displayOrder++;
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Database seeding failed:", error);
  }
}

seed();
