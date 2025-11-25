import { useState } from "react";

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface AlertOptions {
  title: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  buttons?: AlertButton[];
}

export function useAlert() {
  const [visible, setVisible] = useState(false);
  const [alertOptions, setAlertOptions] = useState<AlertOptions>({
    title: "",
    message: "",
    type: "info",
    buttons: [{ text: "OK", style: "default" }],
  });

  const showAlert = (options: AlertOptions) => {
    setAlertOptions({
      ...options,
      buttons: options.buttons || [{ text: "OK", style: "default" }],
    });
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
  };

  return {
    visible,
    alertOptions,
    showAlert,
    hideAlert,
  };
}
