export type CatalogProduct = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  colors: string[];
  sizes: string[];
  stock?: number;
  visible?: boolean;
  variants?: CatalogVariant[];
  categories: string[];
  tags: string[];
};

export type CatalogVariant = {
  name: string;
  value: string;
  images?: string[];
  sizes: { size: string; stock: number }[];
};
