import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
}

// These defaults must stay in step with the same tags in `index.html`. This
// component overwrites them at runtime, so a stale default here silently wins
// over the correct markup a crawler was first served.
//
// HSA only, deliberately. A health FSA or HRA requires the plan administrator
// to substantiate each claim through an independent third party (CCA
// 202317020), which is not what this product does — so it must not be
// marketed as serving those plans. See the Terms, section 2.
export const SEOHead = ({
  title = "Reclaim - Find unclaimed HSA reimbursements & generate IRS-ready records",
  description = "Reclaim finds healthcare expenses you can still reimburse from your HSA and generates IRS-ready Medical Expense Records — your audit-proof paper trail.",
  keywords = "HSA, health savings account, HSA reimbursement, unclaimed HSA, medical expense tracking, IRS substantiation, HSA receipts, tax-free reimbursement, healthcare expense management",
  ogImage = "https://reclaim.health/reclaim-icon.png",
  ogType = "website",
  canonical = "https://reclaim.health",
}: SEOHeadProps) => {
  useEffect(() => {
    // Update title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (
      name: string,
      content: string,
      isProperty = false,
    ) => {
      const attr = isProperty ? "property" : "name";
      let element = document.querySelector(`meta[${attr}="${name}"]`);

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }

      element.setAttribute("content", content);
    };

    // Standard meta tags
    updateMetaTag("description", description);
    updateMetaTag("keywords", keywords);

    // Open Graph tags
    updateMetaTag("og:title", title, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:image", ogImage, true);
    updateMetaTag("og:type", ogType, true);
    updateMetaTag("og:url", canonical, true);

    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", title);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", ogImage);

    // Canonical link
    let canonicalLink = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    // Structured data for Organization
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Reclaim",
      applicationCategory: "FinanceApplication",
      description: description,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      operatingSystem: "Web, iOS, Android",
      // No aggregateRating. This carried a hardcoded 4.8 from 1,250 ratings —
      // figures no user ever gave, published to search engines as fact. Do not
      // reinstate one until it is computed from real reviews.
    };

    let scriptTag = document.querySelector(
      'script[type="application/ld+json"]',
    ) as HTMLScriptElement;
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.type = "application/ld+json";
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(structuredData);
  }, [title, description, keywords, ogImage, ogType, canonical]);

  return null;
};
