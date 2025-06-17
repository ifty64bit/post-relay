import { GoogleGenAI } from "@google/genai";

export async function translateText(
    text: string,
    apiKey: string
): Promise<string | undefined> {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const url = "https://translation.googleapis.com/language/translate/v2";
    const getGeminiResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `You are an expert Bangla news editor and social media writer.
        You are given short, informal news messages copied from Telegram channels.
        
        Your job is to rewrite these messages into fluent, natural Bangla, like a catchy news headline or social media update. Do **not** translate word-for-word. Instead, understand the meaning and write in your own words in easy-to-understand, commonly used Bangla.
        
        Do the following:
        1. Detect any mentioned countries (e.g., Russia, Ukraine, Israel, USA) and add their flag emoji (🇷🇺, 🇺🇦, 🇮🇱, 🇺🇸, etc.) at the beginning of the message.
        2. Remove any Telegram channel names, usernames, or links.
        3. Preserve all abbreviations (e.g., ATGM, UAV, IDF, etc.).
        4. Focus on the **core meaning**, context, and emotion of the original message.
        5. Avoid robotic or machine-like language. Write naturally for a Bangladeshi audience.
        
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
