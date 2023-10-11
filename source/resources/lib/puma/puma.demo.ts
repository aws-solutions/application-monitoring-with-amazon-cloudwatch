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
  CfnOutput,
  NestedStack,
  NestedStackProps,
  Stack,
  Duration,
} from "aws-cdk-lib";
import {
  AmazonLinuxCpuType,
  AmazonLinuxVirt,
  Instance,
  InstanceType,
  MachineImage,
  CfnInstance,
} from "aws-cdk-lib/aws-ec2";
import { DemoConstruct } from "../demo.infra";
import { manifest } from "../exports";

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
    // Resources
    //=============================================================================================
    /**
     * @description creating demo infrastructure
     * @type {DemoConstruct}
     */
    const demoInfra: DemoConstruct = new DemoConstruct(this, "PumaDemoInfra");

    /**
     * @description web server instance
     * @type {Instance}
     */
    const demoEC2: Instance = new Instance(this, "PumaDemoEC2", {
      vpc: demoInfra.demoVPC,
      instanceType: new InstanceType("t3.micro"),
      machineImage: MachineImage.latestAmazonLinux2({
        virtualization: AmazonLinuxVirt.HVM,
        cpuType: AmazonLinuxCpuType.X86_64,
      }),
      securityGroup: demoInfra.demoSecurityGroup,
      requireImdsv2: true,
    });

    const demoInstanceLogicalId = demoEC2.stack.getLogicalId(
      demoEC2.node.defaultChild as CfnInstance
    );

    demoEC2.addUserData(
      "set -x",
      'echo "======setting up cloudwatch agent and puma server======"',
      "wget https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/puma.config/amazon-cloudwatch-agent.rpm",
      "wget https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/linux_cw_infra.json -P /opt/aws/amazon-cloudwatch-agent/bin/",
      "wget https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/puma_config.json -P /opt/aws/amazon-cloudwatch-agent/bin/",
      "yum install -y amazon-cloudwatch-agent.rpm",
      "systemctl restart amazon-cloudwatch-agent",
      "wget https://kojipkgs.fedoraproject.org//packages/sqlite/3.8.11/1.fc21/x86_64/sqlite-devel-3.8.11-1.fc21.x86_64.rpm",
      "wget https://kojipkgs.fedoraproject.org//packages/sqlite/3.8.11/1.fc21/x86_64/sqlite-3.8.11-1.fc21.x86_64.rpm",
      "yum install -y sqlite-3.8.11-1.fc21.x86_64.rpm sqlite-devel-3.8.11-1.fc21.x86_64.rpm git",
      "amazon-linux-extras install epel -y",
      "yum install -y supervisor ",
      "yum install -y gcc-c++ libyaml-devel zlib-devel libfff-devel openssl-devel readline-devel",
      "amazon-linux-extras install -y ruby3.0 epel",
      "yum install -y ruby-devel",
      "gem install bundler rails",
      "export PATH=/usr/local/bin/:$PATH",
      "rails new ~/sample-app",
      "cd ~/sample-app",
      "rake db:create assets:precompile",
      "rm -f /etc/supervisord.conf",
      "wget https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/puma.config/supervisord.conf -P /etc/",
      "systemctl restart supervisord",
      "systemctl enable supervisord",
      "rm -f /root/sample-app/config/puma.rb",
      "wget https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/puma.config/puma.rb -P /root/sample-app/config",
      "bundle add puma-plugin-statsd statsd-instrument",
      "bundle install",
      "rm -f /root/sample-app/app/controllers/application_controller.rb",
      "wget https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/puma.config/application_controller.rb -P /root/sample-app/app/controllers",
      "rm -f /root/sample-app/config/routes.rb",
      "wget https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/puma.config/routes.rb -P /root/sample-app/config",
      "rm -f /root/sample-app/config/environments/production.rb",
      "wget https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/puma.config/production.rb -P /root/sample-app/config/environments",
      "mkdir /root/sample-app/app/views/page",
      "wget https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/puma.config/index.html.erb -P /root/sample-app/app/views/page",
      "wget https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/puma.config/statsd_instrument.rb -P /root/sample-app/config/initializers",
      "wget https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/puma.config/page_controller.rb -P /root/sample-app/app/controllers",
      "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/bin/infra_config.json",
      "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a append-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/bin/puma_config.json",
      "export DAEMONIZE_PUMA=true",
      "RAILS_ENV='production' RAILS_PORT='80' bundle exec puma -C config/puma.rb &",
      "/opt/aws/bin/cfn-signal -e $? --stack " +
        demoEC2.stack.stackId +
        " --resource " +
        demoInstanceLogicalId +
        " --region " +
        demoEC2.stack.region
    );

    demoEC2.role.attachInlinePolicy(demoInfra.demoInstancePolicy);

    (demoEC2.node.defaultChild as CfnInstance).cfnOptions.creationPolicy = {
      resourceSignal: {
        count: 1,
        timeout: Duration.minutes(20).toIsoString(),
      },
    };

    //=============================================================================================
    // Output
    //=============================================================================================
    new CfnOutput(this, "Web URL", {
      description: "URL for puma demo server",
      value: `http://${demoEC2.instancePublicIp}`,
    });
  }
}
