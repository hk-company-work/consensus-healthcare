import fs from "fs";
import crypto from "crypto";

class Block {
	index!			: number;			// if first block: 0
	previous_hash!	: string;			// hash from previous block
	timestamp!		: number;			// UNIX-time
	message!	: string;				// public message (encrypted with sk, decrypt with pk)
	userdata!	: string;				// private userdata (encrypted with pk, decrypt with sk)
	hash!			: string;			// sha-256

	private constructor() {}

	static of(index: number, previous_hash: string,
				timestamp	: number,
				message		: string,
				userdata	: string,
				hash		: string): Block {
		return {
			index: index, previous_hash: previous_hash,
			timestamp: timestamp,
			message: message,
			userdata: userdata,
			hash: hash
		};
	}
}

export class BlockChain
{
	#blocks: Block[] = [];

	public constructor() {}
	
	load(local_path: fs.PathOrFileDescriptor): void {
		let json_obj: { chain: Block[] } = JSON.parse(fs.readFileSync(local_path).toString());
		this.#blocks.splice(0, this.#blocks.length);
		this.#blocks.push(...(json_obj.chain));
	}

	saveAs(local_path: fs.PathOrFileDescriptor): void {
		let json_obj: { chain: Block[] } = { chain: this.#blocks };
		fs.writeFileSync(local_path, JSON.stringify(json_obj));
	}

	genesis(): Block | undefined {
		return this.#blocks.at(0);
	}

	tryPush(message: string, userdata: string, pow_nounce: number): boolean {
		let index			: number = this.#blocks.length;
		let previous_hash	: string = (index != 0) ? this.#blocks[index-1].hash : "";
		let timestamp		: number = Date.now();
		let hash			: string = toHash(previous_hash + pow_nounce.toString());
		
		if (!validateHash(hash))
			return false;
		else {
			this.#blocks.push(Block.of(index, previous_hash, timestamp, message, userdata, hash));
			return true;
		}
	}

	mineAndPush(message: string, userdata: string): boolean {
		let index			: number = this.#blocks.length;
		let previous_hash	: string = (index != 0) ? this.#blocks[index-1].hash : "";
		let nounce			: number = mine(previous_hash);
		if (nounce != Number.NaN) {
			this.tryPush(message + " ([demo] mined nounce: " + nounce.toString() + ")", userdata, nounce);
			return true;
		}
		else {
			return false;
		}
	}
}


function toHash(pow_string: string): string {
	return crypto.createHash("sha256").update(pow_string.toString()).digest("hex");
}

function validateHash(hash: string): boolean {
	// digit head only	(  /^[\d]/  )
	//if (hash.match(/^[\d]/))
	//	return true;
	//return false;
	return hash.startsWith("000");
}

function mine(previous_hash: string): number {
	const MAX_NOUNCE: number = 100000;	// Number.MAX_SAFE_INTEGER
	for (let i: number = 0; i < MAX_NOUNCE; i++)
		if (validateHash(toHash(previous_hash + i.toString())))
			return i;
	return Number.NaN;
}