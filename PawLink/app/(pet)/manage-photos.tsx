import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import BubbleBackgroundRe from "@/components/app/BubbleBackground";
import AlertModal from "@/components/core/AlertModal";
import { useAlert } from "@/hooks/useAlert";
import {
  deletePetPhoto,
  listPetPhotos,
  setPetPrimaryPhoto,
  uploadPetPhotos,
  type PetPhoto,
} from "@/services/petService";
import { getStorageUrl } from "@/utils/imageUrl";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TILE_SIZE = (SCREEN_WIDTH - 48 - 8 * 2) / 3;

const MAX_PHOTOS = 10;

export default function ManagePhotosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const petId = Number(params.petId ?? params.id);
  const petName = (params.petName as string | undefined) ?? "Pet";

  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  const [photos, setPhotos] = useState<PetPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<number | null>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const data = await listPetPhotos(petId);
      setPhotos(Array.isArray(data) ? data : []);
    } catch {
      showAlert({
        title: "Error",
        message: "Failed to load photos.",
        type: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [petId, showAlert]);

  useEffect(() => {
    if (!petId || Number.isNaN(petId)) {
      setLoading(false);
      setRefreshing(false);
      showAlert({
        title: "Error",
        message: "Missing pet ID.",
        type: "error",
        buttons: [{ text: "OK", onPress: () => router.back() }],
      });
      return;
    }
    fetchPhotos();
  }, [petId, fetchPhotos, router, showAlert]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPhotos();
  };

  const handleAddPhotos = async () => {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      showAlert({
        title: "Limit reached",
        message: `You can have at most ${MAX_PHOTOS} photos per pet.`,
        type: "warning",
      });
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) return;

      setUploading(true);

      const updated = await uploadPetPhotos(
        petId,
        result.assets.map((a) => ({
          uri: a.uri,
          fileName: a.fileName ?? undefined,
          mimeType: a.mimeType ?? undefined,
        })),
      );
      setPhotos(Array.isArray(updated) ? updated : []);
    } catch (err: any) {
      showAlert({
        title: "Upload Failed",
        message:
          err?.response?.data?.message ||
          "Could not upload photo(s). Please try again.",
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = (photo: PetPhoto) => {
    if (photo.is_primary) return;

    showAlert({
      title: "Set as Profile Photo?",
      message: `Make this the main photo for ${petName}?`,
      type: "info",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Set Primary",
          onPress: async () => {
            setSettingPrimaryId(photo.photo_id);
            try {
              const updated = await setPetPrimaryPhoto(petId, photo.photo_id);
              setPhotos(updated);
            } catch {
              showAlert({
                title: "Error",
                message: "Failed to set primary photo.",
                type: "error",
              });
            } finally {
              setSettingPrimaryId(null);
            }
          },
        },
      ],
    });
  };

  const handleDelete = (photo: PetPhoto) => {
    showAlert({
      title: "Delete Photo?",
      message: "This action cannot be undone.",
      type: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(photo.photo_id);
            try {
              const updated = await deletePetPhoto(petId, photo.photo_id);
              setPhotos(updated);
            } catch {
              showAlert({
                title: "Error",
                message: "Failed to delete photo.",
                type: "error",
              });
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Hero Header */}
      <View style={styles.heroHeader}>
        <View style={StyleSheet.absoluteFillObject}>
          <BubbleBackgroundRe
            backgroundColor="#F98D67"
            bubbleColor="rgba(255,192,170,0.32)"
            bigCount={3}
            smallCount={5}
          />
        </View>
        <View style={styles.heroRow}>
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Feather name="chevron-left" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.heroTitleWrap}>
            <Text style={styles.heroTitle}>Manage Photos</Text>
            <Text style={styles.heroSubtitle}>{petName}</Text>
          </View>
          <View style={styles.iconSpacer} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentSheet}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#FF8B66" />
            <Text style={styles.loadingText}>Loading photos…</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FF8B66"
              />
            }
          >
            {/* Counter + upload button */}
            <View style={styles.headerRow}>
              <Text style={styles.counter}>
                {photos.length} / {MAX_PHOTOS} photos
              </Text>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  (uploading || photos.length >= MAX_PHOTOS) &&
                    styles.addButtonDisabled,
                ]}
                onPress={handleAddPhotos}
                disabled={uploading || photos.length >= MAX_PHOTOS}
                activeOpacity={0.8}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>Add Photos</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Helper hint */}
            <Text style={styles.hint}>
              Tap a photo to set it as the profile photo. Long-press or use the
              delete button to remove it.
            </Text>

            {/* Photo grid */}
            {photos.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="images-outline" size={52} color="#C7BEC4" />
                <Text style={styles.emptyTitle}>No Photos Yet</Text>
                <Text style={styles.emptyText}>
                  Add photos to build {petName}&apos;s gallery.
                </Text>
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={handleAddPhotos}
                  disabled={uploading}
                  activeOpacity={0.8}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.emptyAddBtnText}>Add First Photo</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.grid}>
                {photos.map((photo) => {
                  const isDeleting = deletingId === photo.photo_id;
                  const isSettingPrimary = settingPrimaryId === photo.photo_id;
                  const isBusy = isDeleting || isSettingPrimary;

                  return (
                    <TouchableOpacity
                      key={photo.photo_id}
                      style={styles.tile}
                      onPress={() => handleSetPrimary(photo)}
                      activeOpacity={0.88}
                      disabled={isBusy}
                    >
                      <Image
                        source={{ uri: getStorageUrl(photo.photo_url) ?? "" }}
                        style={styles.tileImage}
                        resizeMode="cover"
                      />

                      {/* Primary badge */}
                      {photo.is_primary && (
                        <View style={styles.primaryBadge}>
                          <Ionicons name="star" size={10} color="#FFFFFF" />
                          <Text style={styles.primaryBadgeText}>Primary</Text>
                        </View>
                      )}

                      {/* Busy overlay */}
                      {isBusy && (
                        <View style={styles.busyOverlay}>
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        </View>
                      )}

                      {/* Delete button */}
                      {!isBusy && (
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handleDelete(photo)}
                          hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="close-circle"
                            size={20}
                            color="#FF3B30"
                          />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Tip card */}
            <View style={styles.tipCard}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#C0794B"
              />
              <Text style={styles.tipText}>
                The <Text style={styles.tipBold}>Primary</Text> photo is shown
                as your pet&apos;s profile picture across PawLink. Tap any photo
                to promote it.
              </Text>
            </View>
          </ScrollView>
        )}
      </View>

      <AlertModal
        visible={visible}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
        buttons={alertOptions.buttons}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6EEEC",
  },
  heroHeader: {
    height: 120,
    overflow: "hidden",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.26)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconSpacer: {
    width: 34,
    height: 34,
  },
  heroTitleWrap: {
    alignItems: "center",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  heroSubtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
  },
  contentSheet: {
    flex: 1,
    marginTop: -18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#F8F1EF",
    overflow: "hidden",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  loadingText: {
    marginTop: 10,
    color: "#7B7486",
    fontSize: 14,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  counter: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7B6F82",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FF8A66",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addButtonDisabled: {
    opacity: 0.55,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  hint: {
    fontSize: 12,
    color: "#9E96A5",
    marginBottom: 16,
    lineHeight: 17,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#EDE5E1",
  },
  tileImage: {
    width: "100%",
    height: "100%",
  },
  primaryBadge: {
    position: "absolute",
    bottom: 5,
    left: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FF8A66",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  primaryBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  deleteBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#3E3749",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#9490A0",
    textAlign: "center",
    lineHeight: 19,
  },
  emptyAddBtn: {
    marginTop: 14,
    backgroundColor: "#FF8A66",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyAddBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 20,
    backgroundColor: "#FFF4EE",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3DECF",
    padding: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: "#7A5E4A",
    lineHeight: 18,
  },
  tipBold: {
    fontWeight: "700",
    color: "#C0794B",
  },
});
