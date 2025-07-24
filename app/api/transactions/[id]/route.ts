import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const transactionData = await request.json();
    const { id: bodyId, _id, ...updateData } = transactionData;

    const client = await clientPromise;
    const db = client.db();

    await db.collection('expenses').updateOne(
      { _id: new ObjectId(id) },
      { $set: {
          ...updateData,
          date: new Date(updateData.date)
      }}
    );

    return NextResponse.json({ message: 'Transaction updated' }, { status: 200 });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ message: 'Error updating transaction' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const client = await clientPromise;
    const db = client.db();

    await db.collection('expenses').deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ message: 'Transaction deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ message: 'Error deleting transaction' }, { status: 500 });
  }
} 