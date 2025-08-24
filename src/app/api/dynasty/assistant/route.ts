import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { openai, DYNASTY_SYSTEM_PROMPT } from "../../../../lib/openai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, context } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const recentValues = await prisma.valueDaily.findMany({
      where: {
        dynastyValue: { not: null },
      },
      include: {
        player: {
          select: {
            name: true,
            pos: true,
            team: true,
            ageYears: true,
          },
        },
      },
      orderBy: [
        { asOfDate: "desc" },
        { dynastyValue: "desc" },
      ],
      take: 50, // Top 50 players for context
    });

    const dynastyContext = recentValues
      .map(
        (v) =>
          `${v.player.name} (${v.player.pos}, ${v.player.team || "FA"}, Age ${
            v.player.ageYears || "?"
          }): Dynasty Value ${v.dynastyValue?.toFixed(1)}, Trend 7d: ${
            v.trend7d?.toFixed(1) || "N/A"
          }`
      )
      .join("\n");

    const contextualPrompt = `${DYNASTY_SYSTEM_PROMPT}

Current Dynasty Values (Top 50 Players):
${dynastyContext}

Additional Context: ${context || "None provided"}

User Question: ${message}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: contextualPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return NextResponse.json(
        { error: "No response generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      response,
      usage: completion.usage,
    });
  } catch (error) {
    console.error("Dynasty Assistant error:", error);
    
    if (error instanceof Error && error.message.includes("API key")) {
      return NextResponse.json(
        { error: "OpenAI API configuration error" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
