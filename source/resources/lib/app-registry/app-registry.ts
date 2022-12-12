import { Aws, CfnMapping, Fn, Stack } from "aws-cdk-lib";
import * as appreg from "@aws-cdk/aws-servicecatalogappregistry-alpha";
import { Construct } from "constructs";
import { applyTag } from "./apply-tag";
import { CfnResourceAssociation } from "aws-cdk-lib/aws-servicecatalogappregistry";

export interface AppRegistryProps {
  solutionId: string;
  solutionName: string;
  solutionVersion: string;
  appRegistryApplicationName: string;
  applicationType: string;
  attributeGroupName: string;
}

export class AppRegistryForSolution extends Construct {
  readonly registryApplication: appreg.Application;
  private readonly appRegMap: CfnMapping;

  constructor(scope: Construct, id: string, props: AppRegistryProps) {
    super(scope, id);
    const stack: Stack = <Stack>scope;
    this.appRegMap = this.createMapForAppRegistry(stack, props);
    this.registryApplication = this.createAppRegistry(stack);
    this.createAttributeGroup(stack);
    this.applyTagsToApplication();
  }

  public associateAppWithNestedStacks(nestedStacks: Stack[]) {
    nestedStacks.forEach((nestedStack, ind) => {
      const association = new CfnResourceAssociation(
        this.registryApplication,
        `ResourceAssociation${ind}`,
        {
          application: this.registryApplication.applicationId,
          resource: nestedStack.stackId,
          resourceType: "CFN_STACK",
        }
      );

      // If the nested stack is conditional, the resource association must also be so on the same condition
      // But the condition may have been added as an override
      const stackCondition =
        nestedStack.nestedStackResource?.cfnOptions.condition ?? // eslint-disable prettier/prettier
        (nestedStack as any).resource?.rawOverrides.Condition; // eslint-disable-line @typescript-eslint/no-explicit-any

      if (stackCondition) {
        association.addOverride("Condition", stackCondition.node.id);
      }
    });
  }

  private createAppRegistry(stack: Stack): appreg.Application {
    const application = new appreg.Application(stack, "AppRegistry", {
      applicationName: Fn.join("-", [
        this.appRegMap.findInMap("Data", "AppRegistryApplicationName"),
        Aws.REGION,
        Aws.ACCOUNT_ID,
      ]),
      description: `Service Catalog application to track and manage all your resources for the solution ${this.appRegMap.findInMap(
        "Data",
        "SolutionName"
      )}`,
    });
    application.associateApplicationWithStack(stack);
    return application;
  }

  private createAttributeGroup(stack: Stack) {
    const attributeGroup = new appreg.AttributeGroup(
      stack,
      "DefaultApplicationAttributes",
      {
        attributeGroupName: this.appRegMap.findInMap(
          "Data",
          "AttributeGroupName"
        ),
        description: "Attribute group for solution information",
        attributes: {
          applicationType: this.appRegMap.findInMap("Data", "ApplicationType"),
          version: this.appRegMap.findInMap("Data", "Version"),
          solutionID: this.appRegMap.findInMap("Data", "ID"),
          solutionName: this.appRegMap.findInMap("Data", "SolutionName"),
        },
      }
    );

    this.registryApplication.associateAttributeGroup(attributeGroup);
  }

  private createMapForAppRegistry(stack: Stack, props: AppRegistryProps) {
    const map = new CfnMapping(stack, "Solution");
    map.setValue("Data", "ID", props.solutionId);
    map.setValue("Data", "Version", props.solutionVersion);
    map.setValue(
      "Data",
      "AppRegistryApplicationName",
      props.appRegistryApplicationName
    );
    map.setValue("Data", "SolutionName", props.solutionName);
    map.setValue("Data", "ApplicationType", props.applicationType);
    map.setValue("Data", "AttributeGroupName", props.attributeGroupName);

    return map;
  }

  private applyTagsToApplication() {
    applyTag(
      this.registryApplication,
      "Solutions:SolutionID",
      this.appRegMap.findInMap("Data", "ID")
    );
    applyTag(
      this.registryApplication,
      "Solutions:SolutionName",
      this.appRegMap.findInMap("Data", "SolutionName")
    );
    applyTag(
      this.registryApplication,
      "Solutions:SolutionVersion",
      this.appRegMap.findInMap("Data", "Version")
    );
    applyTag(
      this.registryApplication,
      "Solutions:ApplicationType",
      this.appRegMap.findInMap("Data", "ApplicationType")
    );
  }
}
