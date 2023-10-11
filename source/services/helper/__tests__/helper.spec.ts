// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const mockSendAnonymizedMetric = jest.fn(); // before ../index is imported because const declarations aren't hoisted

import "jest";
import { handler, IEvent } from "../HelperIndex";

const TEST_UUID = "TEST_UUID";
const TEST_STACK_ID = "Stack101";
const TEST_REQ_ID = "Request101";
const TEST_LOGICAL_RES_ID = "LogicalRes101";
const TEST_PHY_RES_ID = "Res101";
const TEST_DASHBOARD_NAME = "testDashboardName";
const TEST_SOLUTION_ID = "SO001";
const TEST_SOLUTION_UUID = "UUID0001";
const TEST_RES_PROP = {
  key1: "value1",
  DashboardName: TEST_DASHBOARD_NAME,
  SolutionId: TEST_SOLUTION_ID,
  SolutionUuid: TEST_SOLUTION_UUID,
};
const CONST_NOV = "NOV";
const mockGenericEvent: IEvent = {
  RequestType: "Create/Delete/...",
  ResponseURL: "",
  StackId: TEST_STACK_ID,
  RequestId: TEST_REQ_ID,
  ResourceType: "Custom::CreateUUID/DeleteDeployment/...",
  LogicalResourceId: TEST_LOGICAL_RES_ID,
  ResourceProperties: TEST_RES_PROP,
  PhysicalResourceId: TEST_PHY_RES_ID,
};
const expectedDefaultResponse = {
  Status: "SUCCESS",
  Reason: "",
  PhysicalResourceId: TEST_PHY_RES_ID,
  StackId: TEST_STACK_ID,
  RequestId: TEST_REQ_ID,
  LogicalResourceId: TEST_LOGICAL_RES_ID,
  Data: {
    UUID: TEST_UUID,
  },
};
const context = {
  logStreamName: "test",
};
const fakeDate = new Date(Date.UTC(2023, 8, 28));
const mockDeleteDashboards = jest.fn();
jest.mock("uuid", () => ({
  v4: () => {
    return TEST_UUID;
  },
}));

jest.mock("aws-sdk", () => {
  const origModule = jest.requireActual("aws-sdk");
  return {
    ...origModule,
    __esModule: true,
    CloudWatch: jest.fn(() => {
      return {
        deleteDashboards: mockDeleteDashboards,
      };
    }),
  };
});

jest.mock("metrics", () => {
  return {
    Metrics: {
      sendAnonymizedMetric: mockSendAnonymizedMetric,
    },
  };
});

describe("Helper", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now: fakeDate });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("should create uuid on create event", async () => {
    const mockCreateEvent: IEvent = {
      ...mockGenericEvent,
      ResourceType: "Custom::CreateUUID",
      RequestType: "Create",
    };
    const response = await handler(mockCreateEvent, context);
    const expectedCreatResponse = {
      ...expectedDefaultResponse,
      Reason: JSON.stringify({ UUID: TEST_UUID }),
      Data: {
        UUID: TEST_UUID,
      },
    };
    expect(response).toEqual(expectedCreatResponse);
    expect(mockDeleteDashboards).toHaveBeenCalledTimes(0);
    expect(mockSendAnonymizedMetric).toHaveBeenCalledTimes(0);
  });

  it("should delete cw dashboards on delete event", async () => {
    const mockDeleteEvent: IEvent = {
      ...mockGenericEvent,
      ResourceType: "Custom::DeleteDeployment",
      RequestType: "Delete",
    };
    const response = await handler(mockDeleteEvent, context);
    const expectedDeleteResponse = {
      ...expectedDefaultResponse,
      Reason: JSON.stringify({ Data: CONST_NOV }),
      Data: { Data: CONST_NOV },
    };
    expect(response).toEqual(expectedDeleteResponse);
    expect(mockDeleteDashboards).toHaveBeenCalledTimes(1);
    expect(mockDeleteDashboards).toHaveBeenCalledWith({
      DashboardNames: [TEST_DASHBOARD_NAME],
    });
    expect(mockSendAnonymizedMetric).toHaveBeenCalledTimes(0);
  });

  it("should send metric data on launch event create with send metric flag true", async () => {
    process.env.SEND_METRIC = "Yes";
    await assertSendAnonymizedCalled(getCustomEvent("Create"), "SolutionLaunched")
  });

  it("should send metric data on launch event delete with send metric flag true", async () => {
    process.env.SEND_METRIC = "Yes";
    await assertSendAnonymizedCalled(getCustomEvent("Delete"), "SolutionDeleted")
  });

  it("should not send metric data on launch event create with send metric flag false", async () => {
    process.env.SEND_METRIC = "No";
    const mockCustomEvent = getCustomEvent("Create");
    const response = await handler(mockCustomEvent, context);
    const dataObj = {
      Data: CONST_NOV
    };
    const expectedCustomResponse = {
      ...expectedDefaultResponse,
      Reason: JSON.stringify(dataObj),
      Data: { ...dataObj },
    };
    expect(response).toEqual(expectedCustomResponse);
    expect(mockDeleteDashboards).toHaveBeenCalledTimes(0);
    expect(mockSendAnonymizedMetric).toHaveBeenCalledTimes(0);
  });

  function getCustomEvent(eventType: string): IEvent {
    return {
      ...mockGenericEvent,
      ResourceType: "Custom::LaunchData",
      RequestType: eventType,
    };
  }

  async function assertSendAnonymizedCalled(mockCustomEvent: IEvent, resultEvent: string) {
    const response = await handler(mockCustomEvent, context);
    const dataObj = {
      Data: {
        Solution: TEST_SOLUTION_ID,
        UUID: TEST_SOLUTION_UUID,
        TimeStamp: fakeDate.toISOString().replace("T", " ").replace("Z", ""),
        Data: {
          Event: resultEvent,
        },
      },
    };
    const expectedCustomResponse = {
      ...expectedDefaultResponse,
      Reason: JSON.stringify(dataObj),
      Data: { ...dataObj },
    };
    expect(response).toEqual(expectedCustomResponse);
    expect(mockDeleteDashboards).toHaveBeenCalledTimes(0);
    expect(mockSendAnonymizedMetric).toHaveBeenCalledTimes(1);
  }

});
