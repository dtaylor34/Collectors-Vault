import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

function TabIcon({ icon, focused, activeColor, mutedColor }: {
  icon: IconName; focused: boolean; activeColor: string; mutedColor: string;
}) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 8 }}>
      <MaterialIcons
        name={icon}
        size={focused ? 26 : 24}
        color={focused ? activeColor : mutedColor}
      />
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 14,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
      }}
    >
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => <TabIcon icon="explore" focused={focused} activeColor={colors.tabActive} mutedColor={colors.tabInactive} />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ focused }) => <TabIcon icon="lock" focused={focused} activeColor={colors.tabActive} mutedColor={colors.tabInactive} />,
        }}
      />
      <Tabs.Screen
        name="auction"
        options={{
          title: 'Auction',
          tabBarIcon: ({ focused }) => <TabIcon icon="gavel" focused={focused} activeColor={colors.tabActive} mutedColor={colors.tabInactive} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ focused }) => <TabIcon icon="center-focus-strong" focused={focused} activeColor={colors.tabActive} mutedColor={colors.tabInactive} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon icon="account-circle" focused={focused} activeColor={colors.tabActive} mutedColor={colors.tabInactive} />,
        }}
      />
    </Tabs>
  );
}
