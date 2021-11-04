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
 * This is demo stack for Puma web server
 * @author @aws-solutions
 */

import {
  Stack,
  NestedStack,
  NestedStackProps,
  CfnMapping,
  CfnOutput,
} from "@aws-cdk/core";
import {
  Instance,
  InstanceType,
  InitFile,
  InitServiceRestartHandle,
  CloudFormationInit,
  MachineImage,
  AmazonLinuxVirt,
  AmazonLinuxGeneration,
  AmazonLinuxCpuType,
  InitPackage,
  InitCommand,
} from "@aws-cdk/aws-ec2";
import { DemoConstruct } from "../demo.infra";
import { manifest, Workload } from "../exports";

/**
 * @class
 * @description web server resources construct
 */
export class PumaDemo extends NestedStack {
  readonly region: string;
  constructor(scope: Stack, id: string, props?: NestedStackProps) {
    super(scope, id, props);
    const stack = Stack.of(this);
    this.region = stack.region; // Returns the AWS::Region for this stack (or the literal value if known)

    //=============================================================================================
    // Metadata
    //=============================================================================================
    this.templateOptions.description = `(${manifest.solutionId}-Demo) - The AWS CloudFormation template for deployment of the ${manifest.solutionName} Puma workload demo resource. Version ${manifest.solutionVersion}`;
    this.templateOptions.templateFormatVersion = manifest.templateVersion;

    //=============================================================================================
    // Map
    //=============================================================================================
    const map = new CfnMapping(this, "StackMap", {
      mapping: {
        Puma: {
          AccessLog: Workload.Puma.AccessLog, // access log for puma instances, change as needed
          InfraConfig:
            "https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/linux_cw_infra.json", // base infra config file
          PumaCWConfig:
            "https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/puma.config/puma.json", // puma cloudwatch config file
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
    const demoInfra: DemoConstruct = new DemoConstruct(this, "PumaDemoInfra");

    const handle: InitServiceRestartHandle = new InitServiceRestartHandle();

    /**
     * @description cloudformation init configuration for web server
     * @type {CloudFormationInit}
     */
    const init: CloudFormationInit = CloudFormationInit.fromElements(
      InitPackage.rpm(map.findInMap("Puma", "CloudWatchAgent"), {
        serviceRestartHandles: [handle],
      }),
      InitPackage.yum("gcc-c++", { serviceRestartHandles: [handle] }),
      InitFile.fromUrl(
        "/opt/aws/amazon-cloudwatch-agent/bin/infra_config.json",
        map.findInMap("Puma", "InfraConfig")
      ),
      InitFile.fromUrl(
        "/opt/aws/amazon-cloudwatch-agent/bin/puma_config.json",
        map.findInMap("Puma", "PumaCWConfig")
      ),
      InitCommand.shellCommand("amazon-linux-extras install -y ruby3.0 epel"),
      InitCommand.shellCommand(
        "curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -"
      ),
      InitCommand.shellCommand(
        "curl -sL https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo"
      )
    );

    /**
     * @description web server instance
     * @type {Instance}
     */
    const demoEC2: Instance = new Instance(this, "PumaDemoEC2", {
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
      'echo "======setting up cloudwatch agent and puma server======"',
      "wget https://kojipkgs.fedoraproject.org//packages/sqlite/3.8.11/1.fc21/x86_64/sqlite-devel-3.8.11-1.fc21.x86_64.rpm",
      "wget https://kojipkgs.fedoraproject.org//packages/sqlite/3.8.11/1.fc21/x86_64/sqlite-3.8.11-1.fc21.x86_64.rpm",
      "yum install -y nodejs yarn ruby-devel sqlite-3.8.11-1.fc21.x86_64.rpm sqlite-devel-3.8.11-1.fc21.x86_64.rpm supervisor",
      "gem install bundler rails",
      "rails new ~/sample-app",
      "cd ~/sample-app",
      "rake db:create assets:precompile",
      "rm /etc/supervisord.conf",
      "wget https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/puma.config/supervisord.conf -P /etc/",
      "systemctl restart supervisord",
      "systemctl enable supervisord",
      "rm /root/sample-app/config/puma.rb",
      "wget https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/puma.config/puma.rb -P /root/sample-app/config",
      "bundle add puma-plugin-statsd statsd-instrument",
      "bundle install",
      "rm /root/sample-app/app/controllers/application_controller.rb",
      "wget https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/puma.config/application_controller.rb -P /root/sample-app/app/controllers",
      "rm /root/sample-app/config/routes.rb",
      "wget https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/puma.config/routes.rb -P /root/sample-app/config",
      "rm /root/sample-app/config/environments/production.rb",
      "wget https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/puma.config/production.rb -P /root/sample-app/config/environments",
      "mkdir /root/sample-app/app/views/page",
      "wget https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/puma.config/index.html.erb -P /root/sample-app/app/views/page",
      "wget https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/puma.config/statsd_instrument.rb -P /root/sample-app/config/initializers",
      "wget https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/puma.config/page_controller.rb -P /root/sample-app/app/controllers",
      "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/bin/infra_config.json",
      "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a append-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/bin/puma_config.json",
      "export DAEMONIZE_PUMA=true",
      "RAILS_ENV='production' RAILS_PORT='80' bundle exec puma -C config/puma.rb"
    );

    demoEC2.role.attachInlinePolicy(demoInfra.demoInstancePolicy);

    //=============================================================================================
    // Output
    //=============================================================================================
    new CfnOutput(this, "Web URL", {
      description: "URL for puma demo server",
      value: `http://${demoEC2.instancePublicIp}`,
    });
  }
}
