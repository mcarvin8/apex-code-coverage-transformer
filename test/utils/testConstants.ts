import { resolve } from 'node:path';

const fixturesDir = 'test/fixtures';

export const baselineClassPath = resolve(fixturesDir, 'samples/classes/AccountProfile.cls');
export const baselineTriggerPath = resolve(fixturesDir, 'samples/triggers/AccountTrigger.trigger');
export const deployCoverage = resolve(fixturesDir, 'inputs/deploy_coverage.json');
export const testCoverage = resolve(fixturesDir, 'inputs/test_coverage.json');
export const invalidJson = resolve(fixturesDir, 'inputs/invalid.json');
export const sonarBaselinePath = resolve(fixturesDir, 'baselines/sonar_baseline.xml');
export const jacocoBaselinePath = resolve(fixturesDir, 'baselines/jacoco_baseline.xml');
export const lcovBaselinePath = resolve(fixturesDir, 'baselines/lcov_baseline.info');
export const coberturaBaselinePath = resolve(fixturesDir, 'baselines/cobertura_baseline.xml');
export const cloverBaselinePath = resolve(fixturesDir, 'baselines/clover_baseline.xml');
export const jsonBaselinePath = resolve(fixturesDir, 'baselines/json_baseline.json');
export const jsonSummaryBaselinePath = resolve(fixturesDir, 'baselines/json-summary_baseline.json');
export const simplecovBaselinePath = resolve(fixturesDir, 'baselines/simplecov_baseline.json');
export const opencoverBaselinePath = resolve(fixturesDir, 'baselines/opencover_baseline.xml');
export const htmlBaselinePath = resolve(fixturesDir, 'baselines/html_baseline.html');
export const defaultPath = resolve('coverage.xml');
export const sfdxConfigFile = resolve('sfdx-project.json');

/** Package directory path used in tests for sample Apex; use this when passing ignorePackageDirectories. */
export const samplesPackagePath = `${fixturesDir}/samples`;

const configFile = {
  packageDirectories: [{ path: 'force-app', default: true }, { path: 'packaged' }, { path: samplesPackagePath }],
  namespace: '',
  sfdcLoginUrl: 'https://login.salesforce.com',
  sourceApiVersion: '58.0',
};
export const configJsonString = JSON.stringify(configFile, null, 2);
export const inputJsons = [
  { label: 'deploy', path: deployCoverage },
  { label: 'test', path: testCoverage },
] as const;
