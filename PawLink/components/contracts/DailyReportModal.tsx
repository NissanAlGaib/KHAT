import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import {
  X,
  Calendar,
  Heart,
  FileText,
  Send,
  ChevronDown,
  ChevronUp,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Camera,
  ImageIcon,
  Trash2,
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

interface DailyReportModalProps {
  visible: boolean;
  onClose: () => void;
  contract: BreedingContract;
  onReportSubmitted?: () => void;
}

const healthStatusOptions: {
  value: DailyReportData["health_status"];
  label: string;
  color: string;
}[] = [
  { value: "excellent", label: "Excellent", color: "#16a34a" },
  { value: "good", label: "Good", color: "#22c55e" },
  { value: "fair", label: "Fair", color: "#eab308" },
  { value: "poor", label: "Poor", color: "#f97316" },
  { value: "concerning", label: "Concerning", color: "#ef4444" },
];

export default function DailyReportModal({
  visible,
  onClose,
  contract,
  onReportSubmitted,
}: DailyReportModalProps) {
  const [activeTab, setActiveTab] = useState<"submit" | "history">("submit");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportsData, setReportsData] = useState<DailyReportsResponse | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);

  // Form state
  const [reportDate, setReportDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [progressNotes, setProgressNotes] = useState("");
  const [healthStatus, setHealthStatus] = useState<DailyReportData["health_status"]>("good");
  const [healthNotes, setHealthNotes] = useState("");
  const [breedingAttempted, setBreedingAttempted] = useState(false);
  const [breedingSuccessful, setBreedingSuccessful] = useState<boolean | undefined>(undefined);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);

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
    if (visible) {
      fetchReports();
      // Reset form
      setReportDate(dayjs().format("YYYY-MM-DD"));
      setProgressNotes("");
      setHealthStatus("good");
      setHealthNotes("");
      setBreedingAttempted(false);
      setBreedingSuccessful(undefined);
      setAdditionalNotes("");
      setSelectedPhoto(null);
    }
  }, [visible, fetchReports]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your photo library to add photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedPhoto(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your camera to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedPhoto(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!progressNotes.trim()) {
      Alert.alert("Error", "Please provide progress notes");
      return;
    }

    if (breedingAttempted && breedingSuccessful === undefined) {
      Alert.alert("Error", "Please indicate if breeding was successful");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitDailyReport(contract.id, {
        report_date: reportDate,
        progress_notes: progressNotes,
        health_status: healthStatus,
        health_notes: healthNotes || undefined,
        breeding_attempted: breedingAttempted,
        breeding_successful: breedingAttempted ? breedingSuccessful : undefined,
        additional_notes: additionalNotes || undefined,
        photo: selectedPhoto ? {
          uri: selectedPhoto.uri,
          mimeType: selectedPhoto.mimeType,
          fileName: selectedPhoto.fileName || `photo_${Date.now()}.jpg`,
        } : undefined,
      });

      if (result.success) {
        Alert.alert("Success", "Daily report submitted successfully");
        fetchReports();
        // Reset form
        setProgressNotes("");
        setHealthNotes("");
        setBreedingAttempted(false);
        setBreedingSuccessful(undefined);
        setAdditionalNotes("");
        setSelectedPhoto(null);
        setActiveTab("history");
        onReportSubmitted?.();
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to submit daily report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSubmitTab = () => {
    if (reportsData && !reportsData.can_submit_report) {
      return (
        <View className="py-8 items-center">
          <XCircle size={48} color="#9ca3af" />
          <Text className="text-gray-500 text-center mt-4 px-6">
            You are not authorized to submit daily reports for this contract.
            Only the assigned shooter or male pet owner can submit reports.
          </Text>
        </View>
      );
    }

    if (reportsData?.today_report_exists) {
      return (
        <View className="py-8 items-center">
          <CheckCircle size={48} color="#16a34a" />
          <Text className="text-green-700 font-semibold text-center mt-4">
            {"Today's report has been submitted!"}
          </Text>
          <Text className="text-gray-500 text-center mt-2 px-6">
            You can only submit one report per day. Check back tomorrow to submit a new report.
          </Text>
          <TouchableOpacity
            onPress={() => setActiveTab("history")}
            className="mt-4 bg-[#FF6B6B] px-6 py-2 rounded-full"
          >
            <Text className="text-white font-semibold">View Report History</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView className="px-4 py-4" showsVerticalScrollIndicator={false}>
        {/* Report Date */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Report Date</Text>
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
            <Calendar size={20} color="#666" />
            <Text className="text-gray-800 ml-3">
              {dayjs(reportDate).format("MMMM D, YYYY")}
            </Text>
          </View>
        </View>

        {/* Progress Notes */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Progress Notes *</Text>
          <TextInput
            value={progressNotes}
            onChangeText={setProgressNotes}
            placeholder="Describe today's progress..."
            multiline
            numberOfLines={4}
            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
            style={{ textAlignVertical: "top", minHeight: 100 }}
          />
        </View>

        {/* Health Status */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Pet Health Status *</Text>
          <View className="flex-row flex-wrap gap-2">
            {healthStatusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setHealthStatus(option.value)}
                className={`px-4 py-2 rounded-full border ${
                  healthStatus === option.value
                    ? "border-2"
                    : "border-gray-300"
                }`}
                style={{
                  borderColor: healthStatus === option.value ? option.color : "#d1d5db",
                  backgroundColor: healthStatus === option.value ? `${option.color}15` : "white",
                }}
              >
                <Text
                  style={{
                    color: healthStatus === option.value ? option.color : "#6b7280",
                    fontWeight: healthStatus === option.value ? "600" : "400",
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Health Notes */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Health Notes (Optional)</Text>
          <TextInput
            value={healthNotes}
            onChangeText={setHealthNotes}
            placeholder="Any health observations..."
            multiline
            numberOfLines={2}
            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
            style={{ textAlignVertical: "top", minHeight: 60 }}
          />
        </View>

        {/* Breeding Attempted */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Breeding Attempted Today?</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setBreedingAttempted(true)}
              className={`flex-1 py-3 rounded-xl border ${
                breedingAttempted
                  ? "bg-green-50 border-green-500"
                  : "bg-gray-100 border-gray-300"
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  breedingAttempted ? "text-green-700" : "text-gray-600"
                }`}
              >
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setBreedingAttempted(false);
                setBreedingSuccessful(undefined);
              }}
              className={`flex-1 py-3 rounded-xl border ${
                !breedingAttempted
                  ? "bg-gray-200 border-gray-400"
                  : "bg-gray-100 border-gray-300"
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  !breedingAttempted ? "text-gray-700" : "text-gray-600"
                }`}
              >
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Breeding Success (if attempted) */}
        {breedingAttempted && (
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Was Breeding Successful?</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setBreedingSuccessful(true)}
                className={`flex-1 py-3 rounded-xl border ${
                  breedingSuccessful === true
                    ? "bg-green-50 border-green-500"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <Text
                  className={`text-center font-medium ${
                    breedingSuccessful === true ? "text-green-700" : "text-gray-600"
                  }`}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setBreedingSuccessful(false)}
                className={`flex-1 py-3 rounded-xl border ${
                  breedingSuccessful === false
                    ? "bg-red-50 border-red-500"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <Text
                  className={`text-center font-medium ${
                    breedingSuccessful === false ? "text-red-700" : "text-gray-600"
                  }`}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Additional Notes */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Additional Notes (Optional)</Text>
          <TextInput
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            placeholder="Any other observations or notes..."
            multiline
            numberOfLines={2}
            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
            style={{ textAlignVertical: "top", minHeight: 60 }}
          />
        </View>

        {/* Photo Upload */}
        <View className="mb-6">
          <Text className="text-gray-700 font-medium mb-2">Photo (Optional)</Text>
          {selectedPhoto ? (
            <View className="relative">
              <Image
                source={{ uri: selectedPhoto.uri }}
                className="w-full h-48 rounded-xl"
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => setSelectedPhoto(null)}
                className="absolute top-2 right-2 bg-red-500 p-2 rounded-full"
              >
                <Trash2 size={18} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={takePhoto}
                className="flex-1 bg-gray-100 rounded-xl py-4 flex-row items-center justify-center border border-gray-300"
              >
                <Camera size={20} color="#666" />
                <Text className="text-gray-600 font-medium ml-2">Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={pickImage}
                className="flex-1 bg-gray-100 rounded-xl py-4 flex-row items-center justify-center border border-gray-300"
              >
                <ImageIcon size={20} color="#666" />
                <Text className="text-gray-600 font-medium ml-2">Choose</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className="bg-[#FF6B6B] py-4 rounded-full flex-row items-center justify-center mb-6"
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Send size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Submit Report</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderHistoryTab = () => {
    if (isLoading) {
      return (
        <View className="py-10 items-center">
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      );
    }

    if (!reportsData || reportsData.reports.length === 0) {
      return (
        <View className="py-10 items-center">
          <FileText size={48} color="#9ca3af" />
          <Text className="text-gray-500 text-center mt-4">
            No reports submitted yet
          </Text>
        </View>
      );
    }

    return (
      <ScrollView className="px-4 py-4" showsVerticalScrollIndicator={false}>
        <Text className="text-gray-600 mb-4">
          Total Reports: {reportsData.total_reports}
        </Text>
        {reportsData.reports.map((report) => (
          <ReportCard
            key={report.report_id}
            report={report}
            isExpanded={expandedReportId === report.report_id}
            onToggle={() =>
              setExpandedReportId(
                expandedReportId === report.report_id ? null : report.report_id
              )
            }
          />
        ))}
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[90%]">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-800">Daily Reports</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View className="flex-row px-4 py-2 border-b border-gray-100">
            <TouchableOpacity
              onPress={() => setActiveTab("submit")}
              className={`flex-1 py-3 rounded-full ${
                activeTab === "submit" ? "bg-[#FF6B6B]" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === "submit" ? "text-white" : "text-gray-600"
                }`}
              >
                Submit Report
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("history")}
              className={`flex-1 py-3 rounded-full ml-2 ${
                activeTab === "history" ? "bg-[#FF6B6B]" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === "history" ? "text-white" : "text-gray-600"
                }`}
              >
                History ({reportsData?.total_reports || 0})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {activeTab === "submit" ? renderSubmitTab() : renderHistoryTab()}
        </View>
      </View>
    </Modal>
  );
}

// Report Card Component
interface ReportCardProps {
  report: DailyReport;
  isExpanded: boolean;
  onToggle: () => void;
}

function ReportCard({ report, isExpanded, onToggle }: ReportCardProps) {
  const healthColor = healthStatusOptions.find(
    (h) => h.value === report.health_status
  )?.color || "#6b7280";

  return (
    <View className="bg-gray-50 rounded-xl mb-3 overflow-hidden">
      <TouchableOpacity
        onPress={onToggle}
        className="flex-row items-center justify-between px-4 py-3"
      >
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 rounded-full bg-white items-center justify-center mr-3">
            <Calendar size={20} color="#FF6B6B" />
          </View>
          <View className="flex-1">
            <Text className="text-gray-800 font-semibold">
              {dayjs(report.report_date).format("MMMM D, YYYY")}
            </Text>
            <View className="flex-row items-center mt-1">
              <Heart size={14} color={healthColor} />
              <Text className="text-gray-600 text-sm ml-1 capitalize">
                {report.health_status}
              </Text>
              {report.is_from_shooter && (
                <View className="ml-2 bg-blue-100 px-2 py-0.5 rounded-full">
                  <Text className="text-blue-700 text-xs font-medium">Shooter</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        {isExpanded ? (
          <ChevronUp size={20} color="#666" />
        ) : (
          <ChevronDown size={20} color="#666" />
        )}
      </TouchableOpacity>

      {isExpanded && (
        <View className="px-4 pb-4 border-t border-gray-200">
          {/* Reporter Info */}
          {report.reporter && (
            <View className="flex-row items-center py-3 border-b border-gray-100">
              <User size={16} color="#666" />
              <Text className="text-gray-600 ml-2">
                Reported by: <Text className="font-medium">{report.reporter.name}</Text>
              </Text>
            </View>
          )}

          {/* Progress Notes */}
          <View className="py-3 border-b border-gray-100">
            <Text className="text-gray-500 text-sm mb-1">Progress Notes:</Text>
            <Text className="text-gray-800">{report.progress_notes}</Text>
          </View>

          {/* Health Notes */}
          {report.health_notes && (
            <View className="py-3 border-b border-gray-100">
              <Text className="text-gray-500 text-sm mb-1">Health Notes:</Text>
              <Text className="text-gray-800">{report.health_notes}</Text>
            </View>
          )}

          {/* Breeding Info */}
          <View className="py-3 border-b border-gray-100">
            <Text className="text-gray-500 text-sm mb-1">Breeding Attempted:</Text>
            <View className="flex-row items-center">
              {report.breeding_attempted ? (
                <>
                  <CheckCircle size={16} color="#16a34a" />
                  <Text className="text-green-700 ml-1">
                    Yes - {report.breeding_successful ? "Successful" : "Unsuccessful"}
                  </Text>
                </>
              ) : (
                <>
                  <XCircle size={16} color="#9ca3af" />
                  <Text className="text-gray-500 ml-1">No</Text>
                </>
              )}
            </View>
          </View>

          {/* Additional Notes */}
          {report.additional_notes && (
            <View className="py-3 border-b border-gray-100">
              <Text className="text-gray-500 text-sm mb-1">Additional Notes:</Text>
              <Text className="text-gray-800">{report.additional_notes}</Text>
            </View>
          )}

          {/* Photo */}
          {report.photo_url && (
            <View className="py-3 border-b border-gray-100">
              <Text className="text-gray-500 text-sm mb-2">Photo:</Text>
              <Image
                source={{ uri: getStorageUrl(report.photo_url)! }}
                className="w-full h-48 rounded-xl"
                resizeMode="cover"
              />
            </View>
          )}

          {/* Timestamp */}
          <View className="pt-3 flex-row items-center">
            <Clock size={14} color="#9ca3af" />
            <Text className="text-gray-400 text-sm ml-1">
              Submitted: {dayjs(report.created_at).format("MMM D, YYYY h:mm A")}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
