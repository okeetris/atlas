/**
 * MFA Code Input Modal
 *
 * Shown when Garmin sync requires multi-factor authentication.
 */

import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { styles } from "./MFAModal.styles";

interface MFAModalProps {
  visible: boolean;
  onSubmit: (code: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

export function MFAModal({
  visible,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}: MFAModalProps) {
  const [code, setCode] = useState("");

  const handleSubmit = () => {
    if (code.length >= 4) {
      onSubmit(code.trim());
    }
  };

  const handleCancel = () => {
    setCode("");
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.modal}>
            <Text style={styles.title}>Garmin Authentication</Text>
            <Text style={styles.description}>
              A verification code has been sent to your email or phone. Enter
              the code below to complete sign-in.
            </Text>

            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="Enter code"
              placeholderTextColor="#9E9E9E"
              keyboardType="number-pad"
              maxLength={10}
              autoFocus
              editable={!isSubmitting}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.buttons}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.button,
                  styles.submitButton,
                  (code.length < 4 || isSubmitting) && styles.buttonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={code.length < 4 || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Verify</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

