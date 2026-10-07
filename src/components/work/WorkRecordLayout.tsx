import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Fonts} from '../../constants/Themes';

export const WorkRecordLayout = ({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack(): void;
  children: React.ReactNode;
}) => (
  <SafeAreaView style={workRecordStyles.safe}>
    <View style={workRecordStyles.header}>
      <TouchableOpacity accessibilityRole="button" onPress={onBack}>
        <Text style={workRecordStyles.link}>Back</Text>
      </TouchableOpacity>
      <Text style={[workRecordStyles.title, workRecordStyles.headerTitle]}>
        {title}
      </Text>
    </View>
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={workRecordStyles.content}>
      {children}
    </ScrollView>
  </SafeAreaView>
);

export const workRecordStyles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: Colors.gray50},
  header: {padding: 20, flexDirection: 'row', gap: 20, alignItems: 'center'},
  content: {padding: 20, paddingBottom: 40, gap: 16},
  headerTitle: {flex: 1},
  headline: {fontSize: 28},
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filters: {flexDirection: 'row', flexWrap: 'wrap', gap: 16},
  monthlyDashboard: {gap: 10, marginBottom: 16},
  card: {padding: 16, borderRadius: 12, backgroundColor: Colors.white, gap: 8},
  title: {fontFamily: Fonts.semiBold, fontSize: 17, color: Colors.slateText},
  help: {fontSize: 14, lineHeight: 21, color: Colors.secondaryText},
  link: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.gradient1,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: Colors.gradient1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {color: Colors.white, fontFamily: Fonts.semiBold, fontSize: 15},
  input: {
    borderColor: Colors.gray200,
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    color: Colors.slateText,
  },
  error: {color: Colors.amberDarkText, fontSize: 14, lineHeight: 21},
  disabled: {opacity: 0.45},
});
