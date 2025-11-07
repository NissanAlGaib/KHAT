/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        baloo: ["Baloo-Regular"],
        mulish: ["Mulish-Regular"],
        "mulish-bold": ["Mulish-Bold"],
        roboto: ["Roboto-Regular"],
        "roboto-condensed": ["RobotoCondensed-Regular"],
        "roboto-condensed-extralight": ["Roboto_Condensed-ExtraLight"],
      },
    },
  },
  plugins: [],
};
