jest.mock("axios", () => ({
  default: { get: () => Promise.resolve({ data: {} }) }
}));

jest.mock("../../resources/tagged_resources", () => ({
  isTaggedResource: () => false
}));

import { refresh } from "../crud";
import { TaggedDevice } from "../../resources/tagged_resources";
import { API } from "../index";
import { get } from "lodash";
import { Actions } from "../../constants";

describe("refresh()", () => {
  API.setBaseUrl("http://localhost:3000");

  // 1. Enters the `catch` block.
  it("rejects malformed API data", (done) => {
    const device1: TaggedDevice = {
      "uuid": "device.6.1",
      "kind": "device",
      "specialStatus": undefined,
      "body": {
        "id": 6,
        "name": "summer-pond-726",
        "timezone": "America/Chicago",
        "last_saw_api": "2017-08-30T20:42:35.854Z"
      },
    };

    const thunk = refresh(device1);
    const dispatch = jest.fn();
    const { mock } = dispatch;
    thunk(dispatch);
    setImmediate(() => {
      expect(mock.calls.length).toEqual(2);
      const secondCall = mock.calls[1][0];
      expect(get(secondCall, "type", "NO TYPE FOUND"))
        .toEqual(Actions.REFRESH_RESOURCE_NO);
      expect(get(secondCall, "payload.err.message", "NO ERR MSG FOUND"))
        .toEqual("Just saved a malformed TR.");
      done();
    });
  });
});
