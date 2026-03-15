<?php

namespace Tests\Feature\Safety;

use App\Models\SafetyReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SafetyReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_submit_multiple_reports_against_same_user_with_different_reasons(): void
    {
        $reporter = User::factory()->create();
        $reported = User::factory()->create();

        $firstResponse = $this->actingAs($reporter)->postJson("/api/users/{$reported->id}/report", [
            'reason' => SafetyReport::REASON_HARASSMENT,
            'description' => 'First report reason',
        ]);

        $firstResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        $secondResponse = $this->actingAs($reporter)->postJson("/api/users/{$reported->id}/report", [
            'reason' => SafetyReport::REASON_SCAM,
            'description' => 'Second report reason',
        ]);

        $secondResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseCount('safety_reports', 2);
    }

    public function test_user_cannot_submit_duplicate_report_reason_against_same_user(): void
    {
        $reporter = User::factory()->create();
        $reported = User::factory()->create();

        $this->actingAs($reporter)->postJson("/api/users/{$reported->id}/report", [
            'reason' => SafetyReport::REASON_HARASSMENT,
            'description' => 'Initial report',
        ])->assertStatus(200);

        $duplicateResponse = $this->actingAs($reporter)->postJson("/api/users/{$reported->id}/report", [
            'reason' => SafetyReport::REASON_HARASSMENT,
            'description' => 'Duplicate reason report',
        ]);

        $duplicateResponse->assertStatus(400)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'You already submitted a report for this reason against this user');

        $this->assertDatabaseCount('safety_reports', 1);
    }
}
