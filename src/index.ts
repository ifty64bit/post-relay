import { Hono } from "hono";
type Bindings = {
    TG_BOT_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
    return c.text("Hello Hono!");
});

app.post("/relay", async (c) => {
    const update = await c.req.json();

    const from = update.message.from;
    const text = update.message.text;
    const hasPhotos = update.message.photo && update.message.photo.length > 0;
    const hasVideo = update.message.video !== undefined;

    //echo the message back
    const response = {
        chat_id: update.message.chat.id,
        text:
            `From: ${from.first_name} ${from.last_name || ""}\n` +
            `Text: ${text}\n` +
            `Has Photos: ${hasPhotos}\n` +
            `Has Video: ${hasVideo}\n` +
            `Photos: ${
                hasPhotos
                    ? update.message.photo.map((p: any) => p.file_id).join(", ")
                    : "None"
            }\n` +
            `Video: ${hasVideo ? update.message.video.file_id : "None"}`,
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
});

export default app;
