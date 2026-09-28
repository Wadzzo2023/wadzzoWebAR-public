import { TabList, Tabs, TabSlot, TabTrigger, type UseTabsOptions } from "expo-router/ui";
import { View } from "react-native";

import { BottomTabBar, LEFT_TABS, RIGHT_TABS } from "~/components/shell/BottomTabBar";

/**
 * The four tabs, headless (expo-router/ui) so the bar can be the web's
 * console with its raised AR launcher. The hidden TabList only registers the
 * routes; BottomTabBar renders the real triggers.
 *
 * `freezeOnBlur`: a tab you've left stays mounted (instant to return to) but
 * stops re-rendering. Without it the map kept re-rendering all its pins on
 * every GPS update while you were on another tab, and taps queued behind it.
 */
// The type wants per-trigger fields (title, action) that expo-router fills in
// itself; screenOptions is merged into each screen's options at runtime.
const TAB_OPTIONS = { screenOptions: { freezeOnBlur: true } } as UseTabsOptions;

export default function TabsLayout() {
  return (
    <Tabs options={TAB_OPTIONS}>
      <View style={{ flex: 1 }}>
        <TabSlot />
      </View>
      <TabList style={{ display: "none" }}>
        {[...LEFT_TABS, ...RIGHT_TABS].map((t) => (
          <TabTrigger key={t.name} name={t.name} href={t.href} />
        ))}
      </TabList>
      <BottomTabBar />
    </Tabs>
  );
}
