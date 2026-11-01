/**
 * DEVELOPMENT ONLY: Quick test to verify Gemini API connectivity.
 * Not intended for production use.
 */
import { model } from "@/lib/gemini";

export async function GET() {
    try {
        const result = await model.generateContent(
            "Reply with exactly: Gemini is working"
        );
        return Response.json({
            success: true,
            text: result.response.text(),
        });
    } catch (error) {
        console.error(error);
        return Response.json({
            success: false,
            error: String(error),
        });
    }
}