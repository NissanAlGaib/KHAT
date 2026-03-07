import React, { useEffect, useState } from "react";
import { View, Text, Modal, TouchableOpacity, ActivityIndicator } from "react-native";
import { TriangleAlert, CheckCircle } from "lucide-react-native";
import axiosInstance from "@/config/axiosConfig";
import { useSession } from "@/context/AuthContext";
import { colors } from "@/constants/colors";

interface Warning {
  id: string;
  warning_id: number;
  type: string;
  reason: string;
  message: string;
  created_at: string;
}

export function WarningChecker() {
  const { session } = useSession();
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [currentWarning, setCurrentWarning] = useState<Warning | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      checkWarnings();
    }
  }, [session]);

  const checkWarnings = async () => {
    try {
      const response = await axiosInstance.get("/api/notifications");
      if (response.data.success) {
        const allNotifications = response.data.data.notifications;
        const activeWarnings = allNotifications.filter(
          (n: any) => n.type === "user_warning"
        );
        setWarnings(activeWarnings);
        if (activeWarnings.length > 0) {
          setCurrentWarning(activeWarnings[0]);
        }
      }
    } catch (error) {
      console.error("Failed to check warnings:", error);
    }
  };

  const acknowledgeWarning = async () => {
    if (!currentWarning) return;

    setLoading(true);
    try {
      await axiosInstance.put(
        `/api/user/warnings/${currentWarning.warning_id}/acknowledge`
      );
      
      // Remove acknowledged warning from list
      const remaining = warnings.slice(1);
      setWarnings(remaining);
      
      if (remaining.length > 0) {
        setCurrentWarning(remaining[0]);
      } else {
        setCurrentWarning(null);
      }
    } catch (error) {
      console.error("Failed to acknowledge warning:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentWarning) return null;

  return (
    <Modal transparent animationType="fade" visible={!!currentWarning}>
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <View className="bg-white w-full rounded-2xl p-6 shadow-xl">
          <View className="items-center mb-4">
            <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mb-4">
              <TriangleAlert size={32} color={colors.primary} />
            </View>
            <Text className="text-xl font-bold text-gray-900 text-center">
              Official Warning
            </Text>
            <Text className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">
              {currentWarning.reason}
            </Text>
          </View>

          <View className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
            <Text className="text-gray-700 text-center leading-relaxed">
              {currentWarning.admin_notes || currentWarning.message}
            </Text>
          </View>

          <Text className="text-xs text-gray-400 text-center mb-6">
            Please acknowledge this warning to continue using the app.
            Multiple warnings may lead to account suspension.
          </Text>

          <TouchableOpacity
            onPress={acknowledgeWarning}
            disabled={loading}
            className={`w-full py-4 rounded-xl flex-row justify-center items-center ${
              loading ? "bg-gray-300" : "bg-orange-600"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <CheckCircle size={20} color="white" className="mr-2" />
                <Text className="text-white font-bold">I Understand</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
