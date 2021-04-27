/**
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
  Stack,
  CfnResource,
  NestedStack,
  NestedStackProps,
  CfnMapping,
  CfnOutput,
} from "@aws-cdk/core";
import {
  Vpc,
  Instance,
  InstanceType,
  InitFile,
  InitService,
  InitServiceRestartHandle,
  CloudFormationInit,
  MachineImage,
  AmazonLinuxVirt,
  AmazonLinuxGeneration,
  AmazonLinuxCpuType,
  SecurityGroup,
  Peer,
  Port,
  InitPackage,
  SubnetType,
  InitCommand,
} from "@aws-cdk/aws-ec2";
import { ILogGroup, LogGroup } from "@aws-cdk/aws-logs";
import { Effect, Policy, PolicyStatement } from "@aws-cdk/aws-iam";
import { manifest } from "../exports";
import { apache_manifest } from "./apache_exports";

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
    this.templateOptions.description = `(${manifest.solutionId}ApD) - The AWS CloudFormation template for deployment of the ${manifest.solutionName} Apache workload demo resource. Version ${manifest.solutionVersion}`;
    this.templateOptions.templateFormatVersion = manifest.templateVersion;

    //=============================================================================================
    // Map
    //=============================================================================================
    const map = new CfnMapping(this, "StackMap", {
      mapping: {
        Apache: {
          AccessLog: apache_manifest.logGroups.accesslog, // access log for apache instances, change as needed
          InfraConfig:
            "https://%%TEMPLATE_BUCKET%%.s3.amazonaws.com/%%SOLUTION_NAME%%/%%VERSION%%/apache.config/infra.json", // base infra config file
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
     * @description demo vpc with 1 public subnet
     * @type {Vpc}
     */
    const demoVPC: Vpc = new Vpc(this, "DemoVPC", {
      cidr: "10.0.1.0/26",
      natGateways: 0,
      vpnGateway: false,
      subnetConfiguration: [
        {
          cidrMask: 28,
          name: "PublicSubnet",
          subnetType: SubnetType.PUBLIC,
        },
      ],
    });
    demoVPC.publicSubnets.forEach((subnet) => {
      const hs = subnet.node.defaultChild as CfnResource;
      hs.cfnOptions.metadata = {
        cfn_nag: {
          rules_to_suppress: [
            {
              id: "W33",
              reason: "Need public IP for demo web server ",
            },
          ],
        },
      };
    });

    /**
     * @description security group for web server
     * @type {SecurityGroup}
     */
    const demoSg: SecurityGroup = new SecurityGroup(this, "DemoSG", {
      vpc: demoVPC,
      allowAllOutbound: false,
    });
    demoSg.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "allow HTTP traffic");
    (demoSg.node.defaultChild as CfnResource).cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [
          {
            id: "W40",
            reason: "Demo resource",
          },
          {
            id: "W5",
            reason: "Demo resource",
          },
          {
            id: "W9",
            reason: "Demo resource",
          },
          {
            id: "W2",
            reason: "Demo resource",
          },
        ],
      },
    };
    demoSg.addEgressRule(Peer.anyIpv4(), Port.tcp(80), "allow outbound http");
    demoSg.addEgressRule(Peer.anyIpv4(), Port.tcp(443), "allow outbound https");

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
      vpc: demoVPC,
      instanceType: new InstanceType("t3.micro"),
      machineImage: MachineImage.latestAmazonLinux({
        virtualization: AmazonLinuxVirt.HVM,
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
        cpuType: AmazonLinuxCpuType.X86_64,
      }),
      init: init,
      securityGroup: demoSg,
    });

    demoEC2.addUserData(
      'echo "======setting up cloudwatch agent======"',
      "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/bin/infra_config.json",
      "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a append-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/bin/apache_config.json",
      "curl 127.0.0.1"
    );

    const po = new Policy(this, "DemoInstancePolicy");
    const po1 = new PolicyStatement({
      effect: Effect.ALLOW,
      sid: "CWWrite",
      actions: [
        "cloudwatch:PutMetricData",
        "ec2:DescribeVolumes",
        "ec2:DescribeTags",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams",
        "logs:DescribeLogGroups",
        "logs:CreateLogStream",
        "logs:CreateLogGroup",
      ],
      resources: ["*"],
    });
    po.addStatements(po1);
    demoEC2.role.attachInlinePolicy(po);

    //=============================================================================================
    // cfn_nag suppress rules
    //=============================================================================================
    const _dVpc = demoVPC.node.findChild("Resource") as CfnResource;
    _dVpc.cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [
          {
            id: "W60",
            reason: "demo resource, no flow log enabled",
          },
        ],
      },
    };

    const _po = po.node.findChild("Resource") as CfnResource;
    _po.cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [
          {
            id: "W12",
            reason: "* is required for creating log groups and put metrics",
          },
        ],
      },
    };

    //=============================================================================================
    // Output
    //=============================================================================================
    new CfnOutput(this, "Web URL", {
      description: "URL for apache demo server",
      value: `http://${demoEC2.instancePublicIp}`,
    });
  }
}
