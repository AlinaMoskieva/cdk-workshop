#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../lib/pipeline-stack.js';

if (!process.env['DIL_CDK_SCOPE']) {
    throw new Error('DIL_CDK_SCOPE environment variable is not set');
}

const app = new cdk.App();

new PipelineStack(app, 'Pipeline', {
    stackName: `${process.env['DIL_CDK_SCOPE']}-cdk-workshop-pipeline`,
    scope: process.env['DIL_CDK_SCOPE'],
    stagingAccount: '276097718844',
    stagingRegion: 'us-west-2',
    productionAccount: '276097718844',
    productionRegion: 'us-west-2',
    env: {
        account: process.env["CDK_DEFAULT_ACCOUNT"]!,
        region: process.env["CDK_DEFAULT_REGION"]!,
    },
});