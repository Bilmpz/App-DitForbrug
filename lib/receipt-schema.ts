export const RECEIPT_CATEGORIES = [
  'Groceries',
  'Household',
  'Personal Care',
  'Transport',
  'Restaurant',
  'Pharmacy',
  'Electronics',
  'Clothing',
  'Pets',
  'Other'
] as const;

export type ReceiptCategory = (typeof RECEIPT_CATEGORIES)[number];

export type ReceiptItem = {
  name: string;
  quantity: number;
  price: number;
  category: ReceiptCategory;
};

export type ReceiptAnalysis = {
  store_name: string;
  purchase_date: string;
  currency: string;
  total: number;
  items: ReceiptItem[];
};

export const receiptJsonSchema = {
  name: 'receipt_analysis',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      store_name: { type: 'string' },
      purchase_date: {
        type: 'string',
        description: 'Dato i format YYYY-MM-DD. Brug dagens dato hvis den ikke kan aflæses sikkert.'
      },
      currency: { type: 'string' },
      total: { type: 'number' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
            quantity: { type: 'number' },
            price: { type: 'number' },
            category: {
              type: 'string',
              enum: [...RECEIPT_CATEGORIES]
            }
          },
          required: ['name', 'quantity', 'price', 'category']
        }
      }
    },
    required: ['store_name', 'purchase_date', 'currency', 'total', 'items']
  }
} as const;
