import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";

export type MessageRole = "user" | "human" | "person" | "ai" | "agent" | "robot" | "system" | "core" | "base";

export interface ProviderMessage {
  role: MessageRole;
  content: string;
}

/**
 * Converts an array of provider messages to LangChain message objects.
 */
export const messagesToObjects = (messages: Array<ProviderMessage | any> = []) => {
  return messages
    .map((msg) => {
      if (typeof msg !== "object") return null;
      const { role, content } = msg;
      if (!content) return null;
      if (["user", "human", "person"].includes(role)) return new HumanMessage({ content });
      if (["ai", "agent", "robot"].includes(role)) return new AIMessage({ content });
      if (["system", "core", "base"].includes(role)) return new SystemMessage({ content });
      return null;
    })
    .filter((el) => el);
};
