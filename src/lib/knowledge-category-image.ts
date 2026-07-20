import { normalizeCategories } from "./normalize";

const KNOWLEDGE_CATEGORY_IMAGE_MAP: Record<string, string> = {
  business: "/images/knowledge-categories/business-skill.png",
  "business skill": "/images/knowledge-categories/business-skill.png",
  service: "/images/knowledge-categories/business-skill.png",
  services: "/images/knowledge-categories/business-skill.png",
  operations: "/images/knowledge-categories/business-skill.png",
  operation: "/images/knowledge-categories/business-skill.png",
  compliance: "/images/knowledge-categories/business-skill.png",
  training: "/images/knowledge-categories/business-skill.png",
  rally: "/images/knowledge-categories/business-skill.png",
  "product knowledge": "/images/knowledge-categories/product-knowledge.png",
  product: "/images/knowledge-categories/product-knowledge.png",
  products: "/images/knowledge-categories/product-knowledge.png",
  leadership: "/images/knowledge-categories/leadership.png",
  mindset: "/images/knowledge-categories/mindset.png",
  "\u0e18\u0e38\u0e23\u0e01\u0e34\u0e08": "/images/knowledge-categories/business-skill.png",
  "\u0e1c\u0e39\u0e49\u0e19\u0e33": "/images/knowledge-categories/leadership.png",
  "\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32": "/images/knowledge-categories/product-knowledge.png",
  "\u0e41\u0e19\u0e27\u0e04\u0e34\u0e14": "/images/knowledge-categories/mindset.png",
};

const DEFAULT_KNOWLEDGE_CATEGORY_IMAGE = "/images/knowledge-categories/business-skill.png";

export function getKnowledgeCategoryImage(categories: unknown) {
  const normalized = normalizeCategories(categories);

  for (const category of normalized) {
    const match = KNOWLEDGE_CATEGORY_IMAGE_MAP[category.trim().toLowerCase()];
    if (match) return match;
  }

  return DEFAULT_KNOWLEDGE_CATEGORY_IMAGE;
}
