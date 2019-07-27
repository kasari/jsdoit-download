const fs = require('fs');
const path = require('path');
const rp = require('request-promise')
const jsdom = require('jsdom')
const { JSDOM } = jsdom

class Downloader {
  constructor(downloadDir) {
    this.downloadDir = downloadDir
  }

  async download(userName) {
    const downloadDir = path.join(this.downloadDir, userName)
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir)
    }

    console.log(`Download ${userName}'s codes`)

    let url = `http://jsdo.it/${userName}/codes`
    do {
      console.log()
      console.log(`[Fetch] ${url}`)
      const codeListPage = await this._codeListPage(url)
      const codes = codeListPage.codes.filter(c => !c.isPrivate)
      for (const code of codes) {
        console.log(`[Download] ${code.title}.zip`)
        const codeZip = await rp({url: code.url + '/download', encoding: null})
        fs.writeFileSync(path.join(downloadDir, `${code.title}.zip`), codeZip);
      }
      url = codeListPage.nextUrl
    } while (url)
  }

  async _codeListPage(url) {
    const html = await rp(url)
    const dom = new JSDOM(html)
    const codeDoms = dom.window.document.querySelectorAll('div.unitCodeThumb > p.ttl > a')
    const pagerDoms = dom.window.document.querySelectorAll('#sectActivity > ul > li > a')
    const nextDom = Array.from(pagerDoms).find(d => d.rel === 'next')
    const nextUrl = nextDom ? nextDom.href : null

    const codes = Array.from(codeDoms).map(cd => {
      const title = cd.title
      const url = cd.href
      const isPrivate = Array.from(cd.children).some(c => c.className === 'labelPrivate')
      return new Code(title, url, isPrivate)
    })

    return new CodeListPage(codes, nextUrl)
  }
}

class CodeListPage {
  constructor(codes, nextUrl) {
    this.codes = codes
    this.nextUrl = nextUrl
  }
}

class Code {
  constructor(title, url, isPrivate) {
    this.title = title
    this.url = url
    this.isPrivate = isPrivate
  }
}

module.exports = Downloader;
