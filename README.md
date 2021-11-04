# Amazon CloudWatch Monitoring Framework

**[🚀Solution Landing Page](https://aws.amazon.com/solutions/implementations/amazon-cloudwatch-monitoring-framework)** | **[🚧Feature request](https://github.com/aws-solutions/amazon-cloudwatch-monitoring-framework/issues/new?assignees=&labels=feature-request%2C+enhancement&template=feature_request.md&title=)** | **[🐛Bug Report](https://github.com/aws-solutions/amazon-cloudwatch-monitoring-framework/issues/new?assignees=&labels=bug%2C+triage&template=bug_report.md&title=)** | **[📜Documentation Improvement](https://github.com/aws-solutions/amazon-cloudwatch-monitoring-framework/issues/new?assignees=&labels=document-update&template=documentation_improvements.md&title=)**

_Note: For any relevant information outside the scope of this readme, please refer to the solution landing page and implementation guide._

## Table of content

- [Solution Overview](#solution-overview)
- [Architecture](#architecture)
- [Installation](#installing-pre-packaged-solution-template)
  - [Parameters](#parameters-for-framework-template)
- [Customization](#customization)
  - [Setup](#setup)
  - [Changes](#changes)
  - [Unit Test](#unit-test)
  - [Build](#build)
  - [Deploy](#deploy)
  - [Example Scenario: Custom Metrics](#custom-metrics)
- [Supported CloudWatch Widgets](#supported-cloudwatch-widgets)
- [Configuring Instances](#configuring-ec2-instances)
- [Adding Workloads](#adding-workloads)
- [File Structure](#file-structure)
- [License](#license)
- [Operational Metrics](#collection-of-operational-metrics)

## Solution Overview

Amazon CloudWatch Monitoring Framework is intended for customers looking to easily gain actionable insight into their EC2 workloads. The process to configure cloudwatch agent, identify the right metrics, logs and create dashboard to see workload performance can be tedious and time-consuming.

The solution automates the process of dashboard setup and provides reference config files for some of the most common workloads. Using a tagging mechanism you can identify the instances you want to be monitored on the dashboard. The solution makes it easy for the customers to focus on workload KPIs rather than spending time on setting up the needed dashboards.

## Architecture

The solution follows nested stack approach for deployment of workload stacks. The workload stacks can be deployed individually as well.

<img src="./deployment.png" width="600" height="350">

The architecture can be broken into two components. **User Interaction** and **Dashboard Management**. The workflow is as follows:

- User puts tag on the EC2 instance
- _tagHandler_ lambda function fetches instances with the tag and updates SSM Parameter Store
- CloudWatch Events rule gets triggered when SSM parameter is updated, and invokes _dashboardHandler_ lambda function
- _dashboardHandler_ lambda function reads the SSM parameter and updates the CloudWatch dashboard widgets

<img src="./architecture.png" width="700" height="350">

## Installing pre-packaged solution template

- If you want to deploy the framework and related resources: [cloudwatch-monitoring-framework.template](https://solutions-reference.s3.amazonaws.com/amazon-cloudwatch-monitoring-framework/latest/amazon-cloudwatch-monitoring-framework.template)
- If you want to deploy the template for specific workload: [workload.template](https://solutions-reference.s3.amazonaws.com/amazon-cloudwatch-monitoring-framework/latest/workload.template)
- If you want to deploy the Apache demo instance: [apache-demo.template](https://solutions-reference.s3.amazonaws.com/amazon-cloudwatch-monitoring-framework/latest/apache-demo.template)
- If you want to deploy the Puma demo instance: [puma-demo.template](https://solutions-reference.s3.amazonaws.com/amazon-cloudwatch-monitoring-framework/latest/puma-demo.template)
- If you want to deploy the Nginx demo instance: [nginx-demo.template](https://solutions-reference.s3.amazonaws.com/amazon-cloudwatch-monitoring-framework/latest/nginx-demo.template)

#### Parameters for framework template

Parameters control individual workload related resource provisioning

- **_Workload_ Tag Schema:** Tag schema to identify workload instances
- **_Workload_ Demo Instance:** Do you want to deploy workload-demo instance?

#### Parameters for workload template

- **Workload Name:** Name of the workload. Currently supported are _Apache_, _Nginx_ and _Puma_.
- **Tag Schema:** EC2 tag schema to identify workload instances.
- **CW Dashboard Name:** Name for the CloudWatch dashboard created by the solution.
- **Access Log Group:** CloudWatch Log Group where instances push their access logs
- **SSM Parameter Name:** SSM parameter used for maintaining workload instance list

## Customization

- Prerequisite: Node.js>=14 | npm >= 7

### Setup

Clone the repository and run the following commands to install dependencies, format and lint as per the project standards

```
npm ci
npm run prettier-format
npm run lint
```

### Changes

You may make any needed change as per your requirement. If you want to change the workload dashboard configurations, modify the relevant manifest file. For eg. for Apache you would change [apache exports](./source/services/dashboardHandler/lib/widgets/apache_exports.ts). Also see [Example Scenario: Custom Metrics](#custom-metrics).

Additionally, you can customize the code and add any extensibility to the solution. Please review our [feature request guidelines](./.github/ISSUE_TEMPLATE/feature_request.md), if you want to submit a PR.

### Unit Test

You can run unit tests with the following command from the root of the project

```
npm run test
```

### Build

You can build lambda binaries with the following command from the root of the project

```
npm run build
```

### Deploy

The solution has following CDK Stacks

- Framework Stack: this stack controls provisioning of individual workload related resources
- Workload Stack: this stack deploys resources to monitor the workload and put logs & metrics on the dashboard
- Demo Stack: this stack creates a single instance to showcase solution capabilities in monitoring the workload

Run the following command from the root of the project

```
cd source/resources
npm ci
npm run cdk-bootstrap -- --profile <PROFILE_NAME>
npm run cdk-synth
npm run cdk-deploy -- CW-Monitoring-Framework-Stack --parameters ApacheDemoInstance=No --parameters NginxDemoInstance=No --parameters PumaDemoInstance=No --profile <PROFILE_NAME>
```

To destroy deployed stack

```
npm run cdk-destroy CW-Monitoring-Framework-Stack --profile <PROFILE_NAME>
```

_Note: Above steps will NOT deploy demo templates. To deploy demo templates, use [pre-packaged demo templates](#installing-pre-packaged-solution-template). For PROFILE_NAME, substitute the name of an AWS CLI profile that contains appropriate credentials for deploying in your preferred region._

## Custom Metrics

Please follow this section to customize default set of metrics monitored by the solution for the workload. Let's say we want to add **cpu_usage details** for **amazon-cloudwatch-agent** on the apache dashboard. (_We assume that CloudWatch agent on your EC2 instance is sending these metrics to CloudWatch._) In this case you would need to update the [apache_exports.ts](./source/services/dashboardHandler/lib/widgets/apache_exports.ts).

Since this would be a multi-dimensional metric, we need to update the _metricWidget_ in apache_exports.ts as follows:

```
[
  [
    "CWAgent",
    "procstat_cpu_usage",
    "exe",
    "httpd",
    "InstanceId",
    "%%instance%%",
    "process_name",
    "httpd",
  ],
  [
    "CWAgent",
    "procstat_cpu_usage",
    "exe",
    "amazon-cloudwatch-agent",
    "InstanceId",
    "%%instance%%",
    "process_name",
    "amazon-cloudwatch-agent",
  ]
]
```

To read more about supported widgets and metrics types, refer to [Supported CloudWatch Widgets](#supported-cloudwatch-widgets)

Now, we need to rebuild the microservice _dashboardHandler_:

```
cd source/services/dashboardHandler
npm run build:all
```

Follow the steps from [Build](#build) and [Deploy](#deploy) to deploy the updated apache dashboard.

## Supported CloudWatch Widgets

The framework currently supports following widget types

- Log widgets: to capture cloudwatch log insights queries
- Metric explorer widget: to capture metrics with single dimension
- Metric widget: to capture metrics with more than one dimension

_reference: [generics.ts](./source/services/dashboardHandler/lib/generics.ts)_

## Configuring EC2 Instances

The solution does not configure your EC2 instances. You need to ensure that your instances our configured correctly and sending CloudWatch metrics and logs in the needed format. For eg. if you have apache workload instances, you should refer to following cloudwatch agent configuration files, the same files are used to bootstrap our demo instance.

- [base configuration file](./source/resources/lib/linux_cw_infra.json) - base infrastructure cloudwatch agent configuration
- [apache configuration file](./source/resources/lib/apache/apache.config/apache.json) - apache related cloudwatch agent configuration
- [httpd.conf](./source/resources/lib/apache/apache.config/httpd.conf) - apache web server config for error and access log format

_Note: If the instances do not send needed metrics and logs to CloudWatch in needed format, the dashboard will not show data points from those instances._

## Adding Workloads

Currently, the framework supports **apache**, **nginx** and **ruby/puma** workload. We will continue to add more workloads. Each workload deploys as a nested stack on the framework and has its own infrastructure resources. This removes any infrastructure dependency between workloads, and also allows to easily turn on/off individual workloads.

To extend the framework follow given steps:

### Infrastructure

Add infrastructure resources to support the workload.

#### /source/resources/lib

- [exports.ts](./source/resources/lib/exports.ts) Extend _Workload_ export for the new workload.
- [framework.infra.ts](./source/resources/lib/framework.infra.ts) Update the framework stack, **parameters** **conditions** and **resources** sections to deploy nested stack for the new workload and the demo instance

#### /source/resources/lib/_workload_

- /source/resources/lib/_workload_: Create the folder for the new workload
- _workload_.config: Add reference configuration files for the cloudwatch agent and workload instance. The configuration files will determine the metrics and logs being pushed to Amazon CloudWatch. _reference: [apache.config](./source/resources/lib/apache/apache.config)_ The **metrics**, **log** and **log format** identified in the config files must be consistent with dashboard widget manifest file _reference: [apache_exports.ts](./source/services/dashboardHandler/lib/widgets/apache_exports.ts)_.
- _workload_.demo.ts: Add demo instance to create sample web server, bootstrapped with reference configurations files. _reference: [apache.demo.ts](./source/resources/lib/apache/apache.demo.ts)_

### Services

We need to extend _dashboardHandler_ lambda function for new workloads

#### /source/services/dashboardHandler

- /source/services/dashboardHandler/lib/widgets/_workload_\_exports.ts: Create the manifest file for Log Widget, Metric Explorer Widget and Metric Widget configuration. You can specify the metrics, logs and widgets that you would like to show up on the dashboard for the workload. Please also see [Supported CloudWatch Widgets](#supported-cloudwatch-widgets) section. _reference: [apache_exports.ts](./source/services/dashboardHandler/lib/widgets/apache_exports.ts)_
- [widget_exports.ts](./source/services/dashboardHandler/lib/widgets/widgets_exports.ts) - Extend the _WorkloadWidgets_ export for the new workload

_Note: Workload name in [resource export file](./source/resources/lib/export.ts) and [widget export file](./source/services/dashboardHandler/lib/widgets/widget_export.ts) must be consistent (case-sensitive) with each other_

## File structure

Amazon CloudWatch Monitoring Framework solution consists of:

- cdk constructs to generate needed infrastructure resources
- tagHandler to validate tag, identify EC2 resources with the tag and update SSM parameter with instance-ids
- dashboardHandler to update dashboard for the workload with metrics and logs
- helper functions for solution purposes
- utils library for generic utility functions like logging and metrics

<pre>
|-deployment/
  |build-scripts/                      [ build scripts ]
|-source/
  |-resources  
    |-bin/
      |-cw-monitoring-framework.ts     [ entry point for CDK app ]
    |-__tests__/                       [ unit tests for CDK constructs ] 
    |-lib/
      |-workload                       [ workload artifacts ]
        |-workload.config/             [ workload configs ]
        |-workload.demo.ts             [ workload demo EC2 instance CDK construct ]
      |-demo.infra.ts                  [ CDK construct for generic demo resources ]
      |-framework.infra.ts             [ CDK stack framework resources ]  
      |-workload.infra.ts              [ generic CDK stack for workload resources ] 
      |-exports                        [ manifest file for framework and workload stacks ]
    |-config_files                     [ tsconfig, jest.config.js, package.json etc. ]
  |-services/
    |-helper/                          [ lambda helper custom resource to help with solution launch/update/delete ]
    |-utils/                           [ library with generic utility functions ]
    |-dashboardHandler/                [ microservice to handle dashboard update ]
      |-__tests/                       [ unit tests for dashboard handler ]   
      |-lib/
        |-widgets                      [ CloudWatch dashboard widget configuration files for workloads ]
        |-CWHelperAbstract.ts          [ abstract class for workloads ]
        |-CWWidgetFactory.ts           [ generic class to generate widgets using widget-configuration file ]
        |-SSMHelper.ts                 [ class for SSM parameter store operations ]
        |-generics.ts                  [ generic interfaces for the application ]
      |-index.ts                       [ entry point for lambda function]     
      |-config_files                   [ tsconfig, jest.config.js, package.json etc. ]
    |-tagHandler
      |-__tests/                       [ unit tests for tag handler ] 
      |-lib/ 
        |-EC2Helper.ts                 [ class for EC2 tag operations ]
        |-SSMHelper.ts                 [ class for SSM parameter store operations ]
      |-index.ts                       [ entry point for lambda function]     
      |-config_files                   [ tsconfig, jest.config.js, package.json etc. ]   
  |-config_files                       [ eslint, prettier, tsconfig, jest.config.js, package.json etc. ]  
</pre>

## License

See license [here](./LICENSE.txt)

## Collection of operational metrics

This solution collects anonymous operational metrics to help AWS improve the quality and features of the solution. For more information, including how to disable this capability, please see the [implementation guide](https://docs.aws.amazon.com/solutions/latest/amazon-cloudwatch-monitoring-framework).

---

Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

```
http://www.apache.org/licenses/LICENSE-2.0
```

or in the ["license"](./LICENSE.txt) file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and limitations under the License.
