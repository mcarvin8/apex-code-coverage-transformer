import { resolve } from 'node:path';

export const baselineClassPath = resolve('samples/classes/AccountProfile.cls');
export const baselineTriggerPath = resolve('samples/triggers/AccountTrigger.trigger');
export const deployCoverage = resolve('inputs/deploy_coverage.json');
export const testCoverage = resolve('inputs/test_coverage.json');
export const invalidJson = resolve('inputs/invalid.json');
export const sonarBaselinePath = resolve('baselines/sonar_baseline.xml');
export const jacocoBaselinePath = resolve('baselines/jacoco_baseline.xml');
export const lcovBaselinePath = resolve('baselines/lcov_baseline.info');
export const coberturaBaselinePath = resolve('baselines/cobertura_baseline.xml');
export const cloverBaselinePath = resolve('baselines/clover_baseline.xml');
export const jsonBaselinePath = resolve('baselines/json_baseline.json');
export const jsonSummaryBaselinePath = resolve('baselines/json-summary_baseline.json');
export const simplecovBaselinePath = resolve('baselines/simplecov_baseline.json');
export const opencoverBaselinePath = resolve('baselines/opencover_baseline.xml');
export const defaultPath = resolve('coverage.xml');
export const sfdxConfigFile = resolve('sfdx-project.json');

const configFile = {
  packageDirectories: [{ path: 'force-app', default: true }, { path: 'packaged' }, { path: 'samples' }],
  namespace: '',
  sfdcLoginUrl: 'https://login.salesforce.com',
  sourceApiVersion: '58.0',
};
export const configJsonString = JSON.stringify(configFile, null, 2);
export const inputJsons = [
  { label: 'deploy', path: deployCoverage },
  { label: 'test', path: testCoverage },
] as const;
