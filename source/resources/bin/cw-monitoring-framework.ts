#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import { FrameworkInfra } from "../lib/framework.infra";
const app = new cdk.App();

// deploy framework infrastructure
new FrameworkInfra(app, "CW-Monitoring-Framework-Stack");
