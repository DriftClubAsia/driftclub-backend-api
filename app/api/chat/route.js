import OpenAI from 'openai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
    });

    const answer = completion.choices[0]?.message?.content;
    return NextResponse.json({ answer });
  } catch (err) {
    console.error('OpenAI API error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch response' }, { status: 500 });
  }
}

