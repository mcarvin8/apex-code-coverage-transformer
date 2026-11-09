# apex-code-coverage-transformer-core

The programmatic API of [apex-code-coverage-transformer](https://github.com/mcarvin8/apex-code-coverage-transformer), published on its own with **no runtime dependencies**.

Use this package when you call the transformer from your own Node.js code (another CLI plugin, a script, a CI wrapper). Use [apex-code-coverage-transformer](https://www.npmjs.com/package/apex-code-coverage-transformer) for the Salesforce CLI plugin, and the [GitHub Action](https://github.com/marketplace/actions/apex-code-coverage-transformer) for GitHub workflows.

Both npm packages are built from the same source and released with the same version number. The API is identical.

```bash
npm install apex-code-coverage-transformer-core
```

```ts
import { transformCoverage } from 'apex-code-coverage-transformer-core';

const { summary, reports, warnings, passed } = await transformCoverage({
  inputs: ['coverage/coverage/coverage.json'], // file paths and/or already-parsed coverage JSON
  formats: ['cobertura', 'markdown'],
  write: false, // return report contents without writing files
  cwd: '/path/to/sfdx/project', // where to look for sfdx-project.json (default: process.cwd())
});
```

The package is ESM-only and needs Node.js 22.19 or later. See [Programmatic Usage](https://github.com/mcarvin8/apex-code-coverage-transformer#programmatic-usage) for every option, the result shape and error codes.

## License

MIT
