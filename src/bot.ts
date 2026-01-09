import { Client, GatewayIntentBits, Partials } from "discord.js";
import { prisma } from "./prisma";
import { broadcast } from "./server"; 
import "dotenv/config";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction,Partials.User],
});
console.log("BOT MODULE INSTANCE", Math.random());


client.once("clientReady", () => {
    console.log("BOT LOGGED IN AS", client.user?.tag);
});
client.on("raw", (packet) => {
  if (packet.t && packet.t.includes("REACTION")) {
    console.log("🔥 RAW EVENT:", packet.t);
  }
});


client.on("messageReactionAdd", async (reaction, user) => {
     console.log("🔥 REACTION ADD EVENT FIRED");
    if (user.bot) return;

    // 🔴 THIS IS REQUIRED
if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch {
      return;
    }
  }

  if (reaction.message.partial) {
    try {
      await reaction.message.fetch();
    } catch {
      return;
    }
  }


    console.log("REACTION EVENT FIRED", {
        messageId: reaction.message.id,
        emoji: reaction.emoji.name,
    });

    const emoji = reaction.emoji.id ?? reaction.emoji.name!;
    const messageId = reaction.message.id;
    const channelId = reaction.message.channelId;
    const guildId = reaction.message.guildId!;

    await prisma.messageReaction.upsert({
        where: {
            messageId_emoji: { messageId, emoji },
        },
        update: {
            count: { increment: 1 },
        },
        create: {
            messageId,
            channelId,
            guildId,
            emoji,
            count: 1,
        },
    });

    broadcast({
        type: "REACTION_UPDATE",
        messageId,
        emoji
    });
});
client.on("messageReactionRemove", async (reaction, user) => {
    if (user?.bot) return;

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch {
            return;
        }
    }

    if (reaction.message.partial) {
        try {
            await reaction.message.fetch();
        } catch {
            return;
        }
    }

    console.log("REACTION REMOVED", {
        messageId: reaction.message.id,
        emoji: reaction.emoji.name,
    });

    const emoji = reaction.emoji.id ?? reaction.emoji.name!;
    const messageId = reaction.message.id;

    await prisma.$transaction(async (tx) => {
        const existing = await tx.messageReaction.findUnique({
            where: { messageId_emoji: { messageId, emoji } },
            select: { count: true },
        });

        if (!existing) {
            return;
        }

        if (existing.count <= 1) {
            await tx.messageReaction.delete({
                where: { messageId_emoji: { messageId, emoji } },
            });
        } else {
            await tx.messageReaction.update({
                where: { messageId_emoji: { messageId, emoji } },
                data: { count: { decrement: 1 } },
            });
        }
    });

    broadcast({
        type: "REACTION_UPDATE",
        messageId,
        emoji
    });
});

client.login(process.env.DISCORD_BOT_TOKEN!);
