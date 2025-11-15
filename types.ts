// Fix: Populated types.ts with all necessary type definitions for the application.
export enum Screen {
  Home = 'Home',
  Customers = 'Customers',
  Suppliers = 'Suppliers',
  DayBook = 'DayBook',
  StockBook = 'StockBook',
  Invoices = 'Invoices',
  Reports = 'Reports',
  Settings = 'Settings',
  PartyDetail = 'PartyDetail',
  ItemDetail = 'ItemDetail',
  AddItem = 'AddItem',
  EditItem = 'EditItem',
  AllItems = 'AllItems',
  LowStockItems = 'LowStockItems',
  StockTransaction = 'StockTransaction',
  EditProfile = 'EditProfile',
  AboutUs = 'AboutUs',
  ContactUs = 'ContactUs',
  PrivacyPolicy = 'PrivacyPolicy',
  InvoiceDetail = 'InvoiceDetail',
  PartyReport = 'PartyReport',
  StockInReport = 'StockInReport',
  StockOutReport = 'StockOutReport',
}

export type PartyType = 'Customer' | 'Supplier';

export interface Party {
  id: string;
  name: string;
  type: PartyType;
  businessName?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  email?: string;
  cnic?: string;
  balance: number;
}

export interface DayBookEntry {
  id: string;
  date: string;
  details: string;
  cashIn: number;
  cashOut: number;
  partyId?: string;
  dueDate?: string;
}

export interface Batch {
  batchNumber: string;
  expiryDate?: string;
  quantity: number;
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  salesPrice: number;
  purchasePrice: number;
  barcode?: string;
  lowStockLimit: number;
  image?: string;
  batches: Batch[];
}

export type StockTransactionType = 'Buy' | 'Sell';

export interface StockTransaction {
  id: string;
  itemId: string;
  type: StockTransactionType;
  quantity: number;
  price: number;
  totalAmount: number;
  details: string;
  date: string;
  billNumber: string;
  partyId?: string;
  attachment?: string;
  batchNumber: string;
  expiryDate?: string;
}

export interface User {
  name: string;
  email: string;
  photoUrl?: string;
  address?: string;
  phone?: string;
  alternatePhone?: string;
  cnic?: string;
  businessName?: string;
}

export interface Notification {
  id: string;
  type: 'lowStock' | 'dueDate';
  message: string;
  link: { screen: Screen; payload: any };
  isRead: boolean;
  timestamp: string;
}