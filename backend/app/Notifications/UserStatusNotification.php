<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $type;
    public $reason;
    public $duration;
    public $endDate;

    /**
     * Create a new notification instance.
     *
     * @param string $type 'warning', 'suspended', 'banned', 'reactivated'
     * @param string|null $reason
     * @param string|null $duration
     * @param \Carbon\Carbon|null $endDate
     */
    public function __construct($type, $reason = null, $duration = null, $endDate = null)
    {
        $this->type = $type;
        $this->reason = $reason;
        $this->duration = $duration;
        $this->endDate = $endDate;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage);

        switch ($this->type) {
            case 'warning':
                $mail->subject('Official Warning from PawLink')
                     ->greeting('Hello ' . $notifiable->name . ',')
                     ->line('This is an official warning regarding your account activity.')
                     ->line('Reason: ' . ($this->reason ?? 'Violation of Terms of Service'))
                     ->line('Please review our community guidelines to avoid further action against your account.');
                break;

            case 'suspended':
                $mail->subject('PawLink Account Suspended')
                     ->greeting('Hello ' . $notifiable->name . ',')
                     ->line('Your account has been temporarily suspended.')
                     ->line('Reason: ' . ($this->reason ?? 'Violation of Terms of Service'));
                
                if ($this->endDate) {
                    $mail->line('Suspension End Date: ' . $this->endDate->format('F d, Y h:i A'));
                } else {
                    $mail->line('Duration: Indefinite (until manually reviewed)');
                }
                
                $mail->line('You will not be able to log in or access PawLink services during this time.')
                     ->action('Contact Support', url('mailto:support@pawlink.ph')); // Replace with actual support URL
                break;

            case 'banned':
                $mail->subject('PawLink Account Banned')
                     ->greeting('Hello ' . $notifiable->name . ',')
                     ->line('Your account has been permanently banned from PawLink.')
                     ->line('Reason: ' . ($this->reason ?? 'Severe violation of Terms of Service'))
                     ->line('This decision is final.')
                     ->action('Contact Support', url('mailto:support@pawlink.ph'));
                break;
            
            case 'reactivated':
                $mail->subject('PawLink Account Reactivated')
                     ->greeting('Hello ' . $notifiable->name . ',')
                     ->line('Good news! Your account has been reactivated.')
                     ->line('You may now log in and use PawLink services again.')
                     ->action('Log In', url('/')); // Replace with actual login URL
                break;
        }

        return $mail;
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => $this->type,
            'reason' => $this->reason,
            'end_date' => $this->endDate,
        ];
    }
}
