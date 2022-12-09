# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2022-12-08

### Changed

- appRegistry integration
- CDK v2 upgrade
- lambda run time upgrade to Node.js 16
- package version updates

## [1.1.1] - 2022-09-19

### Changed

- package version updates
- on Puma demo instance, install git for puma rails app generator

## [1.1.0] - 2021-11-04

### Added

- Support for Nginx workload on EC2 instances
- Support for Ruby/Puma workload on EC2 instances
- [workload.infra.ts](./source/resources/lib/workload.infra.ts) generic stack for workload-infrastructure provisioning
- [demo.infra.ts](./source/resources/lib/demo.infra.ts) generic construct for demo-infrastructure provisioning
- [CWWidgetFactory](./source/services/dashboardHandler/lib/CWWidgetFactory.ts) generic widget factory to generate workload related Amazon CloudWatch dashboard widgets

### Changed

- Moved generic helpers to utils library, [logger](./source/services/utils/logger), [error](./source/services/utils/error), [metrics](./source/services/utils/metrics)
- Moved CloudWatch dashboard widget configuration files to [widgets](./source/services/dashboardHandler/lib/widgets)

### Removed

- Apache workload specific stack (apache.infra.ts) for infrastructure provisioning

## [1.0.0] - 2021-04-27

### Added

- Initial version
- Support for Apache workload on EC2 instances
