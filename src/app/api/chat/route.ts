import { NextRequest, NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const userMessage = messages[messages.length - 1]?.content || '';

    // Simple HVAC responses based on keywords
    let response = "Thanks for contacting us! For immediate HVAC assistance, please call (555) 987-6643.";

    if (userMessage.toLowerCase().includes('heat') || userMessage.toLowerCase().includes('furnace')) {
      response = "For heating issues, check your thermostat first, then your air filter. If the problem persists, call (555) 987-6643 for emergency service.";
    } else if (userMessage.toLowerCase().includes('cool') || userMessage.toLowerCase().includes('ac')) {
      response = "For cooling problems, ensure your thermostat is set to COOL and check your air filter. Call (555) 987-6643 for professional service.";
    } else if (userMessage.toLowerCase().includes('emergency') || userMessage.toLowerCase().includes('urgent')) {
      response = "🚨 This sounds like an emergency! Call our 24/7 emergency line at (555) 987-6643 immediately.";
    } else if (userMessage.toLowerCase().includes('price') || userMessage.toLowerCase().includes('cost')) {
      response = "Service calls start at $89. Most repairs are completed the same day. Call (555) 987-6643 for a free estimate.";
    }

    return NextResponse.json({
      content: response
    }, {
      headers: corsHeaders
    });

  } catch (error) {
    return NextResponse.json({
      content: 'I apologize, but I\'m having trouble right now. Please call (555) 987-6643 for immediate assistance.'
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}