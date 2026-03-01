import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import {
  Send,
  Camera,
  ImageIcon,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import dayjs from "dayjs";
import {
  BreedingContract,
  DailyReport,
  DailyReportData,
  DailyReportsResponse,
  submitDailyReport,
  getDailyReports,
} from "@/services/contractService";
import { getStorageUrl } from "@/utils/imageUrl";

interface ReportsTabProps {
  contract: BreedingContract;
}

const healthStatusOptions: {
  value: DailyReportData["health_status"];
  label: string;
  emoji: string;
  color: string;
}[] = [
  { value: "excellent", label: "Excellent", emoji: "🌟", color: "#16a34a" },
  { value: "good", label: "Good", emoji: "😊", color: "#22c55e" },
  { value: "fair", label: "Fair", emoji: "😐", color: "#eab308" },
  { value: "poor", label: "Poor", emoji: "😟", color: "#f97316" },
  { value: "concerning", label: "Concerning", emoji: "🚨", color: "#ef4444" },
];

export default function ContractReportsTab({ contract }: ReportsTabProps) {
  const [activeView, setActiveView] = useState<"submit" | "history">("submit");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportsData, setReportsData] = useState<DailyReportsResponse | null>(
    null,
  );
  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);

  // Form state
  const [progressNotes, setProgressNotes] = useState("");
  const [healthStatus, setHealthStatus] =
    useState<DailyReportData["health_status"]>("good");
  const [healthNotes, setHealthNotes] = useState("");
  const [breedingAttempted, setBreedingAttempted] = useState(false);
  const [breedingSuccessful, setBreedingSuccessful] = useState<
    boolean | undefined
  >(undefined);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [selectedPhoto, setSelectedPhoto] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const {
    visible: alertVisible,
    alertOptions,
    showAlert,
    hideAlert,
  } = useAlert();

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getDailyReports(contract.id);
      if (result.success && result.data) {
        setReportsData(result.data);
      }
    } catch (error) {
      console.error("Error fetching daily reports:", error);
    } finally {
      setIsLoading(false);
    }
  }, [contract.id]);

  useEffect(() => {
    if (contract.status === "accepted" || contract.status === "fulfilled") {
      fetchReports();
    }
  }, [contract.status, fetchReports]);

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      showAlert({
        title: "Permission Required",
        message: "Please allow photo library access.",
        type: "warning",
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0])
      setSelectedPhoto(result.assets[0]);
  };

  const takePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      showAlert({
        title: "Permission Required",
        message: "Please allow camera access.",
        type: "warning",
      });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0])
      setSelectedPhoto(result.assets[0]);
  };

  const resetForm = () => {
    setProgressNotes("");
    setHealthStatus("good");
    setHealthNotes("");
    setBreedingAttempted(false);
    setBreedingSuccessful(undefined);
    setAdditionalNotes("");
    setSelectedPhoto(null);
  };

  const handleSubmit = async () => {
    if (!progressNotes.trim()) {
      showAlert({
        title: "Required",
        message: "Please provide progress notes",
        type: "error",
      });
      return;
    }
    if (breedingAttempted && breedingSuccessful === undefined) {
      showAlert({
        title: "Required",
        message: "Please indicate if breeding was successful",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const reportDate = dayjs().format("YYYY-MM-DD");
      const result = await submitDailyReport(contract.id, {
        report_date: reportDate,
        progress_notes: progressNotes,
        health_status: healthStatus,
        health_notes: healthNotes || undefined,
        breeding_attempted: breedingAttempted,
        breeding_successful: breedingAttempted ? breedingSuccessful : undefined,
        additional_notes: additionalNotes || undefined,
        photo: selectedPhoto
          ? {
              uri: selectedPhoto.uri,
              mimeType: selectedPhoto.mimeType,
              fileName: selectedPhoto.fileName,
            }
          : undefined,
      });

      if (result.success) {
        showAlert({
          title: "Report Submitted! 📝",
          message: "Your daily report has been recorded.",
          type: "success",
        });
        resetForm();
        fetchReports();
        setActiveView("history");
      } else {
        showAlert({
          title: "Error",
          message: result.message || "Failed to submit report",
          type: "error",
        });
      }
    } catch (error) {
      showAlert({
        title: "Error",
        message: "Failed to submit report",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (contract.status !== "accepted" && contract.status !== "fulfilled") {
    return (
      <View className="items-center justify-center py-16 px-6">
        <Text className="text-4xl mb-3">📝</Text>
        <Text className="text-gray-800 font-bold text-lg mb-2 text-center">
          Reports Not Available Yet
        </Text>
        <Text className="text-gray-500 text-sm text-center">
          Daily reports become available once the contract is accepted by both
          parties.
        </Text>
      </View>
    );
  }

  return (
    <View className="px-4 pt-3">
      {/* Tab Switcher */}
      <View className="flex-row bg-gray-100 rounded-full p-1 mb-4">
        <TouchableOpacity
          onPress={() => setActiveView("submit")}
          className={`flex-1 py-2.5 rounded-full ${activeView === "submit" ? "bg-white" : ""}`}
        >
          <Text
            className={`text-center font-semibold text-sm ${activeView === "submit" ? "text-[#FF6B6B]" : "text-gray-500"}`}
          >
            ✏️ New Report
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveView("history")}
          className={`flex-1 py-2.5 rounded-full ${activeView === "history" ? "bg-white" : ""}`}
        >
          <Text
            className={`text-center font-semibold text-sm ${activeView === "history" ? "text-[#FF6B6B]" : "text-gray-500"}`}
          >
            📜 History ({reportsData?.total_reports || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {activeView === "submit" ? (
        /* ─── Submit New Report ─── */
        <View>
          {reportsData?.today_report_exists && (
            <View className="bg-yellow-50 rounded-xl p-3 mb-4 border border-yellow-200">
              <Text className="text-yellow-800 text-sm">
                ⚠️ You've already submitted a report today. You can still update
                it.
              </Text>
            </View>
          )}

          {/* Health Status */}
          <Text className="font-bold text-gray-800 text-sm mb-2">
            🏥 Pet Health Status
          </Text>
          <View className="flex-row flex-wrap mb-4">
            {healthStatusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setHealthStatus(option.value)}
                className={`px-3 py-2 rounded-full mr-2 mb-2 border-2 ${
                  healthStatus === option.value
                    ? "border-[#FF6B6B] bg-[#FFF5F3]"
                    : "border-gray-200"
                }`}
              >
                <Text
                  className={`text-sm ${healthStatus === option.value ? "font-bold text-[#FF6B6B]" : "text-gray-600"}`}
                >
                  {option.emoji} {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Health Notes */}
          <View className="mb-4">
            <Text className="font-semibold text-gray-700 text-sm mb-1">
              Health Notes (Optional)
            </Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 text-base"
              placeholder="Any health observations..."
              placeholderTextColor="#9CA3AF"
              value={healthNotes}
              onChangeText={setHealthNotes}
              multiline
            />
          </View>

          {/* Progress Notes */}
          <View className="mb-4">
            <Text className="font-bold text-gray-800 text-sm mb-1">
              📋 Progress Notes *
            </Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 text-base min-h-[80px]"
              placeholder="How is the breeding progressing today?..."
              placeholderTextColor="#9CA3AF"
              value={progressNotes}
              onChangeText={setProgressNotes}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Breeding Attempted */}
          <View className="mb-4">
            <Text className="font-bold text-gray-800 text-sm mb-2">
              ❤️ Breeding Attempt Today?
            </Text>
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => {
                  setBreedingAttempted(true);
                  setBreedingSuccessful(undefined);
                }}
                className={`flex-1 py-3 rounded-l-2xl border-2 ${breedingAttempted ? "bg-[#FF6B6B] border-[#FF6B6B]" : "bg-white border-gray-200"}`}
              >
                <Text
                  className={`text-center font-semibold ${breedingAttempted ? "text-white" : "text-gray-600"}`}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setBreedingAttempted(false);
                  setBreedingSuccessful(undefined);
                }}
                className={`flex-1 py-3 rounded-r-2xl border-2 border-l-0 ${!breedingAttempted ? "bg-[#FF6B6B] border-[#FF6B6B]" : "bg-white border-gray-200"}`}
              >
                <Text
                  className={`text-center font-semibold ${!breedingAttempted ? "text-white" : "text-gray-600"}`}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {breedingAttempted && (
            <View className="mb-4">
              <Text className="font-semibold text-gray-700 text-sm mb-2">
                Was it successful? *
              </Text>
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => setBreedingSuccessful(true)}
                  className={`flex-1 py-3 rounded-l-2xl border-2 ${breedingSuccessful === true ? "bg-green-500 border-green-500" : "bg-white border-gray-200"}`}
                >
                  <Text
                    className={`text-center font-semibold ${breedingSuccessful === true ? "text-white" : "text-gray-600"}`}
                  >
                    ✅ Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setBreedingSuccessful(false)}
                  className={`flex-1 py-3 rounded-r-2xl border-2 border-l-0 ${breedingSuccessful === false ? "bg-red-400 border-red-400" : "bg-white border-gray-200"}`}
                >
                  <Text
                    className={`text-center font-semibold ${breedingSuccessful === false ? "text-white" : "text-gray-600"}`}
                  >
                    ❌ No
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Photo */}
          <View className="mb-4">
            <Text className="font-bold text-gray-800 text-sm mb-2">
              📷 Photo (Optional)
            </Text>
            {selectedPhoto ? (
              <View className="relative">
                <Image
                  source={{ uri: selectedPhoto.uri }}
                  className="w-full h-48 rounded-xl"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setSelectedPhoto(null)}
                  className="absolute top-2 right-2 bg-red-500 w-8 h-8 rounded-full items-center justify-center"
                >
                  <Trash2 size={16} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row">
                <TouchableOpacity
                  onPress={takePhoto}
                  className="flex-1 bg-gray-100 py-4 rounded-xl items-center mr-2"
                >
                  <Camera size={24} color="#9CA3AF" />
                  <Text className="text-gray-500 text-xs mt-1">Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={pickImage}
                  className="flex-1 bg-gray-100 py-4 rounded-xl items-center"
                >
                  <ImageIcon size={24} color="#9CA3AF" />
                  <Text className="text-gray-500 text-xs mt-1">Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Additional Notes */}
          <View className="mb-6">
            <Text className="font-semibold text-gray-700 text-sm mb-1">
              Additional Notes (Optional)
            </Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 text-base"
              placeholder="Any other observations..."
              placeholderTextColor="#9CA3AF"
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              multiline
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            className={`py-4 rounded-full flex-row items-center justify-center ${isSubmitting ? "bg-gray-400" : "bg-[#FF6B6B]"}`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Send size={18} color="white" />
                <Text className="text-white font-bold ml-2">
                  Submit Report 📝
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        /* ─── Report History ─── */
        <View>
          {isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#FF6B6B" />
            </View>
          ) : reportsData && reportsData.reports.length > 0 ? (
            reportsData.reports.map((report) => {
              const isExpanded = expandedReportId === report.report_id;
              const healthConfig = healthStatusOptions.find(
                (h) => h.value === report.health_status,
              );

              return (
                <TouchableOpacity
                  key={report.report_id}
                  onPress={() =>
                    setExpandedReportId(isExpanded ? null : report.report_id)
                  }
                  className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <Text className="text-lg mr-2">
                        {healthConfig?.emoji || "📋"}
                      </Text>
                      <View className="flex-1">
                        <Text className="font-bold text-gray-800 text-sm">
                          {dayjs(report.report_date).format("MMM D, YYYY")}
                        </Text>
                        <Text className="text-gray-500 text-xs">
                          by {report.reporter?.name || "Unknown"}{" "}
                          {report.is_from_shooter ? "(Shooter)" : ""}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      <View
                        className="px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: `${healthConfig?.color || "#666"}20`,
                        }}
                      >
                        <Text
                          className="text-xs font-bold"
                          style={{ color: healthConfig?.color || "#666" }}
                        >
                          {healthConfig?.label || report.health_status}
                        </Text>
                      </View>
                      {isExpanded ? (
                        <ChevronUp size={16} color="#9CA3AF" className="ml-2" />
                      ) : (
                        <ChevronDown
                          size={16}
                          color="#9CA3AF"
                          className="ml-2"
                        />
                      )}
                    </View>
                  </View>

                  {isExpanded && (
                    <View className="mt-3 pt-3 border-t border-gray-100">
                      <Text className="text-gray-700 text-sm mb-2">
                        {report.progress_notes}
                      </Text>
                      {report.health_notes && (
                        <View className="bg-gray-50 rounded-lg p-2 mb-2">
                          <Text className="text-gray-500 text-xs font-semibold">
                            Health Notes:
                          </Text>
                          <Text className="text-gray-700 text-xs">
                            {report.health_notes}
                          </Text>
                        </View>
                      )}
                      {report.breeding_attempted && (
                        <View className="flex-row items-center mb-2">
                          {report.breeding_successful ? (
                            <>
                              <CheckCircle size={14} color="#10b981" />
                              <Text className="text-green-700 text-xs ml-1">
                                Breeding successful
                              </Text>
                            </>
                          ) : (
                            <>
                              <XCircle size={14} color="#ef4444" />
                              <Text className="text-red-700 text-xs ml-1">
                                Breeding attempted (not successful)
                              </Text>
                            </>
                          )}
                        </View>
                      )}
                      {report.additional_notes && (
                        <Text className="text-gray-600 text-xs italic">
                          {report.additional_notes}
                        </Text>
                      )}
                      {report.photo_url && (
                        <Image
                          source={{
                            uri: getStorageUrl(report.photo_url) || undefined,
                          }}
                          className="w-full h-40 rounded-xl mt-2"
                          resizeMode="cover"
                        />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          ) : (
            <View className="items-center py-12">
              <Text className="text-4xl mb-3">📝</Text>
              <Text className="text-gray-400 text-sm">
                No reports submitted yet
              </Text>
            </View>
          )}
        </View>
      )}

      <AlertModal
        visible={alertVisible}
        {...alertOptions}
        onClose={hideAlert}
      />
    </View>
  );
}
