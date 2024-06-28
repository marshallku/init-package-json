const path = require('node:path')
const fs = require('fs/promises')
const t = require('tap')
const { setup, child, isChild } = require('./fixtures/setup')

if (isChild()) {
  return child()
}

const cwd = process.cwd()
let updateContent

t.beforeEach(async () => {
  const testdir = t.testdir({
    '.git': {
      config: '',
    },
  })

  updateContent = (content) => {
    const gitConfigPath = path.resolve(testdir, '.git/config')
    return fs.writeFile(gitConfigPath, content)
  }

  // Copy package.json
  await fs.copyFile(
    path.resolve(cwd, 'package.json'),
    path.resolve(testdir, 'package.json')
  )

  process.chdir(testdir)
})

t.afterEach(() => {
  process.chdir(cwd)
})

t.test('license', async (t) => {
  const { data } = await setup(t, __filename, {
    inputs: [
      'the-name', // package name
      '', // version
      '', // description
      '', // entry point
      '', // test
      'npm/cli', // git repo
      '', // keywords
      '', // author
      '', // license
      'yes', // about to write
    ],
  })

  const wanted = {
    name: 'the-name',
    version: '1.0.0',
    description: '',
    scripts: { test: 'echo "Error: no test specified" && exit 1' },
    author: '',
    repository: {
      type: 'git',
      url: 'git+https://github.com/npm/cli.git',
    },
    main: 'index.js',
  }
  t.has(data, wanted)
})

t.test('parse repository from git config', async (t) => {
  await updateContent(`
[core]
    repositoryformatversion = 0
    filemode = true
    bare = false
    logallrefupdates = true
[remote "origin"]
    url = https://github.com/npm/init-package-json.git
    fetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
    remote = origin
    merge = refs/heads/main
`)

  const { data } = await setup(t, __filename, {
    inputs: [
      'the-name', // package name
      '', // version
      '', // description
      '', // entry point
      '', // test
      '', // git repo
      '', // keywords
      '', // author
      '', // license
      'yes', // about to write
    ],
  })

  const wanted = {
    name: 'the-name',
    version: '1.0.0',
    description: '',
    scripts: { test: 'echo "Error: no test specified" && exit 1' },
    author: '',
    repository: {
      type: 'git',
      url: `git+https://github.com/npm/init-package-json.git`,
    },
    main: 'index.js',
  }

  t.has(data, wanted)
})
