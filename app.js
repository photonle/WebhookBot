const http = require('https')
const fs = require('fs')
const WebhookHandler = require('github-webhook-handler')
const {WebhookClient} = require('discord.js')
const certhandler = require('./cert.js')

const {repos, users, colours} = require('./data.json')

let handler = WebhookHandler({
	path: process.env.GIT_PATH,
	secret: process.env.GIT_SECRET
})
let discord = new WebhookClient(process.env.DISCORD_ID, process.env.DISCORD_TOKEN)
let cert = new certhandler("/cert")

handler.on('error', console.error)
handler.on('push', (evt) => {
	let dt = evt.payload
	if (dt.sender.type === 'Bot'){return}

	if (repos[dt.repository.full_name] === undefined){return console.log(`Invalid Repo: ${dt.repository.full_name}`)}
	let repo = repos[dt.repository.full_name]
	let color = colours[dt.repository.full_name] !== undefined ? colours[dt.repository.full_name] : "4210752"

	let embeds = []
	for (let commit of dt.commits){
		if (!commit.distinct){continue}
		// let blocked = commit.message.indexOf("private=1") !== -1
		let blocked = false

		let name = users[commit.author.username] !== undefined ? (users[commit.author.username] ? users[commit.author.username] : commit.author.username) : "a new contributor"
		if (name === "a new contributor"){console.log(`Undefined Contrib: ${commit.author.name}`)}

		embeds.push({
			author: {
				name: name,
				icon_url: dt.sender.avatar_url
			},
			title: `New commit to ${repo}`,
			type: "rich",
			timestamp: commit.timestamp,
			description: blocked ? "*Private Commit.*" : commit.message,
			url: commit.url,
			color: color,
			fields: [{
				name: "Branch",
				value: dt.ref.replace('refs/heads/', ''),
				inline: true
			}, {
				name: "Modified",
				value: commit.added.length + commit.modified.length,
				inline: true
			}, {
				name: "Deleted",
				value: commit.removed.length,
				inline: true
			}]
		})
	}

	if (embeds.length === 0){return}
	discord.send("", {
		avatarURL: "https://cdn.discordapp.com/attachments/480220200025718794/494230177115537429/discord-icon.jpg",
		username: "Github Commit Bot",
		embeds: embeds,
		split: true
	})
})

async function run(){
	let k = await cert.get_key()
	let c = await cert.get_cert()

	let opts = {
		key: k,
		cert: c
	}

	http.createServer(opts, (req, res) => {
		handler(req, res, (err) => {
			console.log(err)
			res.statusCode = 404
			res.end('File Not Found')
		})
	}).listen(process.env.PORT)
}
run()