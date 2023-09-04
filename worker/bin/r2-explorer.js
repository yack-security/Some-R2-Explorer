#! /usr/bin/env node
var fs = require('fs')

const args = process.argv.slice(2)
const projectName = args[0] || 'r2-explorer'

const dir = `./${projectName}`
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir)
}

fs.writeFileSync(
  `${dir}/wrangler.toml`,
  `name = "${projectName}"
compatibility_date = "2022-08-09"
main = "src/index.js"
account_id = ""

route = { pattern = "explorer.example.team", custom_domain = true }

[[r2_buckets]]
binding = 'my-bucket-name'
bucket_name = 'my-bucket-name'
preview_bucket_name = 'my-bucket-name'
`
)
fs.writeFileSync(
  `${dir}/package.json`,
  `{
  "name": "${projectName}",
  "version": "0.1.0",
  "private": true,
  "devDependencies": {
    "wrangler": "^2.4.2"
  },
  "scripts": {
    "publish": "wrangler publish"
  },
  "dependencies": {
    "@service-yack/some-r2-explorer": "^1.0.0"
  }
}

`
)

const srcDir = `${dir}/src`
if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir)
}

fs.writeFileSync(
  `${srcDir}/index.js`,
  `import { R2Explorer } from '@service-yack/some-r2-explorer';

export default R2Explorer({ readonly: true, curlFeature: false });
`
)

console.log(`Project ${projectName} successfully created!`)
console.log('----------------------------')
console.log('Next steps:')
console.log(` 1. Run 'cd ${projectName} && npm install'`)
console.log(" 2. Update the 'wrangler.toml' file with your R2 Buckets")
console.log(" 3. Run 'wrangler publish' to deploy your own R2-Explorer!")

process.exit(0) //no errors occurred
