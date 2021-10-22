const nanoS = {
  plugAndPinCode: {
    light: require("./lottie/nanoS/1PlugAndPinCode/light.json"),
    dark: require("./lottie/nanoS/1PlugAndPinCode/dark.json"),
  },
  enterPinCode: {
    light: require("./lottie/nanoS/3EnterPinCode/light.json"),
    dark: require("./lottie/nanoS/3EnterPinCode/dark.json"),
  },
  quitApp: {
    light: require("./lottie/nanoS/4QuitApp/light.json"),
    dark: require("./lottie/nanoS/4QuitApp/dark.json"),
  },
  allowManager: {
    light: require("./lottie/nanoS/5AllowManager/light.json"),
    dark: require("./lottie/nanoS/5AllowManager/dark.json"),
  },
  openApp: {
    light: require("./lottie/nanoS/6OpenApp/light.json"),
    dark: require("./lottie/nanoS/6OpenApp/dark.json"),
  },
  validate: {
    light: require("./lottie/nanoS/7Validate/light.json"),
    dark: require("./lottie/nanoS/7Validate/dark.json"),
  },
  firmwareUpdating: {
    light: require("./lottie/nanoS/2FirmwareUpdating/light.json"),
    dark: require("./lottie/nanoS/2FirmwareUpdating/dark.json"),
  },
};
const nanoX = {
  plugAndPinCode: {
    light: require("./lottie/nanoX/1PlugAndPinCode/light.json"),
    dark: require("./lottie/nanoX/1PlugAndPinCode/dark.json"),
  },
  enterPinCode: {
    light: require("./lottie/nanoX/3EnterPinCode/light.json"),
    dark: require("./lottie/nanoX/3EnterPinCode/dark.json"),
  },
  quitApp: {
    light: require("./lottie/nanoX/4QuitApp/light.json"),
    dark: require("./lottie/nanoX/4QuitApp/dark.json"),
  },
  allowManager: {
    light: require("./lottie/nanoX/5AllowManager/light.json"),
    dark: require("./lottie/nanoX/5AllowManager/dark.json"),
  },
  openApp: {
    light: require("./lottie/nanoX/6OpenApp/light.json"),
    dark: require("./lottie/nanoX/6OpenApp/dark.json"),
  },
  validate: {
    light: require("./lottie/nanoX/7Validate/light.json"),
    dark: require("./lottie/nanoX/7Validate/dark.json"),
  },
};

const blue = {
  plugAndPinCode: {
    light: require("./lottie/blue/1PlugAndPinCode/data.json"),
  },
  enterPinCode: {
    light: require("./lottie/blue/3EnterPinCode/data.json"),
  },
  quitApp: {
    light: require("./lottie/blue/4QuitApp/data.json"),
  },
  allowManager: {
    light: require("./lottie/blue/5AllowManager/data.json"),
  },
  openApp: {
    light: require("./lottie/blue/6OpenApp/data.json"),
  },
  validate: {
    light: require("./lottie/blue/7Validate/data.json"),
  },
};

const animations = { nanoX, nanoS, blue };

export const getDeviceAnimation = (
  modelId,
  theme,
  key,
) => {
  const lvl1 = animations[modelId] || animations.nanoX;
  let lvl2;
  if (key === "firmwareUpdating") {
    lvl2 = animations.nanoS[key];
  } else {
    lvl2 = lvl1[key] || animations.nanoX[key];
  }
  if (theme === "dark" && lvl2.dark) return lvl2.dark;
  return lvl2.light;
};
