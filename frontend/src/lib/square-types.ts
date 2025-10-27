// Square API type definitions

export interface SquareMoneyAmount {
  amount: number;
  currency: string;
}

export interface SquareLineItem {
  name: string;
  quantity: string;
  base_price_money?: SquareMoneyAmount;
}

export interface SquareInventoryCount {
  catalog_object_id: string;
  location_id: string;
  state: 'IN_STOCK' | 'SOLD' | 'RESERVED' | string;
  quantity: string;
  calculated_at: string;
}

export interface SquarePickupRecipient {
  display_name: string;
  email_address: string;
  phone_number?: string;
}

export interface SquarePickupDetails {
  recipient: SquarePickupRecipient;
  note?: string;
  pickup_at?: string;
}

export interface SquareFulfillment {
  uid?: string;
  type: string;
  state: string;
  pickup_details?: SquarePickupDetails;
}

export interface SquareTender {
  id?: string;
  type?: string;
  amount_money?: SquareMoneyAmount;
}

export interface SquareOrder {
  id: string;
  created_at: string;
  updated_at?: string;
  state: string;
  version?: number;
  total_money?: SquareMoneyAmount;
  line_items: SquareLineItem[];
  fulfillments: SquareFulfillment[];
  tenders?: SquareTender[];
  metadata?: Record<string, string>;
}

export interface SquareOrdersSearchResponse {
  orders: SquareOrder[];
  cursor?: string;
}

export interface SquareOrderResponse {
  order: SquareOrder;
}

export interface SquareErrorDetail {
  category: string;
  code: string;
  detail?: string;
  field?: string;
}

export interface SquareApiResponse {
  errors?: SquareErrorDetail[];
}

export interface CartItem {
  book: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
}

export interface CustomerInfo {
  name?: string;
  email: string;
  phone?: string;
  userId?: string;
}

export interface SearchMatch {
  id: string;
  score: number;
  snippet?: string;
}