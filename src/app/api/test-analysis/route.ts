/**
 * DEVELOPMENT ONLY: Quick test for the Gemini analysis prompt.
 * Not intended for production use.
 */
import { model } from "@/lib/gemini";

export async function GET() {
    try {
        const result = await model.generateContent(
            "Classify a pothole on a road in one sentence."
        );
        return Response.json({
            success: true,
            text: result.response.text(),
        });
    } catch (error) {
        return Response.json({
            success: false,
            error: String(error),
        });
    }
}