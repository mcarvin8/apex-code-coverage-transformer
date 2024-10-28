<!-- markdownlint-disable MD024 MD025 -->
<!-- markdown-link-check-disable -->

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.2.0](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v2.1.0...v2.2.0) (2024-10-28)


### Features

* remove dependency on git repos ([c2bc72d](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/c2bc72d72de00da8b52f3f1ae0a6b8805316b20f))

## [2.1.0](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v2.0.0...v2.1.0) (2024-10-22)


### Features

* remove command flag by adding type guard functions ([be380bf](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/be380bf2400cb217a3769d6272668d6ba277a6a4))

## [2.0.0](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.7.6...v2.0.0) (2024-10-21)


### ⚠ BREAKING CHANGES

* shorten command to acc-transformer

### Features

* shorten command to acc-transformer ([686cdc6](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/686cdc6960f8f73e7796e6b97928a8294a6b450b))

## [1.7.6](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.7.5...v1.7.6) (2024-07-28)


### Bug Fixes

* refactor fs import ([d246c28](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/d246c28f70f5cd2ac40110b2d376ad0bac59384d))

## [1.7.5](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.7.4...v1.7.5) (2024-07-28)


### Bug Fixes

* switch to isomorphic-git ([2da1fcc](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/2da1fcc2f55cf76296d1b7cd033daedba1bf496d))

## [1.7.4](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.7.3...v1.7.4) (2024-06-10)

### Bug Fixes

- include `apex get test` command in the hook ([34718f0](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/34718f0c146dbf51efe04c81d994c0c724e84a0c))
- update the hook to allow 2 different JSON paths based on command ([f6159be](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/f6159be3fe12801a00c06f44a5304cab2d02697e))

## [1.7.3](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.7.2...v1.7.3) (2024-05-15)

### Bug Fixes

- fix handling of an empty JSON from the test run command ([48ef6df](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/48ef6df77eda762006a78e1d2eb66936d57ee418))
- warn instead of fail when no files in the JSON are processed ([7809843](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/780984332c279ed7142695cbf262e67f69e916c0))

## [1.7.2](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.7.1...v1.7.2) (2024-05-10)

### Bug Fixes

- add support for coverage JSONs created by `sf apex run test` ([5f48b77](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/5f48b777f1ccd003d650c50ef87a0b24e2b4a73f))

## [1.7.2-beta.1](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.7.1...v1.7.2-beta.1) (2024-05-09)

### Bug Fixes

- add support for coverage JSONs created by `sf apex run test` ([5f48b77](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/5f48b777f1ccd003d650c50ef87a0b24e2b4a73f))

## [1.7.1](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.7.0...v1.7.1) (2024-04-30)

### Bug Fixes

- fix no-map replacement for windows-style paths ([e6d4fef](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/e6d4fef16266a8075c01601b3f5a838a058c5fa2))

# [1.7.0](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.6.8...v1.7.0) (2024-04-30)

### Features

- add a post run hook for post deployments ([894a4cd](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/894a4cdb14f6367b3e9248e757b1463e3134ae83))

## [1.6.8](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.6.7...v1.6.8) (2024-04-23)

### Bug Fixes

- get package directories and repo root before looping through files ([b630002](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/b6300020d650e02928c3b5700b05aa0c4bda050e))

## [1.6.7](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.6.6...v1.6.7) (2024-04-23)

### Bug Fixes

- remove `--sfdx-configuration` flag and get `sfdx-project.json` path using `simple-git` ([87d92f3](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/87d92f39fdd4f404887dc2c931940ea3221d7606))

## [1.6.6](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.6.5...v1.6.6) (2024-04-22)

### Bug Fixes

- fix path resolution when running in non-root directories ([c16fe7d](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/c16fe7d09898b857c68c2cc73a1ac2bcc8665f1e))

## [1.6.5](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.6.4...v1.6.5) (2024-04-18)

### Bug Fixes

- build XML using xmlbuilder2 and normalize path building using posix ([c6d6d94](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/c6d6d944e2675eb6be0dd90e972d67e6311f6738))

## [1.6.4](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.6.3...v1.6.4) (2024-04-09)

### Bug Fixes

- switch to promises/async and refactor imports ([2577692](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/2577692672aeb9271151f67e8347ef8a09a07b37))

## [1.6.3](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.6.2...v1.6.3) (2024-03-27)

### Bug Fixes

- remove flow logic ([dd3db2a](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/dd3db2ab60614dd21bdc844b78c8e882814c43a8))

## [1.6.2](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.6.1...v1.6.2) (2024-03-26)

### Bug Fixes

- warn if a file isn't found and fail if no files are found ([6b9e8ea](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/6b9e8ea80f9101429f82eed7fb3539c71dc613f4))

## [1.6.1](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.6.0...v1.6.1) (2024-03-22)

### Bug Fixes

- search the directories recursively without hard-coding the sub-folder names ([8880ab3](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/8880ab3e3c9097b8e7927230395eae32560ae55a))

## [1.6.1-beta.1](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.6.0...v1.6.1-beta.1) (2024-03-22)

### Bug Fixes

- search the directories recursively without hard-coding the sub-folder names ([8880ab3](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/8880ab3e3c9097b8e7927230395eae32560ae55a))

# [1.6.0](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.5.0...v1.6.0) (2024-03-21)

### Features

- add `covered` lines, renumbering out-of-range lines numbers ([1733b09](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/1733b09063eac28f0e627e66080dcd24d7c74bf9))

# [1.6.0-beta.1](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.5.0...v1.6.0-beta.1) (2024-03-20)

### Features

- add `covered` lines, renumbering out-of-range lines numbers ([1733b09](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/1733b09063eac28f0e627e66080dcd24d7c74bf9))

# [1.5.0](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.4.0...v1.5.0) (2024-03-20)

### Features

- support multiple package directories via the sfdx-project.json ([52c1a12](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/52c1a12ff5fbfb10c215a41e010ee7fc6c0370de))

# [1.4.0](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.3.1...v1.4.0) (2024-02-27)

### Features

- if coverage JSON includes file extensions, use that to determine paths ([efc1fa6](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/efc1fa61ce21cff394bbc696afce88c4d57894ea))

## [1.3.1](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.3.0...v1.3.1) (2024-02-26)

### Bug Fixes

- dx-directory should be an existing directory and fix flag in messages ([38fb20b](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/38fb20b8a107c203ba78266cb05d133805135ce4))

# [1.3.0](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.2.0...v1.3.0) (2024-02-07)

### Features

- add support for flows ([6bf0da1](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/6bf0da14a39871dc3b7d50565416c2d24fba7524))

# [1.2.0](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.1.1...v1.2.0) (2024-02-07)

### Features

- check if file name is an apex class or apex trigger using the dx directory flag ([215e41e](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/215e41eab0c41e2861d86370b0bddae2b2e487f0))

## [1.1.1](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.1.0...v1.1.1) (2024-02-07)

### Bug Fixes

- resolve path to xml ([cc75e96](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/cc75e96ef26120f86cff8588256e4f55e79d5473))

# [1.1.0](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.0.0...v1.1.0) (2024-02-07)

### Features

- update json flag name to ensure it's unique from the global flag and import path module ([d03c567](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/d03c567a7549e5ada291d82525c78e19a1b8fcba))

# 1.0.0 (2024-02-07)

### Features

- init release ([504b4cf](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/504b4cfb028fc14241b892e1cc872adadec736d7))
