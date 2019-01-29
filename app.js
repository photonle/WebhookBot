const env = require('./.env.json')
const {repos, users} = require('./data.json')
const http = require('https')
const fs = require('fs')
const ghwebhook = require('github-webhook-handler')
const {RichEmbed, WebhookClient} = require('discord.js')

let handler = ghwebhook(env.git)
let discord = new WebhookClient(env.discord.id, env.discord.token)
const opts = {
	key: fs.readFileSync(env.https.key),
	cert: fs.readFileSync(env.https.cert)
};

http.createServer(opts, (req, res) => {
	handler(req, res, (err) => {
		console.log(err)
		res.statusCode = 404
		res.end('File Not Found')
	})
}).listen(env.port)

handler.on('error', (err) => console.log(err))
// handler.on('push', (evt) => console.log(evt))
handler.on('push', (evt) => {
	let dt = evt.payload

	if (repos[dt.repository.full_name] === undefined){return console.log(`Invalid Repo: ${dt.repository.full_name}`)}
	let repo = repos[dt.repository.full_name]
	let embeds = []

	for (let commit of dt.commits){
		console.log(commit.author)
		let blocked = commit.message.indexOf("private=1") !== -1
		let name = users[commit.author.username] !== undefined ? (users[commit.author.username] ? users[commit.author.username] : commit.author.username) : "a new contributor"
		if (name === "a new contributor"){console.log(`Undefined Contrib: ${commit.author.name}`)}

		embeds.push({
			author: {
				name: name,
				icon_url: dt.sender.avatar_url
			},
			title: `New commit to ${repo}`,
			type: "rich",
			timestamp: commit.date,
			description: blocked ? "A private commit." : commit.summary.raw
		})
	}

	discord.send("", {
		avatarURL: "https://cdn.discordapp.com/attachments/480220200025718794/494230177115537429/discord-icon.jpg",
		username: "Discord Notifier Bot",
		embeds: embeds,
		split: true
	})
})