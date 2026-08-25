import { Convergence, Dancing_Script, Kalam, Permanent_Marker } from "next/font/google";
import Script from "next/script";
import sql from "@/lib/db";
import { getConfigs, DEFAULT_CONFIG } from "@/lib/data";
import { getBlobUrl } from "@/lib/functions";
import "./globals.css";

// 2-minute Incremental Static Regeneration (ISR)
export const revalidate = 120;

const convergence = Convergence({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-convergence",
});

const dancingScript = Dancing_Script({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

const kalam = Kalam({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-kalam",
});

const permanentMarker = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-permanent-marker",
});

export async function generateMetadata() {
  try {
    const configRows = await getConfigs(sql);
    const config = { ...DEFAULT_CONFIG };
    for (const r of configRows) {
      if (r.key && r.value !== undefined && r.value !== null) {
        config[r.key] = r.value;
      }
    }

    const title = config.meta_title || config.site_title || "THE NAWAB SAHAB";
    const description = config.meta_description || "Cafe • Bakery • Sweets | Legacy 1974 - Estd 2026";
    const faviconUrl = getBlobUrl(config.favicon_image || "/icons/og-logo2.png");
    const ogImageUrl = getBlobUrl(config.og_image || "/hero-banner.jpg");

    return {
      title,
      description,
      keywords: config.meta_keywords ? config.meta_keywords.split(",").map(k => k.trim()) : undefined,
      icons: {
        icon: [
          { url: faviconUrl },
          { url: faviconUrl, type: "image/png" }
        ],
        shortcut: faviconUrl,
        apple: faviconUrl,
      },
      openGraph: {
        title,
        description,
        url: config.canonical_url || "https://thenawabsahab.com",
        siteName: config.site_title || "THE NAWAB SAHAB",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
        type: "website",
      },
      verification: config.google_site_verification ? {
        google: config.google_site_verification,
      } : undefined,
      alternates: config.canonical_url ? {
        canonical: config.canonical_url,
      } : undefined,
    };
  } catch {
    return {
      title: "THE NAWAB SAHAB",
      description: "Cafe • Bakery • Sweets | Legacy 1974 - Estd 2026",
      icons: {
        icon: getBlobUrl("/icons/og-logo2.png"),
      },
    };
  }
}

export default async function RootLayout({ children }) {
  let faviconUrl = getBlobUrl("/icons/og-logo2.png");
  try {
    const configRows = await getConfigs(sql);
    const favRow = configRows.find(r => r.key === 'favicon_image');
    if (favRow?.value) {
      faviconUrl = getBlobUrl(favRow.value);
    }
  } catch {}

  return (
    <html
      lang="en"
      className={`${convergence.variable} ${dancingScript.variable} ${kalam.variable} ${permanentMarker.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href={faviconUrl} sizes="any" />
        <link rel="apple-touch-icon" href={faviconUrl} />
      </head>
      <body className="min-h-full flex flex-col bg-black text-white">
        {children}
        <Script
          src="https://kit.fontawesome.com/16d1bc377b.js"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
