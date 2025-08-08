import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { registerTools, geminiToolDeclarations } from "./tools.js";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from 'socket.io';
import { z } from "zod";

const server = new McpServer({
  name: "example-server",
  version: "1.0.0"
});
server.registerTool( "calculate-bmi", { title: "BMI Calculator", description: "Calculate Body Mass Index", inputSchema: { weightKg: z.number(), heightM: z.number() } }, async ({ weightKg, heightM }) => ({ content: [{ type: "text", text: String(weightKg / (heightM * heightM)) }] }) );

const app = express();
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:3000"] }));
app.use(express.json()); // Parse JSON bodies

const ioServer = http.createServer(app);
const io = new SocketIOServer(ioServer);

// Initialize Google Gemini AI
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY || '');

// Register tools with the server
// registerTools(server);

// Handle client connection
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("message", (msg) => {
    console.log("Received message:", msg);
    const reply = `hey ${msg}`;
    socket.emit("message", reply);
  });
});

// Lookup object for multiple simultaneous connections
const transports = {};

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport('/messages', res);
  transports[transport.sessionId] = transport;
  res.on("close", () => {
    delete transports[transport.sessionId];
  });
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send('No transport found for sessionId');
  }
});

app.post('/chat', async (req, res) => {
  try {
    const { message, history, storefrontUrl } = req.body;

    // Validate inputs
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Message is required and must be a string" });
    }
    if (history && !Array.isArray(history)) {
      return res.status(400).json({ error: "History must be an array" });
    }

    // Construct chat history
    let chatHistory = history ? [...history] : [];
    if (storefrontUrl) {
      chatHistory.unshift({
        role: "user",
        parts: [{ text: `For all tool calls, use storefrontUrl: "${storefrontUrl}". The current store domain is: ${storefrontUrl}` }]
      });
    }

    // Map history to ensure correct format
    chatHistory = chatHistory.map(msg => {
      if (typeof msg === "string") {
        return { role: "user", parts: [{ text: msg }] };
      }
      if (msg.role && Array.isArray(msg.parts)) {
        return {
          role: msg.role,
          parts: msg.parts.map(part => ({
            text: String(part.text || '')
          }))
        };
      }
      return { role: "user", parts: [{ text: String(msg) }] };
    });

    // Add current message
    chatHistory.push({ role: "user", parts: [{ text: message }] });

    // console.log(geminiToolDeclarations, registerTools(server));
    
    // Initialize model and generate content
    const response = await ai.models.generateContent({ model: "gemini-2.0-flash", 
    // const response = await genAI.generateContent({
      contents: chatHistory,
      tools: [{ functionDeclarations: geminiToolDeclarations }] 
    });

    console.log("Response from AI:", JSON.stringify(response.response, null, 2));

    const part = response.candidates[0].content.parts[0];
    console.log("Part:", part);
    let responseText = "";
    if (part.functionCall) {
      console.log("Function call:", part.functionCall.name, "Message:", message);
      const tool = geminiToolDeclarations.find(t => t.name === part.functionCall.name);
      if (tool) {
        if (part.functionCall.name === "search_shop_catalog") {
          responseText = await handleProductResult(tool, part, message, storefrontUrl);
        } else if (part.functionCall.name === "search_shop_policies_and_faqs") {
          responseText = await handleFaqsResult(tool, part, message, storefrontUrl);
        } else if (part.functionCall.name === "get_cart") {
          responseText = await handleCartResult(tool, part, message, storefrontUrl);
        } else if (part.functionCall.name === "update_cart") {
          responseText = await handleUpdateCartResult(tool, part, message, storefrontUrl);
        } else {
          // Fallback to generic handler (assuming McpServer provides handler)
          const registeredTool = server.getRegisteredTools().find(t => t.name === part.functionCall.name);
          responseText = registeredTool ? await registeredTool.handler(part.functionCall.args, message) : `No handler for tool: ${part.functionCall.name}`;
        }
      } else {
        responseText = `Unknown tool: ${part.functionCall.name}`;
      }
    } else {
      responseText = part.text || "No response text available";
    }

    // Update chat history with response
    chatHistory.push({ role: "model", parts: [{ text: responseText }] });
    res.json({ reply: responseText });
  } catch (error) {
    console.error("Error in /chat endpoint:", error);
    res.status(500).json({ error: "Failed to process chat request", details: error.message });
  }
});

ioServer.listen(3001, () => {
  console.log("Server is running on http://localhost:3001");
});