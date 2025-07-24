import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // Add your key to .env.local

export async function POST(req: NextRequest) {
  const { message, context, userId } = await req.json(); // Add userId for multi-tenant

  // Define tools for agentic features
  const tools = [
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
    tool_choice: "auto", // AI decides when to use tools
    temperature: 0.4,
    max_tokens: 300,
  });

  let finalResponse = response.choices[0].message.content;
  let toolCalls = response.choices[0].message.tool_calls;

  // Handle tool calls if present
  if (toolCalls) {
    finalResponse = "Processing your request...";
    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);
      let toolResult;

      switch (functionName) {
        case 'book_appointment':
          toolResult = await bookAppointment(args.time, args.details); // Implement real function
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

  return NextResponse.json({ response: finalResponse });
}

// Mock tool functions (replace with real APIs, e.g., n8n webhooks)
async function bookAppointment(time: string, details: string) {
  // POST to n8n webhook for Google Calendar
  return `Appointment booked for ${time}. Details: ${details}`;
}

async function checkInventory(item: string) {
  // POST to n8n for Airtable query
  return `5 units of ${item} in stock.`;
}

async function logToCrm(name: string, email: string, query: string) {
  // POST to n8n for HubSpot
  return `Lead logged: ${name} (${email}) - Query: ${query}`;
}

async function sendSms(phone: string, message: string) {
  // POST to n8n for Twilio
  return `SMS sent to ${phone}: ${message}`;
}