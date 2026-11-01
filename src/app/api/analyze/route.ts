import { NextResponse } from "next/server";
import { model } from "@/lib/gemini";

/**
 * Analyzes an image using Gemini AI to detect civic issues.
 * OPTIMIZED FOR DEMO: Ensures variability in severity and clear explanations.
 */
export async function POST(req: Request) {
    try {
        const { imageUrl } = await req.json();

        // --- DEMO-OPTIMIZED PROMPT ---
        const prompt = `
You are a Senior Urban Infrastructure Inspector AI for a smart city initiative.

**YOUR TASK:** Analyze the provided image and classify any civic infrastructure issues.

**VALID ISSUE TYPES (choose EXACTLY ONE):**
- Pothole
- Garbage
- Broken Streetlight
- Water Logging
- Sewage Issue

**SEVERITY RATING SYSTEM (MUST follow these exact rules):**

🔴 **SEVERE** - Emergency response needed within 24 hours
- Pothole: Deep enough to damage axles (over 15cm deep) or large enough to swallow a tire
- Garbage: Large dumpster-sized pile blocking entire lane or sidewalk
- Streetlight: Entire intersection dark OR pole is leaning/damaged
- Water Logging: Over 20cm deep, cars cannot pass, risk of vehicle stalling
- Sewage: Raw sewage visible on street, strong odor, health hazard

🟠 **HIGH** - Requires attention within 48-72 hours  
- Pothole: Tire-sized (30-50cm wide), clearly visible danger to vehicles
- Garbage: 3-5 bags scattered, overflowing bins, attracting pests
- Streetlight: One major road light out OR multiple side street lights out
- Water Logging: 10-20cm deep, causing traffic delays but passable
- Sewage: Overflowing manhole, but not raw sewage on street yet

🟡 **MEDIUM** - Scheduled repair within 1-2 weeks
- Pothole: Hand-sized (15-25cm wide), visible but not extreme
- Garbage: 1-2 bags properly disposed but overflowing
- Streetlight: Single side street light out
- Water Logging: 5-10cm deep, minor inconvenience
- Sewage: Strong smell but no visible overflow

🟢 **LOW** - Cosmetic issue, can be addressed in monthly maintenance
- Pothole: Coin-sized cracks (<10cm wide), surface-level damage
- Garbage: Small litter pile, 3-4 items on ground
- Streetlight: Light flickering but still functional
- Water Logging: Under 5cm deep, dries quickly
- Sewage: Minor crack in pipe, no smell or visible waste

**IMPORTANT DEMO GUIDELINES:**
- VARY your severity ratings across different images – don't always choose "Medium"
- If you see a clear problem, assign the appropriate severity based on the criteria above
- The description should be SPECIFIC and mention the scale (e.g., "Tire-sized pothole" vs "Small crack")
- If you're borderline between two levels, choose the HIGHER one to encourage action

**OUTPUT FORMAT (Return ONLY valid JSON):**

If it IS a community issue:
{
  "isCommunityIssue": true,
  "issueType": "Pothole",
  "severity": "High",
  "confidence": 94,
  "description": "Tire-sized pothole (approx. 40cm wide) on a busy main road, posing a clear danger to vehicles at speed."
}

If NOT a community issue (e.g., private property, natural scene, unrelated object):
{
  "isCommunityIssue": false,
  "reason": "The image shows a private garden, not a public infrastructure issue."
}
`;

        // Fetch image and convert to base64
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const base64Image = imageBuffer.toString("base64");

        // Call Gemini
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Image,
                },
            },
        ]);

        const text = result.response.text();
        const cleanText = text.replace(/```json|```/g, "").trim();
        const analysis = JSON.parse(cleanText);

        // --- Normalization (Backend Safety Net) ---
        const VALID_TYPES = [
            "Pothole",
            "Garbage",
            "Broken Streetlight",
            "Water Logging",
            "Sewage Issue",
        ];
        const VALID_SEVERITY = ["Low", "Medium", "High", "Severe"];

        if (analysis.isCommunityIssue) {
            // Normalize Issue Type
            const normalizedType = VALID_TYPES.find(
                (type) => type.toLowerCase() === analysis.issueType?.toLowerCase()
            );
            analysis.issueType = normalizedType ?? "Pothole";

            // Normalize Severity
            const normalizedSeverity = VALID_SEVERITY.find(
                (level) => level.toLowerCase() === analysis.severity?.toLowerCase()
            );
            analysis.severity = normalizedSeverity ?? "Medium";
        }

        return NextResponse.json({ success: true, analysis });
    } catch (error) {
        console.error("Analyze error:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}