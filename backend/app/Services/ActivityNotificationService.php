<?php

namespace App\Services;

use App\Models\ActivityNotification;
use Illuminate\Support\Facades\Log;

class ActivityNotificationService
{
    /**
     * Create a notification for a user.
     */
    public static function notify(
        int $userId,
        string $type,
        string $title,
        string $message,
        array $data = []
    ): ?ActivityNotification {
        try {
            return ActivityNotification::create([
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'data' => !empty($data) ? $data : null,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to create activity notification: {$e->getMessage()}", [
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
            ]);
            return null;
        }
    }

    /**
     * Notify about a new match request received.
     */
    public static function matchRequestReceived(
        int $recipientUserId,
        string $requesterPetName,
        string $targetPetName,
        array $extraData = []
    ): ?ActivityNotification {
        return self::notify(
            $recipientUserId,
            ActivityNotification::TYPE_MATCH_REQUEST,
            'New Match Request',
            "{$requesterPetName} wants to match with {$targetPetName}!",
            $extraData
        );
    }

    /**
     * Notify that a match request was accepted.
     */
    public static function matchAccepted(
        int $requesterUserId,
        string $targetPetName,
        array $extraData = []
    ): ?ActivityNotification {
        return self::notify(
            $requesterUserId,
            ActivityNotification::TYPE_MATCH_ACCEPTED,
            'Match Accepted!',
            "{$targetPetName}'s owner accepted your match request! You can now start chatting.",
            $extraData
        );
    }

    /**
     * Notify that a match request was declined.
     */
    public static function matchDeclined(
        int $requesterUserId,
        string $targetPetName,
        array $extraData = []
    ): ?ActivityNotification {
        return self::notify(
            $requesterUserId,
            ActivityNotification::TYPE_MATCH_DECLINED,
            'Match Declined',
            "Your match request for {$targetPetName} was declined.",
            $extraData
        );
    }

    /**
     * Notify about a new message received.
     */
    public static function newMessage(
        int $recipientUserId,
        string $senderName,
        string $messagePreview,
        array $extraData = []
    ): ?ActivityNotification {
        $preview = mb_strlen($messagePreview) > 50
            ? mb_substr($messagePreview, 0, 50) . '...'
            : $messagePreview;

        return self::notify(
            $recipientUserId,
            ActivityNotification::TYPE_NEW_MESSAGE,
            "Message from {$senderName}",
            $preview,
            $extraData
        );
    }

    /**
     * Notify about a shooter request.
     */
    public static function shooterRequest(
        int $shooterUserId,
        string $pet1Name,
        string $pet2Name,
        array $extraData = []
    ): ?ActivityNotification {
        return self::notify(
            $shooterUserId,
            ActivityNotification::TYPE_SHOOTER_REQUEST,
            'New Shooter Request',
            "You've been requested to photograph {$pet1Name} & {$pet2Name}.",
            $extraData
        );
    }

    /**
     * Notify that a shooter request was accepted.
     */
    public static function shooterAccepted(
        int $ownerUserId,
        string $shooterName,
        array $extraData = []
    ): ?ActivityNotification {
        return self::notify(
            $ownerUserId,
            ActivityNotification::TYPE_SHOOTER_ACCEPTED,
            'Shooter Accepted',
            "{$shooterName} has accepted your shooter request!",
            $extraData
        );
    }

    /**
     * Notify about a completed contract.
     */
    public static function contractCompleted(
        int $userId,
        string $petName,
        array $extraData = []
    ): ?ActivityNotification {
        return self::notify(
            $userId,
            ActivityNotification::TYPE_CONTRACT_COMPLETED,
            'Contract Completed',
            "The breeding contract for {$petName} has been completed.",
            $extraData
        );
    }

    /**
     * Notify about subscription changes.
     */
    public static function subscriptionUpdate(
        int $userId,
        string $planName,
        string $message,
        array $extraData = []
    ): ?ActivityNotification {
        return self::notify(
            $userId,
            ActivityNotification::TYPE_SUBSCRIPTION,
            "Subscription: {$planName}",
            $message,
            $extraData
        );
    }

    /**
     * Notify about a payment event.
     */
    public static function paymentEvent(
        int $userId,
        string $title,
        string $message,
        array $extraData = []
    ): ?ActivityNotification {
        return self::notify(
            $userId,
            ActivityNotification::TYPE_PAYMENT,
            $title,
            $message,
            $extraData
        );
    }

    /**
     * Send a system notification.
     */
    public static function system(
        int $userId,
        string $title,
        string $message,
        array $extraData = []
    ): ?ActivityNotification {
        return self::notify(
            $userId,
            ActivityNotification::TYPE_SYSTEM,
            $title,
            $message,
            $extraData
        );
    }
}
