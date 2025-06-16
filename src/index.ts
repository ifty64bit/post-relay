import { Hono } from "hono";
import { GoogleGenAI } from "@google/genai";

type Bindings = {
    TG_BOT_TOKEN: string;
    GEMINI_API_KEY: string;
    FACEBOOK_PAGE_ACCESS_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const PAGE_ID = "491993130654751";

app.get("/", (c) => {
    return c.text("Hello Hono!");
});

app.post("/relay", async (c) => {
    try {
        // const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });

        const update = await c.req.json();

        const from = update.message.from;
        const text = update.message.text;
        const hasPhotos =
            update.message.photo && update.message.photo.length > 0;
        const hasVideo = update.message.video !== undefined;

        if (!from || !text) {
            return c.text("Invalid message format", 400);
        }

        // const getGeminiResponse = await ai.models.generateContent({
        //     model: "gemini-2.0-flash",
        //     contents: `You are a language-cleaning and localization assistant.
        // Given a short news message copied from a Telegram channel, follow these steps:
        // 1. Detect and identify the country or countries mentioned (e.g., Russia, Ukraine, Israel, USA).
        // 2. Add the corresponding flag emoji (🇷🇺, 🇺🇦, 🇮🇱, 🇺🇸, etc.) at the beginning of the final output.
        // 3. Remove the name or link of the Telegram channel (if mentioned at the beginning or end).
        // 4. Translate the message into fluent Bangla, using a tone similar to a news headline or update.
        // 5. Preserve English abbreviations such as ATGM, UAV, IDF, etc.
        // 6. Use commonly spoken and easy-to-understand Bangla words suitable for social media.

        // ✦ Output only the cleaned Bangla text with the flag emoji at the start. Nothing else.

        // Here is the message:
        // ${text}`,
        // });

        // const translatedText = getGeminiResponse.text;

        //echo the message back
        const response = {
            chat_id: update.message.chat.id,
            text:
                `Sender ID: ${from.id}\n` +
                `From: ${from.first_name} ${from.last_name || ""}\n` +
                `Message: ${text}\n`,
        };
        const url = `https://api.telegram.org/bot${c.env.TG_BOT_TOKEN}/sendMessage`;
        const fetchOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(response),
        };

        const fetchResponse = await fetch(url, fetchOptions);

        if (!fetchResponse.ok) {
            return c.text("Error sending message", 500);
        }

        const result = await fetchResponse.json();

        console.log("Response from Telegram:", result);

        // const fbResponse = await fetch(
        //     `https://graph.facebook.com/${PAGE_ID}/feed`,
        //     {
        //         method: "POST",
        //         headers: { "Content-Type": "application/json" },
        //         body: JSON.stringify({
        //             message: translatedText,
        //             access_token: c.env.FACEBOOK_PAGE_ACCESS_TOKEN,
        //         }),
        //     }
        // );

        // Return a success response
        if (!result.ok) {
            return c.text("Failed to send message", 500);
        }

        return c.text("OK");
    } catch (error) {

        console.error("Error processing message:", error);

        return c.text("Internal Server Error", 500);
    }
});

export default app;
