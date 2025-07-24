import 'dotenv/config';
import clientPromise from '../lib/mongodb';
import { Expense } from '../lib/models/expense';
import { ObjectId } from 'mongodb';

const seedExpenses: Omit<Expense, '_id'>[] = [
  {
    description: 'Groceries from Walmart',
    amount: 75.5,
    category: 'Food',
    date: new Date('2024-07-01'),
  },
  {
    description: 'Gasoline for the car',
    amount: 45.0,
    category: 'Transportation',
    date: new Date('2024-07-02'),
  },
  {
    description: 'Dinner at Italian restaurant',
    amount: 120.0,
    category: 'Food',
    date: new Date('2024-07-03'),
  },
  {
    description: 'Movie tickets for two',
    amount: 30.0,
    category: 'Entertainment',
    date: new Date('2024-07-04'),
  },
  {
    description: 'Monthly gym membership',
    amount: 50.0,
    category: 'Health',
    date: new Date('2024-07-05'),
  },
  {
    description: 'New running shoes',
    amount: 150.0,
    category: 'Shopping',
    date: new Date('2024-07-06'),
  },
  {
    description: 'Coffee with a friend',
    amount: 12.75,
    category: 'Social',
    date: new Date('2024-07-07'),
  },
  {
    description: 'Electricity bill',
    amount: 85.0,
    category: 'Utilities',
    date: new Date('2024-07-08'),
  },
  {
    description: 'Internet bill',
    amount: 60.0,
    category: 'Utilities',
    date: new Date('2024-07-09'),
  },
  {
    description: 'Lunch at a cafe',
    amount: 25.5,
    category: 'Food',
    date: new Date('2024-07-10'),
  },
];

async function seed() {
  const client = await clientPromise;
  const db = client.db();

  const expensesCollection = db.collection<Omit<Expense, '_id'>>('expenses');

  // Clear existing data
  await expensesCollection.deleteMany({});
  console.log('Cleared existing expenses.');

  // Insert mock data
  await expensesCollection.insertMany(seedExpenses);
  console.log('Seeded expenses.');

  await client.close();
}

seed().catch(console.error); 