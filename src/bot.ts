import cron from "cron";
import { createClient } from "redis";
import dotenv from "dotenv";
import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { scanWallet } from "./utils";
dotenv.config();

//create a http server for the health digitalocean checks
const app = express();
app.get("/", (req, res) => {
	res.send("server is on");
});

app.listen(8080);

(async () => {
	// Create a bot that uses 'polling' to fetch new updates
	const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
	console.log("Bot started!", new Date());

	// connect to redis
	const client = createClient({
		url: process.env.REDIS_URL,
	});

	await client.connect();
	client.on("error", (err) => console.log("Redis Client Error", err));
	//cronjobs
	const job = new cron.CronJob("*/5 * * * *", async () => {
		try {
			let blockNum = await client.get("blockNum");
			if (blockNum === null) {
				await client.set("blockNum", 14447323);
				blockNum = await client.get("blockNum");
			}

			const { amount, blockNumber, transactionHash } = await scanWallet(parseInt(blockNum));

			if (blockNumber > parseInt(blockNum)) {
				//send event
				await bot.sendMessage(`
                New Transfer!
                ${amount}USDT

                ------------
                https://etherscan.io/tx/${transactionHash}
                `);

				//update redis db if new blockNumber
				await client.set("blockNum", blockNumber);
			}
		} catch (error) {
			console.log(error);
		}
	});
	job.start();
})();
