import { App, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { AppRegistryForSolution } from "../lib/app-registry/app-registry";

describe("==App Registry Construct==", () => {
  const app = new App();
  const stack = new Stack(app, "Simple");
  const nestedStack = new Stack(stack, "Nested");
  new AppRegistryForSolution(stack, stack.stackId, {
    solutionId: "S101",
    solutionName: "MySolution",
    solutionVersion: "1.0.0",
    appRegistryApplicationName: "MySolution",
    applicationType: "AWS-Solutions",
    attributeGroupName: "Solution-Metadata",
  }).associateAppWithNestedStacks([nestedStack]);

  const template = Template.fromStack(stack);
  test("snapshot test", () => {
    expect(template.toJSON()).toMatchSnapshot();
  });

  test("template has one app registry association", () => {
    [
      "AWS::ServiceCatalogAppRegistry::Application",
      "AWS::ServiceCatalogAppRegistry::AttributeGroupAssociation",
      "AWS::ServiceCatalogAppRegistry::AttributeGroup",
    ].forEach((value) => template.resourceCountIs(value, 1));
    template.resourceCountIs(
      "AWS::ServiceCatalogAppRegistry::ResourceAssociation",
      2
    );
  });
});
