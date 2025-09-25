export interface Book {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  imageUrl?: string;
  imageId?: string; // Added for on-demand image loading
  categoryId?: string;
}

export interface CartItem {
  book: Book;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}