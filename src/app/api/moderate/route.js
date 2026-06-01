import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { itemName } = await request.json();

    if (!itemName) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an AI content moderator for a college hostel packing checklist. Check if the following item name contains sexual wellness items, offensive content, slurs, or inappropriate material. Reply ONLY with the word 'BLOCK' if it is inappropriate, or 'ALLOW' if it is fine. Item name: "${itemName.trim()}"`
              }
            ]
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const aiDecision = aiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.toUpperCase() || 'ALLOW';

    return NextResponse.json({ decision: aiDecision });

  } catch (error) {
    console.error('Moderation API error:', error);
    // Fail open if something goes wrong
    return NextResponse.json({ decision: 'ALLOW', error: error.message }, { status: 500 });
  }
}
