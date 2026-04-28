import { Feather } from "@expo/vector-icons";
import { NavigationContainer, Theme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { AddTransactionScreen } from "../screens/AddTransactionScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { InsightsScreen } from "../screens/InsightsScreen";
import { TransactionsScreen } from "../screens/TransactionsScreen";
import { colors, typography } from "../theme";

export type RootTabParamList = {
  Home: undefined;
  Transactions: undefined;
  Add: undefined;
  Insights: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const appTheme: Theme = {
  dark: false,
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

const iconByRoute: Record<keyof RootTabParamList, keyof typeof Feather.glyphMap> = {
  Home: "home",
  Transactions: "calendar",
  Add: "plus-circle",
  Insights: "bar-chart-2"
};

export function RootNavigator() {
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
            backgroundColor: colors.surface,
            height: 74,
            marginHorizontal: 20,
            marginBottom: 16,
            borderRadius: 20,
            paddingVertical: 10,
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
      </Tab.Navigator>
    </NavigationContainer>
  );
}
