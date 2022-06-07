const { readFileSync } = require('fs')
const IPTVChecker = require('./../src/index')
const checker = new IPTVChecker({ timeout: 2000, parallel: 1 })

function resultTester(result) {
  return result.items.every(item => {
    return (
      Reflect.has(item, `status`) &&
      Reflect.has(item.status, `ok`) &&
      ((Reflect.has(item.status, `message`) &&
        Reflect.has(item.status, `code`)) ||
        (Reflect.has(item.status, `metadata`) &&
          Reflect.has(item.status.metadata, `requests`)))
    )
  })
}

jest.setTimeout(60000)

test(`Should process a playlist URL`, done => {
  const url = 'https://iptv-org.github.io/iptv/languages/amh.m3u'
  checker
    .checkPlaylist(url)
    .then(results => {
      expect(resultTester(results)).toBeTruthy()
      done()
    })
    .catch(done)
})

test(`Should process a stream URL`, done => {
  const url =
    'http://cdn.theoplayer.com/video/elephants-dream/playlist-single-audio.m3u8'
  checker
    .checkStream({ url, timeout: 5000 })
    .then(results => {
      expect(results.status.ok).toBeTruthy()
      done()
    })
    .catch(done)
})

test(`Should handle error HTTP_UNAVAILABLE_FOR_LEGAL_REASONS`, done => {
  const url = 'https://mock.codes/451'
  checker
    .checkStream({ url, timeout: 2000 })
    .then(results => {
      expect(results.status.code).toBe('HTTP_UNAVAILABLE_FOR_LEGAL_REASONS')
      expect(results.status.message).toBe('Unavailable For Legal Reasons')
      done()
    })
    .catch(done)
})

test.only(`Should handle request with forbidden HEAD method`, done => {
  const url = 'https://live.ecomservice.bg/hls/stream.m3u8'
  checker
    .checkStream({ url, timeout: 2000 })
    .then(results => {
      expect(results.status.ok).toBe(true)
      done()
    })
    .catch(done)
})

test(`Should handle error HTTP_REQUEST_TIMEOUT`, done => {
  const url = 'http://62.210.141.179:8000/live/ibrahim/123456/456.m3u8'
  checker
    .checkStream({ url, timeout: 2000 })
    .then(results => {
      expect(results.status.code).toBe('HTTP_REQUEST_TIMEOUT')
      expect(results.status.message).toBe('Request Timeout')
      done()
    })
    .catch(done)
})

test(`Should handle error HTTP_FORBIDDEN`, done => {
  const url =
    'https://artesimulcast.akamaized.net/hls/live/2030993/artelive_de/index.m3u8'
  checker
    .checkStream({ url, timeout: 2000 })
    .then(results => {
      expect(results.status.code).toBe('HTTP_FORBIDDEN')
      expect(results.status.message).toBe('Forbidden')
      done()
    })
    .catch(done)
})

test(`Should process a relative playlist file path`, done => {
  const path = 'test/input/dummy.m3u'
  checker
    .checkPlaylist(path)
    .then(results => {
      expect(resultTester(results)).toBeTruthy()
      done()
    })
    .catch(done)
})

test(`Should process an absolute playlist file path`, done => {
  const playlistPath = `${__dirname}/input/dummy.m3u`
  checker
    .checkPlaylist(playlistPath)
    .then(results => {
      expect(resultTester(results)).toBeTruthy()
      done()
    })
    .catch(done)
})

test(`Should process a playlist data Buffer`, done => {
  const playlistFile = readFileSync(`${__dirname}/input/dummy.m3u`, {
    encoding: 'utf8',
  })
  const playlistBuffer = Buffer.from(playlistFile)
  checker
    .checkPlaylist(playlistBuffer)
    .then(results => {
      expect(resultTester(results)).toBeTruthy()
      done()
    })
    .catch(done)
})

test(`Should process a playlist data string`, done => {
  const playlistFile = readFileSync(`${__dirname}/input/dummy.m3u`, {
    encoding: 'utf8',
  })
  checker
    .checkPlaylist(playlistFile)
    .then(results => {
      expect(resultTester(results)).toBeTruthy()
      done()
    })
    .catch(done)
})

test(`Should throw with invalid input`, async () => {
  await expect(checker.checkPlaylist(1)).rejects.toThrow(
    'Unsupported input type'
  )
})

test(`Should throw with invalid file path`, async () => {
  const badPath = `${__dirname}/input/badPath.m3u`
  await expect(checker.checkPlaylist(badPath)).rejects.toThrow(
    'Playlist is not valid'
  )
})

test(`Should throw on URL fetch failure`, async () => {
  await expect(
    checker.checkPlaylist(`https://www.google.com/teapot`)
  ).rejects.toThrow('Error fetching playlist')
})

test(`Should throw on invalid fetched input data`, async () => {
  await expect(checker.checkPlaylist(`https://github.com`)).rejects.toThrow(
    'URL is not an .m3u playlist file'
  )
})
