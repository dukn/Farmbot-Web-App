const mockDevice = {
  updateConfig: jest.fn(() => { return Promise.resolve(); }),
  send: jest.fn(() => { return Promise.resolve(); }),
};
jest.mock("../../../../device", () => ({
  getDevice: () => (mockDevice)
}));

import * as React from "react";
import { PowerAndReset } from "../power_and_reset";
import { mount } from "enzyme";
import { PowerAndResetProps } from "../interfaces";
import { bot } from "../../../../__test_support__/fake_state/bot";
import { panelState } from "../../../../__test_support__/control_panel_state";
import { fakeState } from "../../../../__test_support__/fake_state";
import { clickButton } from "../../../../__test_support__/helpers";

describe("<PowerAndReset/>", () => {
  const fakeProps = (): PowerAndResetProps => {
    return {
      controlPanelState: panelState(),
      dispatch: jest.fn(x => x(jest.fn(), fakeState)),
      sourceFbosConfig: (x) => {
        return { value: bot.hardware.configuration[x], consistent: true };
      },
      shouldDisplay: jest.fn(),
      botOnline: true,
    };
  };

  it("open", () => {
    const p = fakeProps();
    p.controlPanelState.power_and_reset = true;
    const wrapper = mount(<PowerAndReset {...p} />);
    ["Power and Reset", "Restart", "Shutdown", "Factory Reset",
      "Automatic Factory Reset", "Connection Attempt Period"]
      .map(string => expect(wrapper.text().toLowerCase())
        .toContain(string.toLowerCase()));
    ["Restart Firmware", "Change Ownership"]
      .map(string => expect(wrapper.text().toLowerCase())
        .not.toContain(string.toLowerCase()));
  });

  it("closed", () => {
    const p = fakeProps();
    p.controlPanelState.power_and_reset = false;
    const wrapper = mount(<PowerAndReset {...p} />);
    expect(wrapper.text().toLowerCase())
      .toContain("Power and Reset".toLowerCase());
    expect(wrapper.text().toLowerCase())
      .not.toContain("Factory Reset".toLowerCase());
  });

  it("timer input disabled", () => {
    bot.hardware.configuration.disable_factory_reset = true;
    const p = fakeProps();
    p.controlPanelState.power_and_reset = true;
    const wrapper = mount(<PowerAndReset {...p} />);
    expect(wrapper.find("input").last().props().disabled).toBeTruthy();
    expect(wrapper.find("label").last().props().style)
      .toEqual({ color: "grey" });
  });

  it("toggles auto reset", () => {
    bot.hardware.configuration.disable_factory_reset = false;
    const p = fakeProps();
    p.controlPanelState.power_and_reset = true;
    const wrapper = mount(<PowerAndReset {...p} />);
    clickButton(wrapper, 3, "yes");
    expect(mockDevice.updateConfig)
      .toHaveBeenCalledWith({ disable_factory_reset: true });
  });

  it("restarts firmware", () => {
    const p = fakeProps();
    p.controlPanelState.power_and_reset = true;
    p.shouldDisplay = () => true;
    const wrapper = mount(<PowerAndReset {...p} />);
    expect(wrapper.text().toLowerCase())
      .toContain("Restart Firmware".toLowerCase());
    clickButton(wrapper, 2, "restart");
    expect(mockDevice.send).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "rpc_request",
        args: expect.objectContaining({ label: expect.any(String) }),
        body: [expect.objectContaining({
          kind: "reboot", args: { package: "arduino_firmware" }
        })]
      }));
  });

  it("shows change ownership button", () => {
    const p = fakeProps();
    p.controlPanelState.power_and_reset = true;
    p.shouldDisplay = () => true;
    const wrapper = mount(<PowerAndReset {...p} />);
    expect(wrapper.text().toLowerCase())
      .toContain("Change Ownership".toLowerCase());
  });
});
