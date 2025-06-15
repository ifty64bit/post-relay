import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
    return c.text("Hello Hono!");
});

app.post("/relay", async (c) => {
    const update = await c.req.json();

    const message = update.message?.text || "";
    const hasMedia = !!(update.message?.photo || update.message?.video);

    return c.json({
        message,
        hasMedia,
        updateId: update.update_id,
        chatId: update.message?.chat.id,
        userId: update.message?.from.id,
        username: update.message?.from.username,
        firstName: update.message?.from.first_name,
    });
});

export default app;
