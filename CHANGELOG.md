## [1.4.1-beta.5](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.4.1-beta.4...v1.4.1-beta.5) (2024-03-06)

### Bug Fixes

- ensure covered lines in XML match JSON total ([2c6e6bb](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/2c6e6bb022924a5b04775a3076d24f24bb6ecc4b))

## [1.4.1-beta.4](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.4.1-beta.3...v1.4.1-beta.4) (2024-03-06)

### Bug Fixes

- switch do statement to a for statement and start random number count at 1 ([1c29323](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/1c293238e059d47eace1fd395d230e51bb399315))

## [1.4.1-beta.3](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.4.1-beta.2...v1.4.1-beta.3) (2024-03-05)

### Bug Fixes

- print uncovered lines first, then covered lines, ensuring out-of-range lines are replaced with a random unused line ([594e7cb](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/594e7cb47b6acf0823a02fb67a3cc681980e8e0f))

## [1.4.1-beta.2](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.4.1-beta.1...v1.4.1-beta.2) (2024-03-05)

### Bug Fixes

- get total number of lines in each file and assume line is covered if it's not listed as "uncovered" in JSON ([794a9e7](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/794a9e7813db182e47f46c2275a8064b8d92e261))

## [1.4.1-beta.1](https://github.com/mcarvin8/apex-code-coverage-transformer/compare/v1.4.0...v1.4.1-beta.1) (2024-03-04)

### Bug Fixes

- add covered and uncovered lines to XML ([9e8f102](https://github.com/mcarvin8/apex-code-coverage-transformer/commit/9e8f102e9e5c848f5bd604fb2755ae7ea2172cc9))

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
