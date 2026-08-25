import AppClient from "@/components/AppClient";
import sql from "@/lib/db";
import { fetchDishesData } from "@/lib/data";

// Incremental Static Regeneration (ISR) revalidation window set to 120 seconds (2 minutes)
export const revalidate = 120;

export default async function Home() {
  // Directly query categories, dishes, and page config from Neon DB
  const { categories, dishes, config } = await fetchDishesData(sql);

  return (
    <AppClient 
      categories={categories} 
      initialDishes={dishes} 
      config={config}
    />
  );
}
