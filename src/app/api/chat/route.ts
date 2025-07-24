import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { message, context } = await req.json();

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
    // Add other tools here as before (check_inventory, log_to_crm, send_sms, send_link)
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
      const args = JSON.parse(toolCall.function.arguments) as Record<string, string>;
      let toolResult;

      switch (functionName) {
        case 'book_appointment':
          toolResult = await bookAppointment(args.time, args.details);
          break;
        // Add cases for other tools
        default:
          toolResult = "Unknown action";
      }
      finalResponse += `\nAction result: ${toolResult}`;
    }
  }

  return NextResponse.json({ response: finalResponse });
}

// Mock tool functions (as before)
async function bookAppointment(time: string, details: string) {
  return `Appointment booked for ${time}. Details: ${details}`;
}
// Add other mocks...