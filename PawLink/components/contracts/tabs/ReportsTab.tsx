import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
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
  ChevronDown,
  ChevronUp,
  Plus,
  History,
  Heart,
  Stethoscope,
  ClipboardList,
  FileText,
  AlertTriangle,
  Star,
  ThumbsUp,
  Minus,
  ThumbsDown,
  AlertOctagon,
  CircleDot,
  MessageSquare,
  Calendar,
  User,
  ImagePlus,
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

type IconComponent = React.ComponentType<{ size: number; color: string }>;

interface ReportsTabProps {
  contract: BreedingContract;
  collateralPaid?: boolean;
}

const healthStatusOptions: {
  value: DailyReportData["health_status"];
  label: string;
  Icon: IconComponent;
  color: string;
  bg: string;
}[] = [
  {
    value: "excellent",
    label: "Excellent",
    Icon: Star,
    color: "#16a34a",
    bg: "#f0fdf4",
  },
  {
    value: "good",
    label: "Good",
    Icon: ThumbsUp,
    color: "#22c55e",
    bg: "#f0fdf4",
  },
  {
    value: "fair",
    label: "Fair",
    Icon: Minus,
    color: "#eab308",
    bg: "#fefce8",
  },
  {
    value: "poor",
    label: "Poor",
    Icon: ThumbsDown,
    color: "#f97316",
    bg: "#fff7ed",
  },
  {
    value: "concerning",
    label: "Concerning",
    Icon: AlertOctagon,
    color: "#ef4444",
    bg: "#fef2f2",
  },
];

// ─── Section wrapper ───
function FormSection({
  title,
  Icon,
  iconColor = "#FF6B6B",
  required,
  children,
}: {
  title: string;
  Icon: IconComponent;
  iconColor?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
      <View className="flex-row items-center mb-3">
        <View
          className="w-6 h-6 rounded-md items-center justify-center"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon size={13} color={iconColor} />
        </View>
        <Text className="font-bold text-gray-800 text-sm ml-2">{title}</Text>
        {required && <Text className="text-red-400 text-xs ml-1">*</Text>}
      </View>
      {children}
    </View>
  );
}

