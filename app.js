const Klanter = require("discord.js").Client;
const req = require("node-fetch");
const fs = require("fs");
const db = require("./db.json");
const client = new Klanter();

client.config = require("./config.json");
client.login(process.env.token)
  .catch(() => console.log("Token Yanlış orusbu."));

client.on("ready", () => {
  console.log(client.user.username, true, "Aktif Kanka xd");
  client.user.setPresence({
    activity: { name: client.config.Bot_Status },
    type: "WATCHING",
    status: "idle",
  });

  setInterval(async () => {
    if (db.url.length !== 0) req_url();
  }, 999);

  setInterval(() => {
    const guild = client.guilds.cache.get(client.config.GuildID);
    if (guild && guild.vanityURLCode == db.url) {
      client.channels.cache
        .get(client.config.LogChannelID)
        .send("Congrats! The " + db.url + " successfully getted 🎉🎉")
        .catch(() => {});
      db.url = "";
      fs.writeFile("./db.json", JSON.stringify(db), () => {});
    }
  }, 10000);
});

client.on("message", async (message) => {
  if (
    message.guild.id !== client.config.GuildID ||
    message.content.startsWith(client.config.Prefix) == false ||
    message.channel.type === "dm"
  )
    return;
  if (client.config.AdminIDs.includes(message.author.id) == false) return;
  let args = message.content.split(" ").slice(1);
  let command = message.content
    .split(" ")[0]
    .slice(client.config.Prefix.length);

  if (command.toLowerCase() == "status") {
    if (db.url.length == 0)
      return err_message(
        message.channel,
        "There are currently no spammed url."
      );
    else
      message.channel.send(
        "**" + db.url + "** urlsi düşünce sunucuya otomatik eklenecektir."
      );
  }

  if (command.toLowerCase() == "start") {
    if (!args[0]) return err_message(message.channel, "You must enter a url!");

    if (!message.guild.features.includes("VANITY_URL"))
      return err_message(
        message.channel,
        "To use custom url feature, boost level must be **3**!"
      );

    if (args[0].length < 3)
      return err_message(
        message.channel,
        "The url you want to spam must be at least **3** characters!"
      );

    if (args[0].length > 25)
      return err_message(
        message.channel,
        "The url you want to spam must contain a maximum of **25** characters."
      );

    if (
      args[0].toLowerCase().replace(/[\u{0080}-\u{10FFFF}]/gu, "").length == 0
    )
      return err_message(
        message.channel,
        "The url you entered must only contain **English** characters!"
      );

    if (db.url.length !== 0) {
      message.channel
        .send(
          "**" +
            db.url +
            "** url is currently being spammed. Are you sure you want to change?"
        )
        .then((msg) => {
          Promise.all([msg.react("✅"), msg.react("❌")]);

          let coll = msg.createReactionCollector(
            (reaction, user) => user.id == message.author.id,
            { max: 1, time: 20000, error: ["time"] }
          );

          coll.on("collect", async (reaction, user) => {
            if (reaction.emoji.name == "✅") {
              await msg.delete();
              message.channel.send(
                "The **" +
                  args[0].toLowerCase() +
                  "** spam successfully started."
              );
              db.url = args[0].toLowerCase();
              fs.writeFile("./db.json", JSON.stringify(db), () => {});
            } else if (reaction.emoji.name == "❌") await msg.delete();
          });
        });
    } else {
      message.channel.send(
        "The **" + args[0].toLowerCase() + "** spam successfully started."
      );
      db.url = args[0].toLowerCase();
      fs.writeFile("./db.json", JSON.stringify(db), () => {});
    }
  }

  if (command.toLowerCase() == "stop") {
    if (db.url.length == 0)
      return err_message(
        message.channel,
        "There are currently no spammed url."
      );
    else {
      message.channel.send(
        "The **" + db.url + "** url spam is successfully stopped."
      );
      db.url = "";
      fs.writeFile("./db.json", JSON.stringify(db), () => {});
    }
  }
});

function err_message(channel, message) {
  channel.send(message).then((x) => {
    x.delete({ timeout: 7500 });
  });
}

async function req_url() {
  await req(
    `https://discord.com/api/v8/guilds/${client.config.GuildID}/vanity-url`,
    {
      credentials: "include",
      headers: {
        accept: "*/*",
        authorization: "Bot " + client.config.Bot_Token,
        "content-type": "application/json",
      },
      referrerPolicy: "no-referrer-when-downgrade",
      body: JSON.stringify({ code: db.url }),
      method: "PATCH",
      mode: "cors",
    }
  );
}
