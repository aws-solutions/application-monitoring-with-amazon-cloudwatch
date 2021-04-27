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

import "jest";

import { Apache } from "../lib/apache/ApacheHelper";
import { SSMHelper } from "../lib/SSMHelper";

/**
 * mock setups
 */
// const mockIsTagValid = jest.fn();
const mockSSMGet = jest.fn();
const mockWidgets = jest.fn();
const mockCW = jest.fn();

const sampleWidgets = [
  {
    type: "explorer",
    x: 0,
    y: 30,
    width: 24,
    height: 9,
    properties: {
      metrics: [
        {
          metricName: "netstat_tcp_established",
          resourceType: "AWS::EC2::Instance",
          stat: "Sum",
        },
        {
          metricName: "mem_used_percent",
          resourceType: "AWS::EC2::Instance",
          stat: "Average",
        },
      ],
      labels: [
        {
          key: "",
          value: "",
        },
      ],
      widgetOptions: {
        legend: {
          position: "bottom",
        },
        view: "timeSeries",
        stacked: false,
        rowsPerPage: 1,
        widgetsPerRow: 2,
      },
      period: 300,
      splitBy: "",
      title: "Explorer",
    },
  },
];

const validTag = '{"Key":"CloudWatchDashboard","Value":"Apache"}';
const validTag2 = '{"key":"CloudWatchDashboard","value":"Apache"}';

const invalidTag1 = '{"CloudWatchDashboard":"Apache"}';
const invalidTag2 = '{"Name":"CloudWatchDashboard","Value":"Apache"}';

Apache.prototype.factoryMethod = mockWidgets;
SSMHelper.getParameter = mockSSMGet;

jest.mock("aws-sdk", () => {
  return {
    CloudWatch: jest.fn(() => ({
      putDashboard: mockCW,
      deleteDashboards: mockCW,
    })),
  };
});

/**
 * Test suite for ApacheHelper class
 */
describe("==ApacheHelper==", () => {
  /**
   * Test suite for putDashboard scenarios
   */
  describe("[putDashboard]", () => {
    beforeEach(() => {
      jest.fn().mockClear();
      process.env.TAG_SCHEMA = validTag;
    });

    test("[TDD] failed tag validation", async () => {
      process.env.TAG_SCHEMA = invalidTag1;
      const apache = new Apache();
      try {
        await apache.putDashboard("", "");
      } catch (e) {
        expect(e.message).toEqual("dashboard put failed");
      }
    });

    test("[TDD] failed get parameter", async () => {
      mockSSMGet.mockReturnValue(Promise.reject("error in getting parameter"));
      const apache = new Apache();
      try {
        await apache.putDashboard("", "");
      } catch (e) {
        expect(e.message).toEqual("dashboard put failed");
      }
    });

    test("[BDD] empty instance list", async () => {
      mockSSMGet.mockReturnValue(Promise.resolve([]));
      mockCW.mockImplementation(() => {
        return {
          promise() {
            return Promise.resolve();
          },
        };
      });
      const apache = new Apache();
      try {
        await apache.putDashboard("", "");
      } catch (e) {
        expect(e.message).toEqual("dashboard put failed");
      }
    });

    test("[BDD] failed get widgets", async () => {
      mockSSMGet.mockReturnValue(Promise.resolve(["i-11112222"]));
      mockWidgets.mockImplementation(() => {
        return {
          widgets() {
            throw new Error("error in widgets");
          },
        };
      });
      const apache = new Apache();
      try {
        await apache.putDashboard("", "");
      } catch (e) {
        expect(e.message).toEqual("dashboard put failed");
      }
    });

    test("[TDD] successfull put dashboard", async () => {
      mockSSMGet.mockReturnValue(Promise.resolve(["i-11112222"]));
      mockWidgets.mockImplementation(() => {
        return {
          widgets() {
            return sampleWidgets;
          },
        };
      });
      mockCW.mockImplementation(() => {
        return {
          promise() {
            return Promise.resolve();
          },
        };
      });
      const apache = new Apache();
      try {
        await apache.putDashboard("", "");
      } catch (e) {
        console.log(`negative test: ${e}`);
      }
    });

    test("[TDD] failed put dashboard", async () => {
      mockSSMGet.mockReturnValue(Promise.resolve(["i-11112222"]));
      mockWidgets.mockImplementation(() => {
        return {
          widgets() {
            return sampleWidgets;
          },
        };
      });
      mockCW.mockImplementation(() => {
        return {
          promise() {
            return Promise.reject("failed cw api call");
          },
        };
      });
      const apache = new Apache();
      try {
        await apache.putDashboard("", "");
      } catch (e) {
        expect(e.message).toEqual("dashboard put failed");
      }
    });
  });

  /**
   * Test suite for deleteDashboard scenarios
   */
  describe("[deleteDashboard]", () => {
    beforeEach(() => {
      jest.fn().mockClear();
    });

    test("[TDD] failed delete dashboard", async () => {
      mockCW.mockImplementation(() => {
        return {
          promise() {
            return Promise.reject("failed cw delete api call");
          },
        };
      });
      const apache = new Apache();
      try {
        await apache.deleteDashboard("myDashboard");
      } catch (e) {
        expect(e.message).toEqual("failure in deleting dashboard: myDashboard");
      }
    });

    test("[TDD] successful delete dashboard", async () => {
      mockCW.mockImplementation(() => {
        return {
          promise() {
            return Promise.resolve("dashboard deleted");
          },
        };
      });
      const apache = new Apache();
      try {
        await apache.deleteDashboard("");
      } catch (e) {
        console.log("negative test");
      }
    });
  });

  /**
   * Test suite for isTagValid scenarios
   */
  describe("[isTagValid]", () => {
    beforeEach(() => {
      jest.fn().mockClear();
      Apache.prototype.isTagValid = new Apache().isTagValid;
    });

    test("[TDD] tag is valid", () => {
      const apache = new Apache();
      const isTagValid1 = apache.isTagValid(validTag);
      const isTagValid2 = apache.isTagValid(validTag2);
      expect(isTagValid1).toEqual(true);
      expect(isTagValid2).toEqual(true);
    });

    test("[TDD] tag is invalid", () => {
      const apache = new Apache();
      const isTagValid1 = apache.isTagValid(invalidTag1);
      const isTagValid2 = apache.isTagValid(invalidTag2);
      expect(isTagValid1).toEqual(false);
      expect(isTagValid2).toEqual(false);
    });
  });
});
