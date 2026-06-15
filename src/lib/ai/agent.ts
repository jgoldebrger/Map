import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { createShippingTools } from "@/lib/ai/tools/shipping-tools";
import {
  getShippingRefusalMessage,
  isOffTopicShippingQuestion,
  SHIPPING_ONLY_SYSTEM_RULES,
} from "@/lib/ai/shipping-scope";
import type { ScheduleAnswer } from "@/lib/shipping/schedule";
import type { AskMessage } from "@/lib/validators/ask";

const SYSTEM_PROMPT = `You are a shipping schedule assistant for Fabuwood Logistics territory maps.

${SHIPPING_ONLY_SYSTEM_RULES}

Rules:
- ALWAYS call the appropriate tools before stating ship dates, territories, or cutoffs. Never invent data.
- If a county name is ambiguous (multiple states), use search_counties and ask the user to clarify the state.
- When the user provides a ZIP code, use get_zip_ship_schedule (not county lookup) because ZIP overrides may differ from the county default.
- When the user asks about a whole state (e.g. "Florida", "what ships in NJ"), use get_state_ship_schedule — not county lookup.
- Mention ZIP overrides when tool results show zipOverride: true.
- Cite county, state, and territory name in your answer.
- Format dates in US style (e.g. Monday, June 8, 2026) using nextShipDates from tool results.
- Cutoff rule: orders placed on or before the cutoff weekday (end of that day) qualify for ship days in the same week; after cutoff, the next ship dates start the following week.
- If a location is unassigned, say so clearly and do not guess ship dates.
- Keep answers concise and helpful.`;

const MAX_ITERATIONS = 5;

function getModelName(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

function toLangChainMessages(history: AskMessage[]): BaseMessage[] {
  return history.map((m) =>
    m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content),
  );
}

export type AgentResult = {
  answer: string;
  sources: ScheduleAnswer[];
};

export async function runShippingAgent(
  message: string,
  history: AskMessage[] = [],
): Promise<AgentResult> {
  if (isOffTopicShippingQuestion(message)) {
    return { answer: getShippingRefusalMessage(), sources: [] };
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const sources: ScheduleAnswer[] = [];
  const tools: StructuredToolInterface[] = createShippingTools((source) => {
    sources.push(source);
  });
  const toolsByName = Object.fromEntries(tools.map((t) => [t.name, t]));

  const model = new ChatOpenAI({
    model: getModelName(),
    temperature: 0,
    apiKey,
  }).bindTools(tools);

  const messages: BaseMessage[] = [
    new SystemMessage(SYSTEM_PROMPT),
    ...toLangChainMessages(history),
    new HumanMessage(message),
  ];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await model.invoke(messages);
    messages.push(response);

    const toolCalls = response.tool_calls ?? [];
    if (toolCalls.length === 0) {
      const content =
        typeof response.content === "string"
          ? response.content
          : response.content
              .map((part) => ("text" in part ? part.text : ""))
              .join("");
      const answer = content.trim() || "I couldn't generate an answer.";
      if (sources.length === 0 && isOffTopicShippingQuestion(message)) {
        return { answer: getShippingRefusalMessage(), sources: [] };
      }
      return { answer, sources };
    }

    for (const toolCall of toolCalls) {
      const tool = toolsByName[toolCall.name];
      if (!tool) {
        messages.push(
          new ToolMessage({
            content: JSON.stringify({ error: `Unknown tool: ${toolCall.name}` }),
            tool_call_id: toolCall.id ?? toolCall.name,
          }),
        );
        continue;
      }
      const result = await tool.invoke(toolCall.args);
      messages.push(
        new ToolMessage({
          content: typeof result === "string" ? result : JSON.stringify(result),
          tool_call_id: toolCall.id ?? toolCall.name,
        }),
      );
    }
  }

  return {
    answer: "I need more steps to complete this request. Please try a more specific question.",
    sources,
  };
}
