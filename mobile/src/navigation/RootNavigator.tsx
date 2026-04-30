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
            bottom: 24,
            left: 40,
            right: 40,
            borderRadius: 999,
            borderTopWidth: 0,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            height: 62,
            paddingBottom: 0,
            paddingTop: 0,
            elevation: 12,
            shadowColor: colors.shadow,
            shadowOpacity: 0.15,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 4 }
          },
          tabBarItemStyle: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 999
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
