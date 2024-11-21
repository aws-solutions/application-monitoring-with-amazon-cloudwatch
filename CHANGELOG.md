# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.6] - 2024-11-21

### Changed

- Library updates to address [Regular Expression Denial of Service (ReDoS) in cross-spawn](https://avd.aquasec.com/nvd/cve-2024-21538)
- Library updates to address [micromatch: vulnerable to Regular Expression Denial of Service](https://avd.aquasec.com/nvd/cve-2024-4067)

## [1.2.5] - 2024-06-20

### Changed

- Library updates to address [braces: fails to limit the number of characters it can handle](https://avd.aquasec.com/nvd/2024/cve-2024-4068/)

## [1.2.4] - 2023-10-23

### Changed

- Library updates to address [Babel vulnerable to arbitrary code execution when compiling specifically crafted malicious code](https://nvd.nist.gov/vuln/detail/CVE-2023-45133)

## [1.2.3] - 2023-10-12

### Changed

- Update lambda runtime to NodeJS 18
- Update dependencies

## [1.2.2] - 2023-06-22

### Changed

- Library updates to address [xml2js is vulnerable to prototype pollution](https://cwe.mitre.org/data/definitions/1321.html)
- Library updates to address [http-cache-semantics vulnerable to Regular Expression Denial of Service](https://cwe.mitre.org/data/definitions/1333.html)

## [1.2.1] - 2023-01-13

### Changed

- Updated json5 version to 2.2.3 to address the [prototype pollution vulnerability](https://nvd.nist.gov/vuln/detail/CVE-2022-46175)

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
