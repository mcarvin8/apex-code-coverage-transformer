import { resolve } from 'node:path';

export const baselineClassPath = resolve('samples/classes/AccountProfile.cls');
export const baselineTriggerPath = resolve('samples/triggers/AccountTrigger.trigger');
export const deployCoverage = resolve('test/deploy_coverage.json');
export const testCoverage = resolve('test/test_coverage.json');
export const invalidJson = resolve('test/invalid.json');
export const sonarBaselinePath = resolve('test/sonar_baseline.xml');
export const jacocoBaselinePath = resolve('test/jacoco_baseline.xml');
export const lcovBaselinePath = resolve('test/lcov_baseline.info');
export const coberturaBaselinePath = resolve('test/cobertura_baseline.xml');
export const cloverBaselinePath = resolve('test/clover_baseline.xml');
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
