import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

export default function SEO({ 
  title = "ZADA | Luxury Artisanal Fragrances", 
  description = "Discover ZADA's exclusive collection of luxury artisanal perfumes. Crafted with soul and science for pure elegance.",
  keywords = "luxury perfume, artisanal fragrance, ZADA, oud, citrus mist, elegant scents",
  image = "/og-image.png",
  url = "https://zadafragrances.com/"
}: SEOProps) {
  const fullTitle = title.includes("ZADA") ? title : `${title} | ZADA`;

  return (
    <Helmet>
      {/* Standard metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      <meta property="twitter:url" content={url} />
    </Helmet>
  );
}
