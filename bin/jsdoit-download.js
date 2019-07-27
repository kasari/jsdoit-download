#!/usr/bin/env node
const program = require('commander')
const Downloader = require('../src/downloader')

program
  .option('-u, --user <name>', 'user name')
  .option('-d, --dir <path>', 'output dir', '.')

program.parse(process.argv);

if (!program.user) {
  console.log('please set user name');
  process.exit(1)
}

const downloader = new Downloader(program.dir)
downloader.download(program.user)
