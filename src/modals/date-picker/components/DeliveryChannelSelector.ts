import { DeliveryChannel } from "../../../core/types";
import { createDiv, createEl, setCssProps } from "../../../core/dom";
import { getTranslation } from "../../../i18n";
import { NotificationType } from "../types";

export interface DeliveryChannelSelectorResult {
  container: HTMLElement;
  getSelectedChannels: () => DeliveryChannel[];
  updateNotificationType: (type: NotificationType) => void;
}

const CHANNEL_LABELS: Record<DeliveryChannel, string> = {
  push: "Android",
  email: "Email",
  calendar: "Google Calendar",
  telegram: "Telegram",
};

export function createDeliveryChannelSelector(
  parent: HTMLElement,
  language: string,
  availableChannels: DeliveryChannel[],
  initialType: NotificationType
): DeliveryChannelSelectorResult {
  const channels = Array.from(new Set(availableChannels));
  const timeSelection = new Set<DeliveryChannel>(channels);
  const inputs = new Map<DeliveryChannel, HTMLInputElement>();
  const container = createDiv(parent, { cls: "notelert-delivery-channel-selector" });

  createEl(container, "div", {
    text: getTranslation(language, "datePicker.deliveryChannels"),
    cls: "notelert-delivery-channel-selector-title",
  });
  createEl(container, "div", {
    text: getTranslation(language, "datePicker.deliveryChannelsDesc"),
    cls: "notelert-delivery-channel-selector-desc",
  });

  const options = createDiv(container, {
    cls: "notelert-delivery-channel-selector-options",
  });

  channels.forEach(channel => {
    const label = createEl(options, "label", {
      cls: "notelert-delivery-channel-option is-selected",
    });
    const input = createEl(label, "input");
    input.type = "checkbox";
    input.checked = true;
    input.addEventListener("change", () => {
      if (input.checked) timeSelection.add(channel);
      else timeSelection.delete(channel);
      label.classList.toggle("is-selected", input.checked);
    });
    createEl(label, "span", { text: CHANNEL_LABELS[channel] });
    inputs.set(channel, input);
  });

  const locationHint = createEl(container, "div", {
    text: getTranslation(language, "datePicker.locationChannelHint"),
    cls: "notelert-delivery-channel-selector-hint",
  });

  const updateNotificationType = (type: NotificationType) => {
    const isLocation = type === "location";
    inputs.forEach((input, channel) => {
      input.disabled = isLocation;
      input.checked = isLocation
        ? channel === "push"
        : timeSelection.has(channel);
      const label = input.closest("label");
      label?.classList.toggle("is-selected", input.checked);
      label?.classList.toggle(
        "is-disabled",
        isLocation && channel !== "push"
      );
    });
    setCssProps(locationHint, {
      display: isLocation ? "block" : "none",
    });
  };

  updateNotificationType(initialType);

  return {
    container,
    getSelectedChannels: () => Array.from(inputs.entries())
      .filter(([, input]) => input.checked)
      .map(([channel]) => channel),
    updateNotificationType,
  };
}
