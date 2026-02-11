<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Report Reasons
    |--------------------------------------------------------------------------
    |
    | Define the available reasons users can select when reporting another user.
    | Each entry maps a machine-readable key to a human-readable label.
    | To add a new reason, simply add a new key => label pair below.
    |
    */

    'report_reasons' => [
        'harassment'    => 'Harassment',
        'scam'          => 'Scam or Fraud',
        'inappropriate' => 'Inappropriate Content',
        'fake_profile'  => 'Fake Profile',
        'other'         => 'Other',
    ],

    /*
    |--------------------------------------------------------------------------
    | Resolution Actions
    |--------------------------------------------------------------------------
    |
    | Actions an admin can take when resolving a report.
    |
    */

    'resolution_actions' => [
        'none'    => 'No Action',
        'warning' => 'Warning',
        'ban'     => 'Ban User',
    ],

    /*
    |--------------------------------------------------------------------------
    | Report Statuses
    |--------------------------------------------------------------------------
    |
    | Possible statuses for a safety report.
    |
    */

    'statuses' => [
        'pending'   => 'Pending',
        'reviewed'  => 'Reviewed',
        'resolved'  => 'Resolved',
        'dismissed' => 'Dismissed',
    ],

];
