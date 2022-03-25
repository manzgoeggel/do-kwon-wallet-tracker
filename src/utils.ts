import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

export const scanWallet = async (block: number) => {
	const provider = new ethers.providers.EtherscanProvider(undefined, process.env.ETHERSCAN_API_KEY);
	const history = await provider.getHistory("0xb20f4638249fd1e6cc27e3c3854935daed522714", block);

	for await (const transaction of history) {
		const { blockNumber, logs } = await provider.getTransactionReceipt(transaction.hash);

		if (logs[0]?.data) {
			const toAddress = logs[0].topics[1];

			if (toAddress === "0x000000000000000000000000ad41bd1cf3fd753017ef5c0da8df31a3074ea1ea") {
				const amount = parseInt(logs[0]?.data, 16) / 1000000;

				return {
					amount,
					blockNumber,
					transactionHash: transaction.hash,
				};
			}
		}
	}
	throw new Error("can't find any new matching transactions");
};
