import { Hono } from "hono";
import {
    postToFacebook,
    sendMessageToTelegram,
    translateText,
} from "./utils/functions";

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
        const update = await c.req.json();

        const from = update.message.from;
        const text = update.message.text ?? null;
        const caption = update.message.caption ?? null;
        const hasPhotos =
            Array.isArray(update.message.photo) &&
            update.message.photo.length > 0;
        const hasVideo = update.message.video !== undefined;

        const originalMessage = text || caption;

        // 💡 Ignore if: no text/caption AND it's only media (photo or video)
        if (!from || (!originalMessage && (hasPhotos || hasVideo))) {
            console.warn(
                "Skipping media-only message:",
                update.message.message_id
            );
            return c.text("Ignored media-only message", 200); // 200 to avoid retry
        }

        const translatedText = await translateText(
            originalMessage,
            c.env.GEMINI_API_KEY
        );

        //echo the message back
        await sendMessageToTelegram({
            chat_id: update.message.chat.id,
            text:
                `Sender ID: ${from.id}\n` +
                `From: ${from.first_name} ${from.last_name || ""}\n` +
                `Message: ${translatedText}\n`,
            TG_BOT_TOKEN: c.env.TG_BOT_TOKEN,
        });

        await postToFacebook(
            translatedText as string,
            PAGE_ID,
            c.env.FACEBOOK_PAGE_ACCESS_TOKEN
        );

        return c.text("OK");
    } catch (error) {
        console.error("Error processing message:", error);

        return c.text("Internal Server Error");
    }
});

export default app;
