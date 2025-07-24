import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import clientPromise from '@/lib/mongodb';
import { Expense } from '@/lib/models/expense';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function getExpenses(): Promise<Expense[]> {
  const client = await clientPromise;
  const db = client.db();
  const expenses = await db.collection<Expense>('expenses').find({}).toArray();
  return expenses;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const expenses = await getExpenses();
    if (expenses.length === 0) {
      return NextResponse.json({
        response: "You have no transactions to analyze. Please add some expenses and try again."
      });
    }
    
    const formattedExpenses = JSON.stringify(expenses, null, 2);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const fullPrompt = `You are an expert financial assistant. Analyze the following expense data and answer the user's question. Provide a concise and helpful response. Do not use markdown and dont give too long texts, just simple english with clear  And give insights in points, that can be easier to read.

    Expense Data:
    ${formattedExpenses}
    
    User Question:
    ${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 });
  }
} 