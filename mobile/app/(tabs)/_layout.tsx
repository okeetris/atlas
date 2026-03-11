/**
 * Tab Navigator Layout
 *
 * Bottom tab navigation with Home, Activities, and Sync tabs.
 */

import { Tabs } from "expo-router";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "../../src/styles/app/tabs/layout.styles";

interface TabIconProps {
  name: string;
  iconName: keyof typeof Ionicons.glyphMap;
  focused: boolean;
}

function TabIcon({ name, iconName, focused }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <Ionicons
        name={iconName}
        size={24}
        color={focused ? "#1976D2" : "#736F6C"}
      />
      <Text
        style={[styles.tabLabel, focused && styles.tabLabelFocused]}
        numberOfLines={1}
      >
        {name}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 70 + Math.max(insets.bottom - 12, 0),
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ],
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#1976D2",
        tabBarInactiveTintColor: "#736F6C",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Home" iconName={focused ? "home" : "home-outline"} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: "Runs",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Runs" iconName={focused ? "fitness" : "fitness-outline"} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="analyze"
        options={{
          title: "New",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="New" iconName={focused ? "add-circle" : "add-circle-outline"} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // Hide from tab bar - accessed via header icon
        }}
      />
    </Tabs>
  );
}

