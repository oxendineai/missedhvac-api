import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// CORS headers - Allow your widget to call from any domain
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(req: NextRequest) {
  try {
    const { messages, customerId } = await req.json();
    const userMessage = messages[messages.length - 1].content;

    console.log(`Customer ${customerId} asked: ${userMessage}`);

    // Step 1: Convert user message to embedding
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: userMessage,
    });

    // Step 2: Search your knowledge base
    const { data: searchResults } = await supabase.rpc('match_documents', {
      query_embedding: embedding.data[0].embedding,
      match_threshold: 0.7,
      match_count: 5
    });

    // Step 3: Create context from search results
    const context = searchResults
      ?.map((doc: { content: string }) => doc.content)
      .join('\n\n') || 'No relevant information found.';

    // Step 4: Generate AI response with HVAC expertise
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert HVAC assistant for MissedHVAC. Use the context below to answer questions about heating, cooling, and HVAC systems. Be helpful, professional, and specific.

Context from knowledge base:
${context}

If the question isn't about HVAC, politely redirect to HVAC topics. For emergencies, mention calling (555) 987-6543.`
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      max_tokens: 200,
      temperature: 0.4,
    });

    const response = completion.choices[0].message.content;

    // Step 5: Log the interaction (optional)
    await supabase.from('chat_logs').insert({
      customer_id: customerId,
      user_message: userMessage,
      ai_response: response,
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      role: 'assistant',
      content: response
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json({
      role: 'assistant',
      content: 'I apologize, but I\'m having trouble connecting right now. For immediate assistance with your HVAC needs, please call (555) 987-6543.'
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// Handle preflight OPTIONS requests
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}