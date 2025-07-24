import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function DELETE() {
  try {
    const client = await clientPromise;
    const db = client.db();
    await db.collection('expenses').deleteMany({});
    return NextResponse.json({ message: 'All transactions deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting all transactions:', error);
    return NextResponse.json({ message: 'Error deleting all transactions' }, { status: 500 });
  }
} 