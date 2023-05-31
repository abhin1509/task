#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BitespeedTaskStack } from '../lib/bitespeed-task-stack';

const app = new cdk.App();
new BitespeedTaskStack(app, 'BitespeedTaskStack');
