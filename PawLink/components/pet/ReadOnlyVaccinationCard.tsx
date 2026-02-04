import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, BorderRadius, Spacing, Shadows } from "@/constants";

// Simplified types for public view (no vaccination_record path exposed)
interface PublicVaccinationShot {
  shot_id: number;
  shot_number: number;
  date_administered: string;
  date_administered_display: string;
  expiration_date: string;
  expiration_date_display: string;
  status: string;
  display_status: string;
  is_expired: boolean;
  is_expiring_soon: boolean;
}

interface PublicVaccinationCard {
  card_id: number;
  vaccine_type: string;
  vaccine_name: string;
  is_required: boolean;
  total_shots_required: number | null;
  interval_days: number | null;
  recurrence_type: "none" | "yearly" | "biannual" | "recurring";
  status: "not_started" | "in_progress" | "completed" | "overdue";
  progress_percentage: number;
  completed_shots_count: number;
  is_series_complete: boolean;
  next_shot_date?: string;
  next_shot_date_display?: string;
  shots: PublicVaccinationShot[];
}

interface ReadOnlyVaccinationCardProps {
  card: PublicVaccinationCard;
  isExpanded?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
    case "verified":
      return Colors.success;
    case "in_progress":
      return Colors.warning;
    case "overdue":
    case "expired":
    case "rejected":
      return Colors.error;
    case "pending":
      return Colors.info;
    default:
      return Colors.textMuted;
  }
};

const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
  switch (status) {
    case "completed":
    case "verified":
      return "checkmark-circle";
    case "in_progress":
      return "time";
    case "overdue":
    case "expired":
      return "alert-circle";
    case "pending":
      return "hourglass";
    case "rejected":
      return "close-circle";
    default:
      return "ellipse-outline";
  }
};

const ShotItem = ({ shot, isLast }: { shot: PublicVaccinationShot; isLast: boolean }) => {
  const statusColor = getStatusColor(shot.display_status);
  const statusIcon = getStatusIcon(shot.display_status);

  return (
    <View style={styles.shotItem}>
      {/* Timeline connector */}
      <View style={styles.timelineContainer}>
        <View style={[styles.timelineDot, { backgroundColor: statusColor }]}>
          <Ionicons name={statusIcon} size={12} color={Colors.white} />
        </View>
        {!isLast && <View style={[styles.timelineLine, { backgroundColor: statusColor }]} />}
      </View>

      {/* Shot details */}
      <View style={styles.shotContent}>
        <View style={styles.shotHeader}>
          <Text style={styles.shotNumber}>Shot {shot.shot_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {shot.display_status.charAt(0).toUpperCase() + shot.display_status.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.shotDate}>
          {shot.status === "pending" 
            ? `Scheduled: TBD`
            : `Administered: ${shot.date_administered_display}`
          }
        </Text>
        {shot.status !== "pending" && (
          <Text style={styles.shotExpiry}>
            Expires: {shot.expiration_date_display}
          </Text>
        )}
      </View>
    </View>
  );
};

export default function ReadOnlyVaccinationCard({
  card,
  isExpanded = false,
}: ReadOnlyVaccinationCardProps) {
  const [expanded, setExpanded] = React.useState(isExpanded);
  const statusColor = getStatusColor(card.status);
  
  // Determine progress text based on vaccine type
  const getProgressText = () => {
    if (card.total_shots_required) {
      return `${card.completed_shots_count}/${card.total_shots_required} shots`;
    }
    switch (card.recurrence_type) {
      case "yearly":
        return "Annual";
      case "biannual":
        return "Every 6 months";
      case "recurring":
        return "Recurring";
      default:
        return "";
    }
  };
  const progressText = getProgressText();

  return (
    <View style={styles.cardContainer}>
      {/* Card Header */}
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.vaccineIcon, { backgroundColor: `${statusColor}20` }]}>
            <Ionicons
              name={card.is_required ? "shield-checkmark" : "medical"}
              size={24}
              color={statusColor}
            />
          </View>
          <View style={styles.headerText}>
            <View style={styles.titleRow}>
              <Text style={styles.vaccineName}>{card.vaccine_name}</Text>
              {card.is_required && (
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              )}
            </View>
            <Text style={styles.progressLabel}>{progressText}</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={Colors.textMuted}
          />
        </View>
      </TouchableOpacity>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${card.progress_percentage}%`,
                backgroundColor: statusColor,
              },
            ]}
          />
        </View>
        <Text style={styles.progressPercentage}>{card.progress_percentage}%</Text>
      </View>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Shot Timeline */}
          {card.shots.length > 0 ? (
            <View style={styles.shotsContainer}>
              {card.shots.map((shot, index) => (
                <ShotItem
                  key={shot.shot_id}
                  shot={shot}
                  isLast={index === card.shots.length - 1}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="medical-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No shots recorded yet</Text>
            </View>
          )}

          {/* Series Completion Message */}
          {card.is_series_complete && card.recurrence_type === "none" && (
            <View style={styles.completionMessage}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.completionText}>Vaccination series completed!</Text>
            </View>
          )}

          {/* Next Shot Info */}
          {card.next_shot_date && !card.is_series_complete && (
            <View style={styles.nextShotInfo}>
              <Ionicons name="calendar-outline" size={16} color={Colors.info} />
              <Text style={styles.nextShotText}>
                Next shot due: {card.next_shot_date_display}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    overflow: "hidden",
    ...Shadows.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  vaccineIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  vaccineName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  requiredBadge: {
    backgroundColor: Colors.primary + "20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.primary,
  },
  progressLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    minWidth: 36,
    textAlign: "right",
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    padding: Spacing.lg,
  },
  shotsContainer: {
    marginBottom: Spacing.md,
  },
  shotItem: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  timelineContainer: {
    alignItems: "center",
    marginRight: Spacing.md,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    minHeight: 30,
  },
  shotContent: {
    flex: 1,
    paddingBottom: Spacing.sm,
  },
  shotHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  shotNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  shotDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  shotExpiry: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  completionMessage: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.successBg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  completionText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.success,
  },
  nextShotInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.infoLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  nextShotText: {
    fontSize: 13,
    color: Colors.info,
    fontWeight: "500",
  },
});
