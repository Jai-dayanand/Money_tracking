import { Feather } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { AddTransactionScreen } from "../screens/AddTransactionScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { InsightsScreen } from "../screens/InsightsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { TransactionsScreen } from "../screens/TransactionsScreen";
import { typography, useAppTheme } from "../theme";

export type RootTabParamList = {
  Home: undefined;
  Transactions: undefined;
  Add: undefined;
  Insights: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const iconByRoute: Record<keyof RootTabParamList, keyof typeof Feather.glyphMap> = {
  Home: "home",
  Transactions: "calendar",
  Add: "plus-circle",
  Insights: "bar-chart-2",
  Profile: "user"
};

export function RootNavigator() {
  const { colors, isDark } = useAppTheme();
  const glassBackground = isDark ? "rgba(12,12,12,0.84)" : "rgba(255,255,255,0.75)";
  const glassBorder = isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.92)";

  const appTheme = {
    dark: isDark,
    colors: {
      primary: colors.accent,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.warn
    },
    fonts: {
      regular: {
        fontFamily: typography.familyRegular,
        fontWeight: "400"
      },
      medium: {
        fontFamily: typography.familySemiBold,
        fontWeight: "600"
      },
      bold: {
        fontFamily: typography.familyBold,
        fontWeight: "700"
      },
      heavy: {
        fontFamily: typography.familyBold,
        fontWeight: "700"
      }
    }
  };

  return (
    <NavigationContainer theme={appTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            position: "absolute",
            borderTopWidth: 0,
            backgroundColor: glassBackground,
            borderWidth: 1,
            borderColor: glassBorder,
            height: 74,
            marginHorizontal: 20,
            marginBottom: 16,
            borderRadius: 20,
            paddingVertical: 10,
            overflow: "hidden",
            shadowColor: colors.shadow,
            shadowOpacity: 0.12,
            shadowRadius: 14,
            shadowOffset: {
              width: 0,
              height: 10
            },
            elevation: 6
          },
          tabBarIcon: ({ color, size, focused }) => (
            <Feather
              name={iconByRoute[route.name as keyof RootTabParamList]}
              color={color}
              size={focused ? size + 2 : size}
            />
          )
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Transactions" component={TransactionsScreen} />
        <Tab.Screen name="Add" component={AddTransactionScreen} />
        <Tab.Screen name="Insights" component={InsightsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
