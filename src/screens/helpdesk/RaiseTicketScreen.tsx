import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEmployees } from '../../api/hook/useEmployee';
import { useCreateTicket } from '../../api/hook/useHelpdesk';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'RaiseTicket'>;

type CategoryType = 'IT' | 'HR' | 'Facilities' | 'Finance';
type PriorityType = 'High' | 'Medium' | 'Low';

export const RaiseTicketScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [selectedEmpId, setSelectedEmpId] = useState('EMP001');
  const [category, setCategory] = useState<CategoryType>('IT');
  const [priority, setPriority] = useState<PriorityType>('High');
  const [subject, setSubject] = useState('MacBook Pro M3 Display Hub Dongle Issue');
  const [description, setDescription] = useState(
    'The USB-C HDMI display hub is not detecting dual external 4K monitors after recent system update.'
  );

  // TanStack Queries & Mutations
  const { data: empRes } = useEmployees();
  const createTicketMutation = useCreateTicket();

  const employees = empRes?.data || [];

  const handleRaiseTicket = () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Validation Error', 'Please complete Subject and Description.');
      return;
    }

    createTicketMutation.mutate(
      {
        employeeId: selectedEmpId,
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Ticket Raised 🎧',
            `Support ticket for "${subject}" has been assigned to ${category} Help Desk queue!`
          );
          navigation.goBack();
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const categories: { key: CategoryType; label: string; icon: string }[] = [
    { key: 'IT', label: 'IT & Software', icon: '💻' },
    { key: 'HR', label: 'HR & Benefits', icon: '👥' },
    { key: 'Facilities', label: 'Facilities & Office', icon: '🏢' },
    { key: 'Finance', label: 'Finance & Payroll', icon: '💰' },
  ];

  const priorities: { key: PriorityType; label: string; color: string }[] = [
    { key: 'High', label: 'High (4h SLA)', color: '#ef4444' },
    { key: 'Medium', label: 'Medium (12h SLA)', color: '#f59e0b' },
    { key: 'Low', label: 'Low (24h SLA)', color: '#10b981' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.headerBackground, borderBottomColor: colors.headerBorder },
        ]}
      >
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.cardBackground }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Raise Support Ticket
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Submit IT, HR, Facilities & Finance Help Desk Requests
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Employee Picker */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>REQUESTER EMPLOYEE *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {employees.length > 0
              ? employees.map(emp => {
                  const isSelected = selectedEmpId === emp.id;
                  return (
                    <TouchableOpacity
                      key={emp.id}
                      style={[
                        styles.empChip,
                        {
                          backgroundColor: isSelected ? colors.accent : colors.background,
                          borderColor: isSelected ? colors.accent : colors.cardBorder,
                        },
                      ]}
                      onPress={() => setSelectedEmpId(emp.id)}
                    >
                      <Text style={{ color: isSelected ? '#fff' : colors.textPrimary, fontWeight: '700', fontSize: 11 }}>
                        {emp.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              : ['EMP001', 'EMP002', 'EMP31723'].map(id => (
                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.empChip,
                      {
                        backgroundColor: selectedEmpId === id ? colors.accent : colors.background,
                        borderColor: selectedEmpId === id ? colors.accent : colors.cardBorder,
                      },
                    ]}
                    onPress={() => setSelectedEmpId(id)}
                  >
                    <Text style={{ color: selectedEmpId === id ? '#fff' : colors.textPrimary, fontWeight: '700', fontSize: 11 }}>
                      {id === 'EMP001' ? 'Aarav Sharma' : id === 'EMP31723' ? 'sam' : 'Neha Patel'}
                    </Text>
                  </TouchableOpacity>
                ))}
          </ScrollView>
        </View>

        {/* Category & Priority Selector */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>TICKET CATEGORY *</Text>
          <View style={styles.catGrid}>
            {categories.map(cat => {
              const isSelected = category === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.catBox,
                    {
                      backgroundColor: isSelected ? 'rgba(59,130,246,0.15)' : colors.background,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setCategory(cat.key)}
                >
                  <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.catLabel,
                      { color: isSelected ? colors.accent : colors.textPrimary },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 8 }]}>PRIORITY & SLA *</Text>
          <View style={styles.prioGrid}>
            {priorities.map(prio => {
              const isSelected = priority === prio.key;
              return (
                <TouchableOpacity
                  key={prio.key}
                  style={[
                    styles.prioBox,
                    {
                      backgroundColor: isSelected ? `${prio.color}20` : colors.background,
                      borderColor: isSelected ? prio.color : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setPriority(prio.key)}
                >
                  <Text style={[styles.prioLabel, { color: isSelected ? prio.color : colors.textPrimary }]}>
                    {prio.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Ticket Subject & Description Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>TICKET SUBJECT *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={subject}
            onChangeText={setSubject}
            placeholder="Brief description of the issue"
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>INCIDENT DETAILS & DESCRIPTION *</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder="Provide specific details, error messages, or workstation info"
          />

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: colors.accent },
              createTicketMutation.isPending && { opacity: 0.7 },
            ]}
            onPress={handleRaiseTicket}
            disabled={createTicketMutation.isPending}
            activeOpacity={0.85}
          >
            {createTicketMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>🚀 Raise Ticket to Help Desk</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  empChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
    marginTop: 4,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  catBox: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  catLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  prioGrid: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  prioBox: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  prioLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
  },
  submitBtn: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
