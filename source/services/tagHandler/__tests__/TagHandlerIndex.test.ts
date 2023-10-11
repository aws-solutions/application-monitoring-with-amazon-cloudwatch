// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const mockIsTagValid = jest.fn();
const mockGetInstances = jest.fn();
const mockGetParameter = jest.fn();
const mockPutParameter = jest.fn();
const mockCompareArrays = jest.fn();

import "jest";
import { handler } from "../TagHandlerIndex";

jest.mock("../lib/EC2Helper", () => {
  return {
    EC2Helper: {
      isTagValid: mockIsTagValid,
      getInstances: mockGetInstances,
      getParameter: mockGetParameter,
      compareArrays: mockCompareArrays,
    },
  };
});

jest.mock("../lib/TagHandlerSSMHelper", () => {
  return {
    TagHandlerSSMHelper: {
      getParameter: mockGetParameter,
      putParameter: mockPutParameter,
    },
  };
});

describe("TagHandlerIndex", function () {
  mockIsTagValid.mockResolvedValue(true);
  mockGetInstances.mockResolvedValue(["i-123"]);
  mockGetParameter.mockResolvedValue("i-123");
  process.env.TAG_SCHEMA = JSON.stringify({
    Key: "test_tag",
    Value: "test_tag_value",
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update ssm parameter when instance needs updating", async () => {
    mockCompareArrays.mockImplementation(() => false);
    await handler({});
    expect(mockPutParameter).toHaveBeenCalledTimes(1);
  });

  it("should not update ssm parameter when instance doesn't need updating", async () => {
    mockCompareArrays.mockImplementation(() => true);
    await handler({});
    expect(mockPutParameter).toHaveBeenCalledTimes(0);
  });

  it("should throw an error and no ssm updating when invalid tag", async () => {
    mockIsTagValid.mockReturnValue(false);
    const action = async () => {
      await handler({});
    };
    await expect(action()).rejects.toThrowError(
      "invalid tag schema for EC2 instances"
    );
    expect(mockPutParameter).toHaveBeenCalledTimes(0);
    expect(mockGetInstances).toHaveBeenCalledTimes(0);
    expect(mockGetParameter).toHaveBeenCalledTimes(0);
    expect(mockCompareArrays).toHaveBeenCalledTimes(0);
  });
});
