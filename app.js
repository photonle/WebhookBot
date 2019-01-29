const env = require('./.env.json')
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
handler.on('push', (evt) => console.log(evt))
handler.on('push', (evt) => {discord.send(evt)})