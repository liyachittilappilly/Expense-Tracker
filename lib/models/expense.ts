import { ObjectId } from 'mongodb';

export interface Expense {
  _id: ObjectId;
  description: string;
  amount: number;
  category: string;
  date: Date;
} 