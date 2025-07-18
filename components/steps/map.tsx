export type ButtonLayout = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export const createStepsForMap = (buttonLayouts: ButtonLayout[]) => [
    {
        target: buttonLayouts[0],
        title: "Welcome to the Wadzzo app!",
        content:
            "This tutorial will show you how to use Wadzzo to find pins around you, follow your favorite brands, and collect rewards.",
    },
    {
        target: buttonLayouts[2],
        title: "Wadzzo Balance",
        content:
            "The Wadzzo Balance displays your Wadzzo count. Check the Bounty Board for the latest ways to earn more Wadzzo!",
    },
    {
        target: buttonLayouts[3],
        title: "Refresh Button",
        content:
            "If you need to refresh your map, press the refresh button. This will reload your entire map with all up to date app data.",
    },
    {
        target: buttonLayouts[4],
        title: "Re-center button",
        content:
            "Press the Re-center button to center your map view to your current location",
    },

    {
        target: buttonLayouts[1],
        title: "Pin Auto Collection",
        content:
            "When you automatically collect a pin a celebration will play on screen, indicating your auto collection. This celebration will appear as Wadzzo bursting across your map.",
    },
];