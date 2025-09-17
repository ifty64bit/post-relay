import { GoogleGenAI } from "@google/genai";

export async function translateText(
    text: string,
    apiKey: string
): Promise<string | undefined> {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const getGeminiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: `You are an expert Bangla news editor and social media content creator specializing in converting Telegram news into engaging Facebook posts.

Your task: Transform informal Telegram news messages into compelling Facebook news posts that grab attention and encourage engagement.

CONTENT TRANSFORMATION RULES:
1. **Language & Style**: Write in fluent, natural Bangla that sounds like a professional news editor, not a machine translation
2. **Tone**: Use an engaging, slightly dramatic tone appropriate for social media news consumption
3. **Length**: Keep it concise but informative - ideal for Facebook's news feed format
4. **Clarity**: Make complex topics accessible to general Bangladeshi audience

FORMATTING REQUIREMENTS:
1. **Country Flags**: Add relevant flag emojis at the beginning for mentioned countries:
   - 🇷🇺 Russia, 🇺🇦 Ukraine, 🇮🇱 Israel, 🇺🇸 USA, 🇮🇳 India, �� China, �� UK, �� France, �� Germany, etc.
2. **Clean Content**: Remove Telegram channel names, usernames, @mentions, and promotional links
3. **Preserve Technical Terms**: Keep military/technical abbreviations (ATGM, UAV, IDF, NATO, etc.) as they are
4. **Add Context**: Include brief context if the original message assumes prior knowledge

ENGAGEMENT OPTIMIZATION:
1. **Hook**: Start with the most newsworthy element
2. **Urgency**: Use words that convey importance and timeliness
3. **Completeness**: Ensure the post can stand alone without requiring additional context
4. **Facebook-ready**: Format for optimal Facebook engagement and readability

OUTPUT: Only the final Bangla Facebook post with flag emojis. No explanations, no additional text.

Input message to transform:
${text}`,
    });

    return getGeminiResponse.text;
}

type SendMessageToTelegramType = {
    chat_id: string;
    text: string;
    TG_BOT_TOKEN?: string;
};
export async function sendMessageToTelegram({
    chat_id,
    text,
    TG_BOT_TOKEN,
}: SendMessageToTelegramType) {
    const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`;
    const fetchOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            chat_id,
            text,
        }),
    };

    const fetchResponse = await fetch(url, fetchOptions);

    if (!fetchResponse.ok) {
        throw new Error("Error sending message");
    }

    return fetchResponse.json();
}

export async function postToFacebook(
    text: string,
    PAGE_ID: string,
    token: string
) {
    const url = `https://graph.facebook.com/${PAGE_ID}/feed`;
    const fetchOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message: text,
            access_token: token,
        }),
    };

    const fetchResponse = await fetch(url, fetchOptions);
    const responseBody = await fetchResponse.json();

    if (!fetchResponse.ok) {
        console.error("Facebook API Error:", responseBody);
        throw new Error(`Facebook API Error: ${responseBody.error?.message}`);
    }

    return responseBody;
}
