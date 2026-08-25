/**
 * Database data fetching layer for NFC Nawab Sahab Cafe
 */

/**
 * Fetches all active categories from the database sorted by display_order.
 * @param {Function} sql - Neon SQL query client
 * @returns {Promise<Array>} List of categories
 */
export async function getCategories(sql) {
  return await sql`
    SELECT * FROM categories 
    ORDER BY display_order ASC, name ASC;
  `;
}

/**
 * Fetches all active products from the database sorted by name.
 * @param {Function} sql - Neon SQL query client
 * @returns {Promise<Array>} List of products
 */
export async function getProducts(sql) {
  return await sql`
    SELECT * FROM products 
    WHERE available = true 
    ORDER BY name ASC;
  `;
}

/**
 * Fetches config properties from the database.
 * @param {Function} sql - Neon SQL query client
 * @returns {Promise<Array>} Config rows
 */
export async function getConfigs(sql) {
  return await sql`
    SELECT key, value FROM config;
  `;
}

export const DEFAULT_CONFIG = {
  site_title: "THE NAWAB SAHAB",
  tagline: "CAFE • BAKERY • SWEETS",
  logo_image: "/icons/logo2.png",
  hero_banner_image: "/hero-banner.jpg",
  hero_dish_image: "/dish.png",
  hero_title: "Enjoy our Delicious Meal",
  hero_desc: "Classic recipes with a modern twist, made fresh with care food that delights, comforts, and truly leaves a lasting mark.",
  hero_button_text: "Explore Dishes",
  coming_soon_image: "/commin-soon.png",
  founder_image: "/new-founder.png",
  founder_badge: "THE VISIONARY",
  founder_name: "Nawab Sahab",
  founder_quote: "“We believe great food is more than a meal. It is an experience, a memory, and a reason to come together. At The Nawab Sahab, every detail is created to make every visit feel special.”",
  founder_role: "Founder & CEO",
  footer_logo_image: "/icons/logo2.png",
  legacy_year: "LEGACY 1974 | ESTD 2026",
  footer_follow_title: "Follow our Journey",
  footer_copyright: "© 2026 NFC CAFE • All Rights Reserved",
  whatsapp_number: "919838383836",
  instagram_url: "https://www.instagram.com/the.nawabsahab?igsh=MWU5aGd0MXE1cXNoZQ==",
  threads_url: "https://www.threads.net/@the.nawabsahab",
  youtube_url: "https://youtube.com/@the.nawabsahab?si=AuiFrjutTZ17F_49",
  facebook_url: "https://www.facebook.com/share/1JBAnSqFok/",
  unavailable_text: "Currently Unavailable",
  delivery_time: "25-35 mins",
  
  // Google Search Console & SEO Configuration
  meta_title: "THE NAWAB SAHAB | Cafe • Bakery • Sweets",
  meta_description: "Welcome to The Nawab Sahab Cafe, Bakery & Sweets. Order delicious street bites, gourmet pizzas, burgers, fresh bakery & royal sweets online.",
  meta_keywords: "Nawab Sahab, NFC Cafe, Bakery, Sweets, Burgers, Pizzas, Fast Food, Online Food Delivery, Royal Desserts",
  favicon_image: "/icons/og-logo2.png",
  og_image: "/hero-banner.jpg",
  google_site_verification: "",
  canonical_url: "https://thenawabsahab.com",

  // Email & SMTP Configuration
  smtp_host: "",
  smtp_port: "587",
  smtp_user: "",
  smtp_pass: "",
  smtp_from_email: "",
  admin_notification_email: ""
};

/**
 * Combines categories, products, and dynamic website configurations.
 * @param {Function} sql - Neon SQL query client
 * @returns {Promise<{categories: Array<string>, dishes: Array, config: Object}>}
 */
export async function fetchDishesData(sql) {
  const categoriesList = await getCategories(sql);
  const productsList = await getProducts(sql);
  const configRows = await getConfigs(sql);

  const config = { ...DEFAULT_CONFIG };
  for (const r of configRows) {
    if (r.key && r.value !== undefined && r.value !== null) {
      config[r.key] = r.value;
    }
  }

  // Group flat products list into category-grouped arrays matching UI spec
  const dishes = categoriesList.map((cat) => {
    const catProducts = productsList.filter((p) => p.category_id === cat.id);
    return {
      img: cat.img,
      head: cat.name,
      menu: catProducts.map((p) => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.price),
        compare_price: p.compare_price ? parseFloat(p.compare_price) : null,
        image_url: p.image_url || null,
        available: p.available,
      }))
    };
  });

  return {
    categories: ['All', ...categoriesList.map((cat) => cat.name)],
    dishes,
    config
  };
}
