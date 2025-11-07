export interface Item {
    id: string;
    name: string;
    quantity: number;
    sold: number;
    description?: string;
    price?: number;
    currency?:'EUR' | 'USD' | 'RUB' | 'PLN' | 'GBP' | 'UAH';
    images?: string[];
}