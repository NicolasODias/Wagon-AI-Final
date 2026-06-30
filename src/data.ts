/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Client, Order, FinancialRecord, Seller } from './types';

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_LEDGER: FinancialRecord[] = [];

export const INITIAL_SELLERS: Seller[] = [
  {
    id: 'usr-seller-01',
    name: 'Vendedor 01',
    email: 'vendedor1@wagon.com',
    phone: '(11) 98877-1234',
    status: 'Ativo',
    commissionRate: 5.0,
    target: 100000
  }
];

export const BRAND_COLORS = {
  darkBlue: '#1F3767',
  lightBlue: '#1E94CF',
  green: '#8BC039',
  white: '#FFFFFF',
};

export const INITIAL_COMMISSIONS: any[] = [];
