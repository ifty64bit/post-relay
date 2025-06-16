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
        const text = update.message.text;
        const hasPhotos =
            update.message.photo && update.message.photo.length > 0;
        const hasVideo = update.message.video !== undefined;

        if (!from || !text) {
            console.error("Invalid message format:", update);
            return c.text("Invalid message format", 400);
        }

        const translatedText = await translateText(text, c.env.GEMINI_API_KEY);

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
