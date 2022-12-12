/**
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */

/**
 * @description
 * This is demo stack for Apache web server
 * @author @aws-solutions
 */

import {
  CfnMapping,
  CfnOutput,
  NestedStack,
  NestedStackProps,
  Stack,
} from "aws-cdk-lib";
import {
  AmazonLinuxCpuType,
  AmazonLinuxGeneration,
  AmazonLinuxVirt,
  CloudFormationInit,
  InitCommand,
  InitFile,
  InitPackage,
  InitService,
  InitServiceRestartHandle,
  Instance,
  InstanceType,
  MachineImage,
} from "aws-cdk-lib/aws-ec2";
import { DemoConstruct } from "../demo.infra";
import { manifest, Workload } from "../exports";

/**
 * @class
 * @description web server resources construct
 */
export class ApacheDemo extends NestedStack {
  readonly region: string;
  constructor(scope: Stack, id: string, props?: NestedStackProps) {
    super(scope, id, props);
    const stack = Stack.of(this);
    this.region = stack.region; // Returns the AWS::Region for this stack (or the literal value if known)

    //=============================================================================================
    // Metadata
    //=============================================================================================
    this.templateOptions.description = `(${manifest.solutionId}-Demo) - The AWS CloudFormation template for deployment of the ${manifest.solutionName} Apache workload demo resource. Version ${manifest.solutionVersion}`;
    this.templateOptions.templateFormatVersion = manifest.templateVersion;

    //=============================================================================================
    // Map
    //=============================================================================================
    const map = new CfnMapping(this, "StackMap", {
      mapping: {
        Apache: {
          AccessLog: Workload.Apache.AccessLog, // access log for apache instances, change as needed
          InfraConfig:
            "https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/linux_cw_infra.json", // base infra config file
          ApacheConfig:
            "https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/apache.config/apache.json", // apache config file
          httpdConfig:
            "https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/apache.config/httpd.conf", // httpd config file
          CloudWatchAgent:
            "https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/amazon-cloudwatch-agent.rpm",
        },
      },
    });

    //=============================================================================================
    // Resources
    //=============================================================================================
    /**
     * @description creating demo infrastructure
     * @type {DemoConstruct}
     */
    const demoInfra: DemoConstruct = new DemoConstruct(this, "ApacheDemoInfra");

    const handle: InitServiceRestartHandle = new InitServiceRestartHandle();

    /**
     * @description cloudformation init configuration for web server
     * @type {CloudFormationInit}
     */
    const init: CloudFormationInit = CloudFormationInit.fromElements(
      InitPackage.rpm(map.findInMap("Apache", "CloudWatchAgent"), {
        serviceRestartHandles: [handle],
      }),
      InitPackage.yum("httpd", { serviceRestartHandles: [handle] }),
      InitFile.fromUrl(
        "/opt/aws/amazon-cloudwatch-agent/bin/infra_config.json",
        map.findInMap("Apache", "InfraConfig")
      ),
      InitFile.fromUrl(
        "/opt/aws/amazon-cloudwatch-agent/bin/apache_config.json",
        map.findInMap("Apache", "ApacheConfig")
      ),
      InitFile.fromUrl(
        "/etc/httpd/conf/httpd.conf",
        map.findInMap("Apache", "httpdConfig")
      ),
      InitFile.fromString("/var/www/html/index.html", `Hello World!`, {
        mode: "000644",
        owner: "apache",
        group: "apache",
      }),
      InitCommand.shellCommand("mkdir /var/log/www/"),
      InitCommand.shellCommand("mkdir /var/log/www/error"),
      InitCommand.shellCommand("mkdir /var/log/www/access"),
      InitService.enable("httpd", {
        enabled: true,
        ensureRunning: true,
        serviceRestartHandle: handle,
      })
    );

    /**
     * @description web server instance
     * @type {Instance}
     */
    const demoEC2: Instance = new Instance(this, "ApacheDemoEC2", {
      vpc: demoInfra.demoVPC,
      instanceType: new InstanceType("t3.micro"),
      machineImage: MachineImage.latestAmazonLinux({
        virtualization: AmazonLinuxVirt.HVM,
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
        cpuType: AmazonLinuxCpuType.X86_64,
      }),
      init: init,
      securityGroup: demoInfra.demoSecurityGroup,
    });

    demoEC2.addUserData(
      'echo "======setting up cloudwatch agent======"',
      "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/bin/infra_config.json",
      "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a append-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/bin/apache_config.json",
      "curl 127.0.0.1"
    );

    demoEC2.role.attachInlinePolicy(demoInfra.demoInstancePolicy);

    //=============================================================================================
    // Output
    //=============================================================================================
    new CfnOutput(this, "Web URL", {
      description: "URL for apache demo server",
      value: `http://${demoEC2.instancePublicIp}`,
    });
  }
}
