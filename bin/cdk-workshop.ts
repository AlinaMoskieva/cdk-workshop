#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkWorkshopStack } from '../lib/cdk-workshop-stack.js';

if (!process.env['DIL_CDK_SCOPE']) {
    throw new Error('DIL_CDK_SCOPE environment variable is not set');
}

const app = new cdk.App();
new CdkWorkshopStack(app, 'CdkWorkshopStack', {
    stackName: `${process.env['DIL_CDK_SCOPE']}-cdk-workshop-stack`,
    scope: process.env['DIL_CDK_SCOPE'],
});