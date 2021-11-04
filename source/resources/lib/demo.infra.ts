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
 * This is demo infrastructure construct
 * @author @aws-solutions
 */

import { Stack, CfnResource, Construct, RemovalPolicy } from "@aws-cdk/core";
import {
  Vpc,
  SecurityGroup,
  Peer,
  Port,
  SubnetType,
  FlowLog,
  FlowLogDestination,
  FlowLogResourceType,
  FlowLogTrafficType,
} from "@aws-cdk/aws-ec2";
import {
  Effect,
  Policy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "@aws-cdk/aws-iam";
import { LogGroup, RetentionDays } from "@aws-cdk/aws-logs";

/**
 * @description interface for demo construct
 */
interface IDemoConstruct {
  region: string;
  demoInstancePolicy: Policy;
  demoVPC: Vpc;
  demoSecurityGroup: SecurityGroup;
}

/**
 * @class
 * @description demo infrastructure construct
 */
export class DemoConstruct extends Construct implements IDemoConstruct {
  /**
   * @description construct properties
   */
  readonly region: string;
  readonly demoVPC: Vpc;
  readonly demoSecurityGroup: SecurityGroup;
  readonly demoInstancePolicy: Policy;

  constructor(scope: Stack, id: string) {
    super(scope, id);
    const stack = Stack.of(this);
    this.region = stack.region; // Returns the AWS::Region for this stack (or the literal value if known)

    //=============================================================================================
    // Resources
    //=============================================================================================
    /**
     * @description demo vpc with 1 public subnet
     * @type {Vpc}
     */
    this.demoVPC = new Vpc(this, "DemoVPC", {
      cidr: "10.0.1.0/26", //NOSONAR reviewed
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
    this.demoVPC.publicSubnets.forEach((subnet) => {
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
     * @description log group for VPC flow logs
     * @type {LogGroup}
     */
    const flowLg: LogGroup = new LogGroup(this, "VPCFlowLogGroup", {
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_WEEK,
    });

    /**
     * @description iam role for flow logs
     * @type {Role}
     */
    const flowRole: Role = new Role(this, "flowRole", {
      assumedBy: new ServicePrincipal("vpc-flow-logs.amazonaws.com"),
    });

    /**
     * @description demo flow logs
     * @type {FlowLog}
     */
    new FlowLog(this, "DemoFlowLog", {
      resourceType: FlowLogResourceType.fromVpc(this.demoVPC),
      trafficType: FlowLogTrafficType.ALL,
      destination: FlowLogDestination.toCloudWatchLogs(flowLg, flowRole),
    });

    /**
     * @description security group for web server
     * @type {SecurityGroup}
     */
    this.demoSecurityGroup = new SecurityGroup(this, "DemoSG", {
      vpc: this.demoVPC,
      allowAllOutbound: false,
    });
    this.demoSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
      "allow HTTP traffic"
    );
    (
      this.demoSecurityGroup.node.defaultChild as CfnResource
    ).cfnOptions.metadata = {
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
    this.demoSecurityGroup.addEgressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
      "allow outbound http"
    );
    this.demoSecurityGroup.addEgressRule(
      Peer.anyIpv4(),
      Port.tcp(443),
      "allow outbound https"
    );

    this.demoInstancePolicy = new Policy(this, "DemoInstancePolicy");
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
    this.demoInstancePolicy.addStatements(po1);

    //=============================================================================================
    // cfn_nag suppress rules
    //=============================================================================================
    (
      this.demoInstancePolicy.node.findChild("Resource") as CfnResource
    ).cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [
          {
            id: "W12",
            reason: "* is required for creating log groups and put metrics",
          },
        ],
      },
    };
    (flowLg.node.findChild("Resource") as CfnResource).cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [
          {
            id: "W84",
            reason: " log group is encrypted with the default master key",
          },
        ],
      },
    };
  }
}
