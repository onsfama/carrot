import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // 탭
  const [tab, setTab] = useState<'email' | 'phone'>('email');

  // 공통
  const [nickname, setNickname] = useState('');
  const [loading,  setLoading]  = useState(false);

  // 이메일 가입 상태
  const [emailInput,    setEmailInput]    = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailConfirm,  setEmailConfirm]  = useState('');
  const [emailError,    setEmailError]    = useState<string | null>(null);
  const [emailSent,     setEmailSent]     = useState(false);

  // 전화번호 인증 상태
  const [step,        setStep]        = useState<'info' | 'code'>('info');
  const [phone,       setPhone]       = useState('');
  const [code,        setCode]        = useState('');
  const [codeError,   setCodeError]   = useState(false);
  const [sendError,   setSendError]   = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const isNicknameValid = nickname.trim().length >= 2;

  // ── 이메일 가입 ────────────────────────────────────────
  const isEmailValid    = emailInput.includes('@') && emailInput.includes('.');
  const isPasswordValid = emailPassword.length >= 6;

  const handleEmailSignup = async () => {
    if (!isNicknameValid || !isEmailValid || !isPasswordValid || loading) return;
    if (emailPassword !== emailConfirm) {
      setEmailError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    setEmailError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: emailInput.trim(),
        password: emailPassword,
        options: { data: { nickname: nickname.trim() } },
      });
      if (error) {
        setEmailError(error.message.includes('already') ? '이미 사용 중인 이메일입니다.' : '가입에 실패했습니다.');
        return;
      }
      if (!data.session) {
        setEmailSent(true);
        return;
      }
      router.replace('/' as any);
    } catch {
      setEmailError('가입에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const canEmailSignup = isNicknameValid && isEmailValid && isPasswordValid && emailConfirm.length > 0;

  // ── 전화번호 인증 ────────────────────────────────────────
  const phoneDigits  = phone.replace(/-/g, '');
  const isPhoneValid = phoneDigits.length === 11 && phoneDigits.startsWith('0');
  const canNext      = isPhoneValid && isNicknameValid;

  const handleNext = async () => {
    if (!canNext || loading) return;
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
        const { data, error } = await supabase.auth.signUp({
          email: `${phoneDigits}@karrot.app`,
          password: phoneDigits,
          options: { data: { nickname: nickname.trim() } },
        });
        if (error && !error.message.includes('already')) {
          setVerifyError('가입에 실패했습니다. 잠시 후 다시 시도해 주세요.');
          return;
        }
        router.replace('/' as any);
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

  const goBack = () => {
    if (tab === 'phone' && step === 'code') { setStep('info'); setSendError(null); }
    else { router.back(); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>

        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>회원가입</Text>
          <View style={styles.stepIndicator}>
            {tab === 'phone' && (
              <>
                <View style={[styles.stepDot, step === 'info' && styles.stepDotActive]} />
                <View style={[styles.stepDot, step === 'code' && styles.stepDotActive]} />
              </>
            )}
          </View>
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.body}>

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
                onPress={() => { setTab('phone'); setStep('info'); setSendError(null); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabBtnText, tab === 'phone' && styles.tabBtnTextActive]}>전화번호</Text>
              </TouchableOpacity>
            </View>

            {tab === 'email' && emailSent ? (
              /* ── 이메일 인증 발송 완료 ── */
              <View style={styles.sentBox}>
                <Ionicons name="mail-outline" size={64} color="#FF6F0F" />
                <Text style={styles.sentTitle}>인증 메일을 발송했습니다</Text>
                <Text style={styles.sentDesc}><Text style={{ fontWeight: '700' }}>{emailInput}</Text>{'\n'}으로 발송된 링크를 클릭하면{'\n'}가입이 완료됩니다.</Text>
                <TouchableOpacity onPress={() => router.replace('/login' as any)} activeOpacity={0.8} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>로그인 화면으로</Text>
                </TouchableOpacity>
              </View>
            ) : tab === 'email' ? (
              /* ── 이메일 탭 ── */
              <>
                <Text style={styles.stepTitle}>환영해요!</Text>
                <Text style={styles.stepSub}>이메일로 가입하시면 바로 시작할 수 있어요</Text>

                <View style={styles.avatarWrap}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={40} color="#CCCCCC" />
                  </View>
                </View>

                <Text style={styles.label}>닉네임</Text>
                <TextInput
                  style={styles.input}
                  placeholder="닉네임 (2~12자)"
                  placeholderTextColor="#CCCCCC"
                  value={nickname}
                  onChangeText={setNickname}
                  maxLength={12}
                />
                {nickname.length > 0 && !isNicknameValid && (
                  <Text style={styles.hintText}>닉네임은 2자 이상 입력해 주세요</Text>
                )}

                <Text style={[styles.label, { marginTop: 12 }]}>이메일</Text>
                <TextInput
                  style={styles.input}
                  placeholder="example@email.com"
                  placeholderTextColor="#CCCCCC"
                  value={emailInput}
                  onChangeText={t => { setEmailInput(t); setEmailError(null); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={[styles.label, { marginTop: 12 }]}>비밀번호</Text>
                <TextInput
                  style={styles.input}
                  placeholder="비밀번호 (6자 이상)"
                  placeholderTextColor="#CCCCCC"
                  value={emailPassword}
                  onChangeText={t => { setEmailPassword(t); setEmailError(null); }}
                  secureTextEntry
                />

                <Text style={[styles.label, { marginTop: 12 }]}>비밀번호 확인</Text>
                <TextInput
                  style={[styles.input, emailConfirm.length > 0 && emailPassword !== emailConfirm && styles.inputError]}
                  placeholder="비밀번호 재입력"
                  placeholderTextColor="#CCCCCC"
                  value={emailConfirm}
                  onChangeText={t => { setEmailConfirm(t); setEmailError(null); }}
                  secureTextEntry
                />
                {emailConfirm.length > 0 && emailPassword !== emailConfirm && (
                  <Text style={styles.errorText}>비밀번호가 일치하지 않습니다</Text>
                )}
                {emailError && <Text style={styles.errorText}>{emailError}</Text>}

                <TouchableOpacity
                  style={[styles.primaryBtn, (!canEmailSignup || loading) && styles.btnDisabled]}
                  onPress={handleEmailSignup}
                  activeOpacity={0.8}
                  disabled={!canEmailSignup || loading}
                >
                  {loading
                    ? <ActivityIndicator color="#FFFFFF" />
                    : <Text style={styles.primaryBtnText}>가입 완료</Text>
                  }
                </TouchableOpacity>
              </>
            ) : (
              /* ── 전화번호 탭 ── */
              step === 'info' ? (
                <>
                  <Text style={styles.stepTitle}>환영해요!</Text>
                  <Text style={styles.stepSub}>당근마켓에서 사용할 정보를 입력해 주세요</Text>

                  <View style={styles.avatarWrap}>
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={40} color="#CCCCCC" />
                    </View>
                  </View>

                  <Text style={styles.label}>닉네임</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="닉네임 (2~12자)"
                    placeholderTextColor="#CCCCCC"
                    value={nickname}
                    onChangeText={setNickname}
                    maxLength={12}
                    returnKeyType="next"
                  />
                  {nickname.length > 0 && !isNicknameValid && (
                    <Text style={styles.hintText}>닉네임은 2자 이상 입력해 주세요</Text>
                  )}

                  <Text style={[styles.label, { marginTop: 20 }]}>전화번호</Text>
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
                    style={[styles.primaryBtn, (!canNext || loading) && styles.btnDisabled]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                    disabled={!canNext || loading}
                  >
                    {loading
                      ? <ActivityIndicator color="#FFFFFF" />
                      : <Text style={styles.primaryBtnText}>인증번호 받기</Text>
                    }
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.stepTitle}>인증번호 입력</Text>
                  <Text style={styles.stepSub}>{phone}으로 보낸 6자리 번호를 입력해 주세요</Text>

                  <TextInput
                    style={[styles.input, styles.codeInput, codeError && styles.inputError]}
                    placeholder="000000"
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
                      : <Text style={styles.primaryBtnText}>가입 완료</Text>
                    }
                  </TouchableOpacity>
                </>
              )
            )}
          </View>
        </ScrollView>

        {step === 'info' && (
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>이미 계정이 있으신가요?</Text>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={styles.loginLink}>로그인</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#FFFFFF' },
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0', gap: 12 },
  backBtn:          { padding: 4 },
  headerTitle:      { flex: 1, fontSize: 17, fontWeight: '700', color: '#212121' },
  stepIndicator:    { flexDirection: 'row', gap: 6 },
  stepDot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E0E0E0' },
  stepDotActive:    { backgroundColor: '#FF6F0F' },
  body:             { padding: 24, gap: 12 },
  tabRow:           { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 10, padding: 3 },
  tabBtn:           { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActive:     { backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  tabBtnText:       { fontSize: 14, color: '#888888' },
  tabBtnTextActive: { color: '#212121', fontWeight: '600' },
  stepTitle:        { fontSize: 22, fontWeight: '800', color: '#212121', marginTop: 8 },
  stepSub:          { fontSize: 14, color: '#888888', marginBottom: 8 },
  avatarWrap:       { alignItems: 'center', marginVertical: 12 },
  avatar:           { width: 88, height: 88, borderRadius: 44, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E0E0E0' },
  label:            { fontSize: 14, fontWeight: '600', color: '#212121' },
  input:            { borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#212121', backgroundColor: '#FAFAFA' },
  codeInput:        { fontSize: 22, fontWeight: '700', letterSpacing: 8, textAlign: 'center' },
  inputError:       { borderColor: '#F44336' },
  hintText:         { fontSize: 12, color: '#FF6F0F', marginTop: -4 },
  errorText:        { fontSize: 13, color: '#F44336', marginTop: -4 },
  primaryBtn:       { backgroundColor: '#FF6F0F', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled:      { backgroundColor: '#FFCBA4' },
  primaryBtnText:   { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  bottomRow:        { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingBottom: 8 },
  bottomText:       { fontSize: 14, color: '#888888' },
  loginLink:        { fontSize: 14, fontWeight: '700', color: '#FF6F0F' },
  sentBox:          { alignItems: 'center', gap: 16, paddingVertical: 32 },
  sentTitle:        { fontSize: 20, fontWeight: '800', color: '#212121', textAlign: 'center' },
  sentDesc:         { fontSize: 15, color: '#888888', textAlign: 'center', lineHeight: 22 },
});
