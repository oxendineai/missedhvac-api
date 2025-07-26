import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { message, context } = await req.json();

  // Add authentication check for incoming requests
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  // For now, check against a test key; replace with real validation (e.g., from DB/HubSpot) later
  if (token !== 'sk-test-missedhvac-20250726') { // YOUR TEST KEY HERE
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }
  // Authentication passed - proceed with OpenAI call

  // Define tools for agentic features
  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "book_appointment",
        description: "Book a calendar appointment",
        parameters: {
          type: "object",
          properties: {
            time: { type: "string", description: "Time in ISO format" },
            details: { type: "string", description: "Appointment details" },
          },
          required: ["time", "details"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "check_inventory",
        description: "Check HVAC inventory",
        parameters: {
          type: "object",
          properties: {
            item: { type: "string", description: "Item to check" },
          },
          required: ["item"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "log_to_crm",
        description: "Log lead to HubSpot",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
            query: { type: "string" },
          },
          required: ["name", "query"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "send_sms",
        description: "Send SMS alert",
        parameters: {
          type: "object",
          properties: {
            phone: { type: "string" },
            message: { type: "string" },
          },
          required: ["phone", "message"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "send_link",
        description: "Send a link in response",
        parameters: {
          type: "object",
          properties: {
            url: { type: "string" },
          },
          required: ["url"],
        },
      },
    },
  ];

  // Initial AI call with tools
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: `You are an HVAC AI assistant for MissedHVAC. Use the context below to answer. Use tools for actions like booking or inventory. For emergencies, send SMS. Context: ${context}` },
      { role: "user", content: message },
    ],
    tools,
    tool_choice: "auto",
    temperature: 0.4,
    max_tokens: 300,
  });

  let finalResponse = response.choices[0].message.content || '';
  const toolCalls = response.choices[0].message.tool_calls || [];

  // Handle tool calls if present
  if (toolCalls.length > 0) {
    finalResponse = "Processing your request...";
    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments) as any; // Use any to fix typing
      let toolResult;

      switch (functionName) {
        case 'book_appointment':
          toolResult = await bookAppointment(args.time, args.details);
          break;
        case 'check_inventory':
          toolResult = await checkInventory(args.item);
          break;
        case 'log_to_crm':
          toolResult = await logToCrm(args.name, args.email, args.query);
          break;
        case 'send_sms':
          toolResult = await sendSms(args.phone, args.message);
          break;
        case 'send_link':
          toolResult = `Link: ${args.url}`;
          break;
        default:
          toolResult = "Unknown action";
      }
      finalResponse += `\nAction result: ${toolResult}`;
    }
  }

  // Add CORS headers
  return NextResponse.json({ response: finalResponse }, {
    headers: {
      'Access-Control-Allow-Origin': '*', // Or specify missedhvac.com for security
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Added Authorization for the header
    },
  });
}

// Mock tool functions (as before - replace with real implementations later if needed)
async function bookAppointment(time: string, details: string) {
  return `Appointment booked for ${time}. Details: ${details}`;
}

async function checkInventory(item: string) {
  return `5 units of ${item} in stock.`;
}

async function logToCrm(name: string, email: string, query: string) {
  return `Lead logged: ${name} (${email}) - Query: ${query}`;
}

async function sendSms(phone: string, message: string) {
  return `SMS sent to ${phone}: ${message}`;
}