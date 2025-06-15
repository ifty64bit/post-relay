import { Hono } from "hono";
import { GoogleGenAI } from "@google/genai";

type Bindings = {
    TG_BOT_TOKEN: string;
    GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
    return c.text("Hello Hono!");
});

app.post("/relay", async (c) => {
    try {
        const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });

        const update = await c.req.json();

        const from = update.message.from;
        const text = update.message.text;
        const hasPhotos =
            update.message.photo && update.message.photo.length > 0;
        const hasVideo = update.message.video !== undefined;

        if (!from || !text) {
            return c.text("Invalid message format", 400);
        }

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

        const translatedText = getGeminiResponse.candidates?.[0].content;

        //echo the message back
        const response = {
            chat_id: update.message.chat.id,
            text:
                `From: ${from.first_name} ${from.last_name || ""}\n` +
                `Message: ${translatedText}\n`,
        };
        const url = `https://api.telegram.org/bot${c.env.TG_BOT_TOKEN}/sendMessage`;
        const fetchOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(response),
        };
        // @ts-expect-error Hono's fetch is not typed
        const fetchResponse = await fetch(url, fetchOptions);
        if (!fetchResponse.ok) {
            return c.text("Error sending message", 500);
        }

        const result = await fetchResponse.json();

        // Return a success response
        if (!result.ok) {
            return c.text("Failed to send message", 500);
        }

        return c.text("OK");
    } catch (error) {
        const tgErrorResponse = {
            chat_id: "123456789", // Replace with your admin chat ID
            text: `Error processing message: ${
                error instanceof Error ? error.message : String(error)
            }`,
        };
        const url = `https://api.telegram.org/bot${c.env.TG_BOT_TOKEN}/sendMessage`;
        const fetchOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(tgErrorResponse),
        };
        // @ts-expect-error Hono's fetch is not typed
        await fetch(url, fetchOptions);

        return c.text("Internal Server Error", 500);
    }
});

export default app;
