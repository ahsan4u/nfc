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

/**
 * Combines categories, products, and dynamic website configurations directly from DB.
 * @param {Function} sql - Neon SQL query client
 * @returns {Promise<{categories: Array<string>, dishes: Array, config: Object}>}
 */
export async function fetchDishesData(sql) {
  const categoriesList = await getCategories(sql);
  const productsList = await getProducts(sql);
  const configRows = await getConfigs(sql);

  const config = {};
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
      menu: catProducts.map((p) => {
        let variants = [];
        try {
          if (p.variants_json) {
            variants = typeof p.variants_json === 'string' ? JSON.parse(p.variants_json) : p.variants_json;
          }
        } catch {
          variants = [];
        }

        return {
          id: p.id,
          name: p.name,
          price: parseFloat(p.price),
          compare_price: p.compare_price ? parseFloat(p.compare_price) : null,
          image_url: p.image_url || null,
          available: p.available,
          pricing_type: p.pricing_type || 'count',
          variants: Array.isArray(variants) ? variants : [],
        };
      })
    };
  });

  return {
    categories: ['All', ...categoriesList.map((cat) => cat.name)],
    dishes,
    config
  };
}
