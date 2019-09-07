const http = require('http')
const WebhookHandler = require('github-webhook-handler')
const {WebhookClient} = require('discord.js')
const EnvHandler = require('@doctor_internet/interenv')

let Env = new EnvHandler({
	env: process.env,
})
let repos = new EnvHandler({
	env: require('./data').repos
})
let users = new EnvHandler({
	env: require('./data').users
})
let colours = new EnvHandler({
	env: require('./data').colours
})

let WebhookEnv = Env.prefixed("GIT_")
let handler = WebhookHandler({
	path: WebhookEnv.raw("PATH"),
	secret: WebhookEnv.raw("SECRET")
})

let DiscordEnv = Env.prefixed("DISCORD_")
let discord = new WebhookClient(DiscordEnv.raw("ID"), DiscordEnv.raw("TOKEN"))

handler.on('error', console.error)
handler.on('push', (evt) => {
	let dt = evt.payload
	if (dt.sender.type === 'Bot'){return}

	let repo = dt.repository
	let repoName = repo.full_name

	if (!repos.has(repoName)){return console.log(`Invalid Repo: ${repoName}`)}
	repoName = repos.raw(repoName)
	let color = colours.has(repoName) ? colours.raw(repoName) : "4210752"

	let embeds = []
	for (let commit of dt.commits){
		if (!commit.distinct){continue}

		let blocked = false
		if (blocked){continue}

		let author = commit.author.username
		let name
		if (!users.has(author)){
			console.log(`Undefined Contrib: ${commit.author.name}`)
			name = "a new contributor"
		} else if (users.raw(author)){
			name = users.raw(author)
		} else {
			name = author
		}

		let embed = {
			author: {
				name: name,
				icon_url: dt.sender.avatar_url
			},
			title: `New commit to ${repoName}`,
			type: "rich",
			timestamp: commit.timestamp,
			description: commit.message,
			url: commit.url,
			color: color,
			fields: [{
				name: "Branch",
				value: dt.ref.replace('refs/heads/', ''),
				inline: true
			}]
		}

		if (commit.added.length > 0){
			embed.fields.push({
				name: "New",
				value: commit.added.length,
				inline: true
			})
		}
		if (commit.modified.length > 0){
			embed.fields.push({
				name: "Modified",
				value: commit.modified.length,
				inline: true
			})
		}
		if (commit.removed.length > 0){
			embed.fields.push({
				name: "Deleted",
				value: commit.removed.length,
				inline: true
			})
		}

		embeds.push(embed)
	}

	if (embeds.length === 0){return}
	discord.send("", {
		avatarURL: "https://cdn.discordapp.com/attachments/480220200025718794/494230177115537429/discord-icon.jpg",
		username: "Github Commit Bot",
		embeds: embeds,
		split: true
	})
})

http.createServer((req, res) => {
	handler(req, res, (err) => {
		console.log(err)
		res.statusCode = 404
		res.end('File Not Found')
	})
}).listen(Env.int("PORT"))