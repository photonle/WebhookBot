const fs = require('fs').promises
const path = require('path')

class CertHandler {
	constructor(root){
		this.root = root
		this.found = false
	}

	async find(){
		let max = [0, '']
		let files = await fs.readdir(this.root)
		for (let file of files){
			let p = path.join(this.root, file)
			let d = await fs.stat(p)
			if (d.mtimeMs > max[0]){
				max = [d.mtimeMs, file]
			}
		}
		this.found = /\d+/.exec(max[1])[0]
	}

	async get_file(f, e){
		if (!this.found){
			await this.find()
		}

		return fs.readFile(path.join(this.root, `${f}${this.found}.${e}`))
	}

	async get_cert(){return this.get_file('cert', 'pem')}
	async get_key(){return this.get_file('privkey', 'pem')}
}

module.exports = CertHandler