export default function ContractReportsTab({
  contract,
  collateralPaid = true,
}: ReportsTabProps) {
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
      const result = await submitDailyReport(contract.id, {
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
          title: "Report Submitted!",
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
        <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center mb-4">
          <ClipboardList size={28} color="#D1D5DB" />
        </View>
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
      {/* Collateral payment warning */}
      {!collateralPaid && (
        <View className="bg-amber-50 rounded-2xl p-3 mb-3 border border-amber-200 flex-row items-center">
          <AlertTriangle size={16} color="#92400e" />
          <Text className="text-amber-800 text-xs flex-1 ml-2">
            Your collateral is unpaid. You can still submit reports, but
            breeding completion requires payment from both parties.
          </Text>
        </View>
      )}

      {/* Tab Switcher */}
      <View className="flex-row bg-gray-100 rounded-2xl p-1 mb-4">
        <TouchableOpacity
          onPress={() => setActiveView("submit")}
          className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center ${activeView === "submit" ? "bg-white shadow-sm" : ""}`}
        >
          <Plus
            size={14}
            color={activeView === "submit" ? "#FF6B6B" : "#9CA3AF"}
          />
          <Text
            className={`text-center font-semibold text-sm ml-1.5 ${activeView === "submit" ? "text-[#FF6B6B]" : "text-gray-500"}`}
          >
            New Report
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveView("history")}
          className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center ${activeView === "history" ? "bg-white shadow-sm" : ""}`}
        >
          <History
            size={14}
            color={activeView === "history" ? "#FF6B6B" : "#9CA3AF"}
          />
          <Text
            className={`text-center font-semibold text-sm ml-1.5 ${activeView === "history" ? "text-[#FF6B6B]" : "text-gray-500"}`}
          >
            History ({reportsData?.total_reports || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {activeView === "submit" ? (
        /* ─── Submit New Report ─── */
        <View>
          {reportsData?.today_report_exists && (
            <View className="bg-amber-50 rounded-xl p-3 mb-4 border border-amber-200 flex-row items-center">
              <AlertTriangle size={14} color="#92400e" />
              <Text className="text-amber-800 text-sm ml-2 flex-1">
                You've already submitted a report today. You can still update
                it.
              </Text>
            </View>
          )}

          {/* Health Status */}
          <FormSection
            title="Pet Health Status"
            Icon={Stethoscope}
            iconColor="#10b981"
            required
          >
            <View className="flex-row flex-wrap">
              {healthStatusOptions.map((option) => {
                const isSelected = healthStatus === option.value;
                const HealthIcon = option.Icon;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setHealthStatus(option.value)}
                    className={`flex-row items-center px-3 py-2 rounded-xl mr-2 mb-2 border ${
                      isSelected
                        ? "border-transparent"
                        : "border-gray-200 bg-white"
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: option.bg,
                            borderColor: option.color,
                            borderWidth: 1,
                          }
                        : undefined
                    }
                  >
                    <HealthIcon
                      size={14}
                      color={isSelected ? option.color : "#9CA3AF"}
                    />
                    <Text
                      className={`text-sm ml-1.5 ${isSelected ? "font-bold" : "text-gray-600"}`}
                      style={isSelected ? { color: option.color } : undefined}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Inline health notes */}
            <TextInput
              className="bg-gray-50 rounded-xl px-4 py-3 text-sm mt-2 border border-gray-100"
              placeholder="Any health observations (optional)..."
              placeholderTextColor="#9CA3AF"
              value={healthNotes}
              onChangeText={setHealthNotes}
              multiline
            />
          </FormSection>

          {/* Progress Notes */}
          <FormSection
            title="Progress Notes"
            Icon={ClipboardList}
            iconColor="#6366f1"
            required
          >
            <TextInput
              className="bg-gray-50 rounded-xl px-4 py-3 text-sm min-h-[88px] border border-gray-100"
              placeholder="How is the breeding progressing today?..."
              placeholderTextColor="#9CA3AF"
              value={progressNotes}
              onChangeText={setProgressNotes}
              multiline
              textAlignVertical="top"
            />
          </FormSection>

          {/* Breeding Attempted */}
          <FormSection
            title="Breeding Attempt"
            Icon={Heart}
            iconColor="#FF6B6B"
          >
            <Text className="text-gray-500 text-xs mb-2">
              Was a breeding attempt made today?
            </Text>
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => {
                  setBreedingAttempted(true);
                  setBreedingSuccessful(undefined);
                }}
                className={`flex-1 py-3 rounded-xl mr-1.5 flex-row items-center justify-center border ${
                  breedingAttempted
                    ? "bg-[#FF6B6B] border-[#FF6B6B]"
                    : "bg-white border-gray-200"
                }`}
              >
                <CheckCircle
                  size={15}
                  color={breedingAttempted ? "white" : "#9CA3AF"}
                />
                <Text
                  className={`font-semibold ml-1.5 ${breedingAttempted ? "text-white" : "text-gray-600"}`}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setBreedingAttempted(false);
                  setBreedingSuccessful(undefined);
                }}
                className={`flex-1 py-3 rounded-xl ml-1.5 flex-row items-center justify-center border ${
                  !breedingAttempted
                    ? "bg-gray-800 border-gray-800"
                    : "bg-white border-gray-200"
                }`}
              >
                <XCircle
                  size={15}
                  color={!breedingAttempted ? "white" : "#9CA3AF"}
                />
                <Text
                  className={`font-semibold ml-1.5 ${!breedingAttempted ? "text-white" : "text-gray-600"}`}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>

            {breedingAttempted && (
              <View className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-gray-500 text-xs mb-2">
                  Was the attempt successful? *
                </Text>
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => setBreedingSuccessful(true)}
                    className={`flex-1 py-3 rounded-xl mr-1.5 flex-row items-center justify-center border ${
                      breedingSuccessful === true
                        ? "bg-green-500 border-green-500"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <CheckCircle
                      size={15}
                      color={breedingSuccessful === true ? "white" : "#9CA3AF"}
                    />
                    <Text
                      className={`font-semibold ml-1.5 ${breedingSuccessful === true ? "text-white" : "text-gray-600"}`}
                    >
                      Successful
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setBreedingSuccessful(false)}
                    className={`flex-1 py-3 rounded-xl ml-1.5 flex-row items-center justify-center border ${
                      breedingSuccessful === false
                        ? "bg-red-400 border-red-400"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <XCircle
                      size={15}
                      color={breedingSuccessful === false ? "white" : "#9CA3AF"}
                    />
                    <Text
                      className={`font-semibold ml-1.5 ${breedingSuccessful === false ? "text-white" : "text-gray-600"}`}
                    >
                      Unsuccessful
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </FormSection>

          {/* Photo */}
          <FormSection title="Photo" Icon={ImagePlus} iconColor="#8b5cf6">
            {selectedPhoto ? (
              <View className="relative">
                <Image
                  source={{ uri: selectedPhoto.uri }}
                  className="w-full h-48 rounded-xl"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setSelectedPhoto(null)}
                  className="absolute top-2 right-2 bg-black/50 w-8 h-8 rounded-full items-center justify-center"
                >
                  <Trash2 size={14} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row">
                <TouchableOpacity
                  onPress={takePhoto}
                  className="flex-1 bg-gray-50 py-5 rounded-xl items-center mr-2 border border-dashed border-gray-200"
                >
                  <Camera size={22} color="#9CA3AF" />
                  <Text className="text-gray-500 text-xs font-medium mt-1.5">
                    Camera
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={pickImage}
                  className="flex-1 bg-gray-50 py-5 rounded-xl items-center border border-dashed border-gray-200"
                >
                  <ImageIcon size={22} color="#9CA3AF" />
                  <Text className="text-gray-500 text-xs font-medium mt-1.5">
                    Gallery
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </FormSection>

          {/* Additional Notes */}
          <FormSection
            title="Additional Notes"
            Icon={MessageSquare}
            iconColor="#6B7280"
          >
            <TextInput
              className="bg-gray-50 rounded-xl px-4 py-3 text-sm border border-gray-100"
              placeholder="Any other observations..."
              placeholderTextColor="#9CA3AF"
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              multiline
            />
          </FormSection>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            className={`py-4 rounded-2xl flex-row items-center justify-center mb-4 ${isSubmitting ? "bg-gray-300" : "bg-[#FF6B6B]"}`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Send size={16} color="white" />
                <Text className="text-white font-bold ml-2">Submit Report</Text>
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
              const HealthIcon = healthConfig?.Icon || ClipboardList;

              return (
                <TouchableOpacity
                  key={report.report_id}
                  onPress={() =>
                    setExpandedReportId(isExpanded ? null : report.report_id)
                  }
                  className="bg-white rounded-2xl mb-3 border border-gray-100 overflow-hidden"
                >
                  {/* Colored top accent */}
                  <View
                    className="h-1"
                    style={{
                      backgroundColor: healthConfig?.color || "#9CA3AF",
                    }}
                  />

                  <View className="p-4">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View
                          className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                          style={{
                            backgroundColor: healthConfig?.bg || "#f3f4f6",
                          }}
                        >
                          <HealthIcon
                            size={16}
                            color={healthConfig?.color || "#9CA3AF"}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="font-bold text-gray-800 text-sm">
                            {dayjs(report.report_date).format("MMM D, YYYY")}
                          </Text>
                          <View className="flex-row items-center mt-0.5">
                            <User size={10} color="#9CA3AF" />
                            <Text className="text-gray-500 text-xs ml-1">
                              {report.reporter?.name || "Unknown"}
                              {report.is_from_shooter ? " (Shooter)" : ""}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View className="flex-row items-center">
                        <View
                          className="px-2.5 py-1 rounded-lg mr-2"
                          style={{
                            backgroundColor: healthConfig?.bg || "#f3f4f6",
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
                          <ChevronUp size={16} color="#9CA3AF" />
                        ) : (
                          <ChevronDown size={16} color="#9CA3AF" />
                        )}
                      </View>
                    </View>

                    {isExpanded && (
                      <View className="mt-3 pt-3 border-t border-gray-100">
                        {/* Progress notes */}
                        <View className="bg-gray-50 rounded-xl p-3 mb-2">
                          <View className="flex-row items-center mb-1">
                            <FileText size={11} color="#6B7280" />
                            <Text className="text-gray-500 text-xs font-semibold ml-1">
                              Progress
                            </Text>
                          </View>
                          <Text className="text-gray-700 text-sm">
                            {report.progress_notes}
                          </Text>
                        </View>

                        {report.health_notes && (
                          <View className="bg-gray-50 rounded-xl p-3 mb-2">
                            <View className="flex-row items-center mb-1">
                              <Stethoscope size={11} color="#6B7280" />
                              <Text className="text-gray-500 text-xs font-semibold ml-1">
                                Health Notes
                              </Text>
                            </View>
                            <Text className="text-gray-700 text-sm">
                              {report.health_notes}
                            </Text>
                          </View>
                        )}

                        {report.breeding_attempted && (
                          <View className="flex-row items-center bg-gray-50 rounded-xl p-3 mb-2">
                            {report.breeding_successful ? (
                              <>
                                <CheckCircle size={14} color="#10b981" />
                                <Text className="text-green-700 text-sm ml-1.5 font-medium">
                                  Breeding successful
                                </Text>
                              </>
                            ) : (
                              <>
                                <XCircle size={14} color="#ef4444" />
                                <Text className="text-red-700 text-sm ml-1.5 font-medium">
                                  Breeding attempted (unsuccessful)
                                </Text>
                              </>
                            )}
                          </View>
                        )}

                        {report.additional_notes && (
                          <View className="bg-gray-50 rounded-xl p-3 mb-2">
                            <View className="flex-row items-center mb-1">
                              <MessageSquare size={11} color="#6B7280" />
                              <Text className="text-gray-500 text-xs font-semibold ml-1">
                                Additional Notes
                              </Text>
                            </View>
                            <Text className="text-gray-600 text-sm">
                              {report.additional_notes}
                            </Text>
                          </View>
                        )}

                        {report.photo_url && (
                          <Image
                            source={{
                              uri: getStorageUrl(report.photo_url) || undefined,
                            }}
                            className="w-full h-40 rounded-xl mt-1"
                            resizeMode="cover"
                          />
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View className="items-center py-12">
              <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center mb-3">
                <ClipboardList size={24} color="#9CA3AF" />
              </View>
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
