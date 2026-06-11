import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [step, setStep] = useState<'email' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEmailValid = email.includes('@') && email.includes('.');

  const handleSendReset = async () => {
    if (!isEmailValid || loading) return;
    setLoading(true);
    setEmailError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) {
        setEmailError('오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      } else {
        setStep('done');
      }
    } catch {
      setEmailError('오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>

        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>비밀번호 찾기</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.body}>
          {step === 'email' ? (
            <>
              <Text style={styles.title}>가입한 이메일을 입력해 주세요</Text>
              <Text style={styles.sub}>비밀번호 재설정 링크를 이메일로 보내드려요</Text>

              <Text style={styles.label}>이메일</Text>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor="#CCCCCC"
                value={email}
                onChangeText={t => { setEmail(t); setEmailError(null); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
              {emailError && <Text style={styles.errorText}>{emailError}</Text>}

              <TouchableOpacity
                style={[styles.primaryBtn, (!isEmailValid || loading) && styles.btnDisabled]}
                onPress={handleSendReset}
                activeOpacity={0.8}
                disabled={!isEmailValid || loading}
              >
                {loading
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.primaryBtnText}>재설정 링크 보내기</Text>
                }
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.doneBox}>
              <View style={styles.doneIcon}>
                <Ionicons name="mail" size={40} color="#FFFFFF" />
              </View>
              <Text style={styles.doneTitle}>이메일을 확인해 주세요</Text>
              <Text style={styles.doneSub}>{email}으로{'\n'}비밀번호 재설정 링크를 보냈어요</Text>
              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 32 }]}
                onPress={() => router.replace('/login' as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>로그인하러 가기</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FFFFFF' },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0' },
  backBtn:        { padding: 4 },
  headerTitle:    { flex: 1, fontSize: 17, fontWeight: '700', color: '#212121', textAlign: 'center' },
  body:           { flex: 1, padding: 24, gap: 12 },
  title:          { fontSize: 20, fontWeight: '700', color: '#212121', marginTop: 8 },
  sub:            { fontSize: 14, color: '#888888', marginBottom: 8 },
  label:          { fontSize: 14, fontWeight: '600', color: '#212121' },
  input:          { borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#212121', backgroundColor: '#FAFAFA' },
  errorText:      { fontSize: 13, color: '#F44336', marginTop: -4 },
  primaryBtn:     { backgroundColor: '#FF6F0F', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled:    { backgroundColor: '#FFCBA4' },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  doneBox:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  doneIcon:       { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FF6F0F', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  doneTitle:      { fontSize: 22, fontWeight: '800', color: '#212121' },
  doneSub:        { fontSize: 14, color: '#888888', marginTop: 8, textAlign: 'center', lineHeight: 22 },
});
