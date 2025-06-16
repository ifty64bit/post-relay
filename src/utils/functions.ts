import { GoogleGenAI } from "@google/genai";

export async function translateText(
    text: string,
    apiKey: string
): Promise<string | undefined> {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const url = "https://translation.googleapis.com/language/translate/v2";
    const getGeminiResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `You are a language-cleaning and localization assistant.
        Given a short news message copied from a Telegram channel, follow these steps:
        1. Detect and identify the country or countries mentioned (e.g., Russia, Ukraine, Israel, USA).
        2. Add the corresponding flag emoji (🇷🇺, 🇺🇦, 🇮🇱, 🇺🇸, etc.) at the beginning of the final output.
        3. Remove the name or link of the Telegram channel (if mentioned at the beginning or end).
        4. Translate the message into fluent Bangla, using a tone similar to a news headline or update.
        5. Preserve English abbreviations such as ATGM, UAV, IDF, etc.
        6. Use commonly spoken and easy-to-understand Bangla words suitable for social media.

        ✦ Output only the cleaned Bangla text with the flag emoji at the start. Nothing else.

        Here is the message:
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
