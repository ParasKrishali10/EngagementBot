import { Client, GatewayIntentBits, Partials } from "discord.js"
import { prisma } from "./prisma"
import {broadcast} from "./websocket"


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
  ],
});
console.log("BOT PROCESS STARTED");
client.on("ready", () => {
  console.log("BOT LOGGED IN AS", client.user?.tag);
});

client.on("messageReactionAdd",async(reaction,user)=>{
    if(user.bot)
    {
        return
    }
     console.log("REACTION EVENT FIRED", {
    messageId: reaction.message.id,
    emoji: reaction.emoji.name,
  });
    const emoji=reaction.emoji.id ?? reaction.emoji.name!
    const messageId=reaction.message.id
    const channelId=reaction.message.channelId
    const guildId=reaction.message.guildId!

    await prisma.messageReaction.upsert({
        where:{
            messageId_emoji:{messageId,emoji}
        },update:{
            count:{increment:1}
        },create:{
            messageId ,
            channelId ,
            guildId ,
            emoji ,
            count:1

        }
    })

    // Update daily analytics
    const today=new Date()
    today.setHours(0,0,0,0);
    await prisma.dailyReactionStat.upsert({
        where:{
            messageId_date:{messageId,date:today}
        },update:{
            totalReactions:{increment:1}
        },create:{
            messageId,
            date:today,
            totalReactions:1
        }
    })

    broadcast({
        type:"REACTION_UPDATE",
        messageId
    })
})

client.on("messageReactionRemove",async(reaction,user)=>{
    if(user.bot) return

    const emoji=reaction.emoji.id ?? reaction.emoji.name!
    const messageId=reaction.message.id
    await prisma.messageReaction.update({
        where:{
            messageId_emoji:{messageId,emoji}
        },data:{
            count:{decrement:1}
        }
    })

     broadcast({
    type: "REACTION_UPDATE",
    messageId,
  });


})
client.login(process.env.DISCORD_BOT_TOKEN);
