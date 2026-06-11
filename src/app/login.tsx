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
import { checkVerificationCode, sendVerificationCode } from '@/lib/twilio-verify';

function formatPhone(text: string) {
  const d = text.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // 탭
  const [tab, setTab] = useState<'email' | 'phone'>('email');

  // 이메일 로그인 상태
  const [emailInput,    setEmailInput]    = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailError,    setEmailError]    = useState<string | null>(null);

  // 전화번호 인증 상태
  const [step,        setStep]        = useState<'phone' | 'code'>('phone');
  const [phone,       setPhone]       = useState('');
  const [code,        setCode]        = useState('');
  const [codeError,   setCodeError]   = useState(false);
  const [sendError,   setSendError]   = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  // ── 이메일 로그인 ────────────────────────────────────────
  const isEmailValid = emailInput.includes('@') && emailInput.includes('.');
  const isPasswordValid = passwordInput.length >= 1;

  const handleEmailLogin = async () => {
    if (!isEmailValid || !isPasswordValid || loading) return;
    setLoading(true);
    setEmailError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailInput.trim(),
        password: passwordInput,
      });
      if (error) {
        setEmailError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        router.replace('/' as any);
      }
    } catch {
      setEmailError('로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  // ── 전화번호 인증 ────────────────────────────────────────
  const phoneDigits  = phone.replace(/-/g, '');
  const isPhoneValid = phoneDigits.length === 11 && phoneDigits.startsWith('0');

  const handleSendCode = async () => {
    if (!isPhoneValid || loading) return;
    setLoading(true);
    setSendError(null);
    try {
      await sendVerificationCode(phone);
      setStep('code');
      setCode('');
      setCodeError(false);
      setVerifyError(null);
    } catch (e: any) {
      setSendError(e?.message ?? '인증번호 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6 || loading) return;
    setLoading(true);
    setVerifyError(null);
    try {
      const ok = await checkVerificationCode(phone, code);
      if (ok) {
        const phoneDigits = phone.replace(/-/g, '');
        const { error } = await supabase.auth.signInWithPassword({
          email: `${phoneDigits}@karrot.app`,
          password: phoneDigits,
        });
        if (error) {
          setVerifyError('계정을 찾을 수 없습니다. 회원가입을 먼저 해주세요.');
        } else {
          router.replace('/' as any);
        }
      } else {
        setCodeError(true);
        setVerifyError('인증번호가 올바르지 않습니다. 다시 확인해 주세요.');
      }
    } catch (e: any) {
      setVerifyError(e?.message ?? '인증 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>

        {/* 로고 */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={52} color="#FFFFFF" />
          </View>
          <Text style={styles.logoTitle}>당근마켓</Text>
          <Text style={styles.logoSub}>우리 동네 중고거래</Text>
        </View>

        {/* 폼 */}
        <View style={styles.formArea}>

          {/* 탭 스위처 */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'email' && styles.tabBtnActive]}
              onPress={() => { setTab('email'); setEmailError(null); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, tab === 'email' && styles.tabBtnTextActive]}>이메일</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'phone' && styles.tabBtnActive]}
              onPress={() => { setTab('phone'); setStep('phone'); setSendError(null); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, tab === 'phone' && styles.tabBtnTextActive]}>전화번호</Text>
            </TouchableOpacity>
          </View>

          {tab === 'email' ? (
            /* ── 이메일 탭 ── */
            <>
              <Text style={styles.formTitle}>이메일로 로그인</Text>
              <TextInput
                style={styles.input}
                placeholder="이메일"
                placeholderTextColor="#CCCCCC"
                value={emailInput}
                onChangeText={t => { setEmailInput(t); setEmailError(null); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={styles.input}
                placeholder="비밀번호"
                placeholderTextColor="#CCCCCC"
                value={passwordInput}
                onChangeText={t => { setPasswordInput(t); setEmailError(null); }}
                secureTextEntry
              />
              {emailError && <Text style={styles.errorText}>{emailError}</Text>}
              <TouchableOpacity
                style={[styles.primaryBtn, (!isEmailValid || !isPasswordValid || loading) && styles.btnDisabled]}
                onPress={handleEmailLogin}
                activeOpacity={0.8}
                disabled={!isEmailValid || !isPasswordValid || loading}
              >
                {loading
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.primaryBtnText}>로그인</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/forgot-password' as any)} activeOpacity={0.7} style={styles.forgotBtn}>
                <Text style={styles.forgotText}>비밀번호를 잊으셨나요?</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* ── 전화번호 탭 ── */
            step === 'phone' ? (
              <>
                <Text style={styles.formTitle}>전화번호로 시작하기</Text>
                <Text style={styles.formSub}>본인 확인을 위해 전화번호를 입력해 주세요</Text>
                <TextInput
                  style={styles.input}
                  placeholder="010-0000-0000"
                  placeholderTextColor="#CCCCCC"
                  value={phone}
                  onChangeText={t => { setPhone(formatPhone(t)); setSendError(null); }}
                  keyboardType="phone-pad"
                  maxLength={13}
                />
                {sendError && <Text style={styles.errorText}>{sendError}</Text>}
                <TouchableOpacity
                  style={[styles.primaryBtn, (!isPhoneValid || loading) && styles.btnDisabled]}
                  onPress={handleSendCode}
                  activeOpacity={0.8}
                  disabled={!isPhoneValid || loading}
                >
                  {loading
                    ? <ActivityIndicator color="#FFFFFF" />
                    : <Text style={styles.primaryBtnText}>인증번호 받기</Text>
                  }
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => { setStep('phone'); setSendError(null); }} style={styles.backRow} activeOpacity={0.7}>
                  <Ionicons name="arrow-back" size={20} color="#555555" />
                  <Text style={styles.backRowText}>{phone} 변경</Text>
                </TouchableOpacity>
                <Text style={styles.formTitle}>인증번호 입력</Text>
                <Text style={styles.formSub}>{phone}으로 보낸 6자리 번호를 입력해 주세요</Text>
                <TextInput
                  style={[styles.input, codeError && styles.inputError]}
                  placeholder="인증번호 6자리"
                  placeholderTextColor="#CCCCCC"
                  value={code}
                  onChangeText={t => { setCode(t.replace(/\D/g, '').slice(0, 6)); setCodeError(false); setVerifyError(null); }}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
                {(codeError || verifyError) && (
                  <Text style={styles.errorText}>{verifyError ?? '인증번호를 다시 확인해 주세요'}</Text>
                )}
                <TouchableOpacity
                  style={[styles.primaryBtn, (code.length !== 6 || loading) && styles.btnDisabled]}
                  onPress={handleVerify}
                  activeOpacity={0.8}
                  disabled={code.length !== 6 || loading}
                >
                  {loading
                    ? <ActivityIndicator color="#FFFFFF" />
                    : <Text style={styles.primaryBtnText}>확인</Text>
                  }
                </TouchableOpacity>
              </>
            )
          )}
        </View>

        {/* 하단 회원가입 링크 */}
        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>처음이신가요?</Text>
          <TouchableOpacity onPress={() => router.push('/signup' as any)} activeOpacity={0.7}>
            <Text style={styles.signupLink}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'space-between' },
  logoArea:         { alignItems: 'center', gap: 10, paddingTop: 32 },
  logoCircle:       { width: 90, height: 90, borderRadius: 28, backgroundColor: '#FF6F0F', alignItems: 'center', justifyContent: 'center', shadowColor: '#FF6F0F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  logoTitle:        { fontSize: 28, fontWeight: '800', color: '#212121', letterSpacing: -0.5 },
  logoSub:          { fontSize: 14, color: '#888888' },
  formArea:         { paddingHorizontal: 24, gap: 12 },
  tabRow:           { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 10, padding: 3 },
  tabBtn:           { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActive:     { backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  tabBtnText:       { fontSize: 14, color: '#888888' },
  tabBtnTextActive: { color: '#212121', fontWeight: '600' },
  formTitle:        { fontSize: 20, fontWeight: '700', color: '#212121' },
  formSub:          { fontSize: 14, color: '#888888', marginBottom: 4 },
  input:            { borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#212121', backgroundColor: '#FAFAFA' },
  inputError:       { borderColor: '#F44336' },
  errorText:        { fontSize: 13, color: '#F44336', marginTop: -4 },
  primaryBtn:       { backgroundColor: '#FF6F0F', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  btnDisabled:      { backgroundColor: '#FFCBA4' },
  primaryBtnText:   { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  backRow:          { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  backRowText:      { fontSize: 14, color: '#555555' },
  bottomRow:        { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  bottomText:       { fontSize: 14, color: '#888888' },
  signupLink:       { fontSize: 14, fontWeight: '700', color: '#FF6F0F' },
  forgotBtn:        { alignItems: 'center', paddingVertical: 4 },
  forgotText:       { fontSize: 13, color: '#888888' },
});
