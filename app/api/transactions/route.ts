import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const transactions = await db.collection('expenses').find({}).sort({ date: -1 }).toArray();

    const transactionsWithId = transactions.map(t => ({
      ...t,
      id: t._id.toString(),
      _id: undefined,
    }));

    return NextResponse.json(transactionsWithId);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ message: 'Error fetching transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const transactionData = await request.json();
    const { id, ...newTransaction } = transactionData; 

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection('expenses').insertOne({
      ...newTransaction,
      date: new Date(newTransaction.date),
    });

    const insertedDoc = await db.collection('expenses').findOne({ _id: result.insertedId });

    if (insertedDoc) {
      const responseDoc = {
        ...insertedDoc,
        id: insertedDoc._id.toString(),
        _id: undefined,
      };
      return NextResponse.json(responseDoc, { status: 201 });
    } else {
      return NextResponse.json({ message: 'Error retrieving created transaction' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ message: 'Error creating transaction' }, { status: 500 });
  }
} 