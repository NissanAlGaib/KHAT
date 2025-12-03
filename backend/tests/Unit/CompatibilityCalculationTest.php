<?php

use App\Http\Controllers\MatchController;
use ReflectionClass;

/**
 * Unit tests for MLP-based pet compatibility calculation
 */

beforeEach(function () {
    $this->controller = new MatchController;
    $this->reflection = new ReflectionClass($this->controller);
});

/**
 * Helper to call private methods via reflection
 */
function callPrivateMethod($object, string $methodName, array $parameters = [])
{
    $reflection = new ReflectionClass($object);
    $method = $reflection->getMethod($methodName);
    $method->setAccessible(true);

    return $method->invokeArgs($object, $parameters);
}

test('relu activation returns 0 for negative values', function () {
    $result = callPrivateMethod($this->controller, 'relu', [-5.0]);
    expect($result)->toBe(0.0);

    $result = callPrivateMethod($this->controller, 'relu', [-0.1]);
    expect($result)->toBe(0.0);
});

test('relu activation returns same value for positive values', function () {
    $result = callPrivateMethod($this->controller, 'relu', [5.0]);
    expect($result)->toBe(5.0);

    $result = callPrivateMethod($this->controller, 'relu', [0.5]);
    expect($result)->toBe(0.5);
});

test('sigmoid activation returns value between 0 and 1', function () {
    $result = callPrivateMethod($this->controller, 'sigmoid', [0.0]);
    expect($result)->toBe(0.5);

    $result = callPrivateMethod($this->controller, 'sigmoid', [10.0]);
    expect($result)->toBeGreaterThan(0.99);
    expect($result)->toBeLessThanOrEqual(1.0);

    $result = callPrivateMethod($this->controller, 'sigmoid', [-10.0]);
    expect($result)->toBeLessThan(0.01);
    expect($result)->toBeGreaterThanOrEqual(0.0);
});

test('tanh activation returns value between -1 and 1', function () {
    $result = callPrivateMethod($this->controller, 'tanh', [0.0]);
    expect($result)->toBe(0.0);

    $result = callPrivateMethod($this->controller, 'tanh', [10.0]);
    expect($result)->toBeGreaterThan(0.99);
    expect($result)->toBeLessThanOrEqual(1.0);

    $result = callPrivateMethod($this->controller, 'tanh', [-10.0]);
    expect($result)->toBeLessThan(-0.99);
    expect($result)->toBeGreaterThanOrEqual(-1.0);
});

test('softplus activation returns smooth positive values', function () {
    $result = callPrivateMethod($this->controller, 'softplus', [0.0]);
    expect($result)->toBeGreaterThan(0.69);
    expect($result)->toBeLessThan(0.7);

    $result = callPrivateMethod($this->controller, 'softplus', [-10.0]);
    expect($result)->toBeGreaterThan(0.0);
    expect($result)->toBeLessThan(0.001);

    $result = callPrivateMethod($this->controller, 'softplus', [10.0]);
    expect($result)->toBeGreaterThan(9.9);
});

test('extractInputFeatures returns normalized breed feature', function () {
    // Create mock pet and preferences
    $pet = new stdClass;
    $pet->breed = 'Golden Retriever';
    $pet->species = 'Dog';
    $pet->sex = 'Male';
    $pet->birthdate = null;
    $pet->behaviors = null;
    $pet->attributes = null;

    $userPet = new stdClass;
    $userPet->species = 'Dog';

    $preferences = new stdClass;
    $preferences->preferred_breed = 'Golden Retriever';
    $preferences->preferred_sex = null;
    $preferences->min_age = null;
    $preferences->max_age = null;
    $preferences->preferred_behaviors = null;
    $preferences->preferred_attributes = null;

    $features = callPrivateMethod($this->controller, 'extractInputFeatures', [$pet, $userPet, $preferences]);

    // Perfect breed match should be 1.0
    expect($features['breed'])->toBe(1.0);
});

test('extractInputFeatures returns partial breed feature for same species', function () {
    $pet = new stdClass;
    $pet->breed = 'Labrador';
    $pet->species = 'Dog';
    $pet->sex = 'Male';
    $pet->birthdate = null;
    $pet->behaviors = null;
    $pet->attributes = null;

    $userPet = new stdClass;
    $userPet->species = 'Dog';

    $preferences = new stdClass;
    $preferences->preferred_breed = 'Golden Retriever';
    $preferences->preferred_sex = null;
    $preferences->min_age = null;
    $preferences->max_age = null;
    $preferences->preferred_behaviors = null;
    $preferences->preferred_attributes = null;

    $features = callPrivateMethod($this->controller, 'extractInputFeatures', [$pet, $userPet, $preferences]);

    // Same species but different breed should be 0.3
    expect($features['breed'])->toBe(0.3);
});

test('computeHiddenLayer returns valid activations', function () {
    $inputFeatures = [
        'breed' => 1.0,
        'sex' => 1.0,
        'age' => 0.9,
        'behaviors' => 0.8,
        'behaviors_count' => 3,
        'attributes' => 0.7,
        'attributes_count' => 2,
    ];

    $hidden = callPrivateMethod($this->controller, 'computeHiddenLayer', [$inputFeatures]);

    // Check all expected keys exist
    expect($hidden)->toHaveKeys(['primary', 'secondary', 'interaction', 'bonus']);

    // Primary should be positive (ReLU of weighted sum)
    expect($hidden['primary'])->toBeGreaterThan(0.0);

    // Secondary should be between 0 and 1 (sigmoid)
    expect($hidden['secondary'])->toBeGreaterThan(0.0);
    expect($hidden['secondary'])->toBeLessThanOrEqual(1.0);

    // Interaction should be between -1 and 1 (tanh)
    expect($hidden['interaction'])->toBeGreaterThanOrEqual(-1.0);
    expect($hidden['interaction'])->toBeLessThanOrEqual(1.0);

    // Bonus should be between 0 and 1 (sigmoid)
    expect($hidden['bonus'])->toBeGreaterThan(0.0);
    expect($hidden['bonus'])->toBeLessThanOrEqual(1.0);
});

test('computeOutputLayer returns score between 0 and 100', function () {
    $hiddenActivations = [
        'primary' => 0.5,
        'secondary' => 0.6,
        'interaction' => 0.3,
        'bonus' => 0.7,
    ];

    $inputFeatures = [
        'breed' => 1.0,
        'sex' => 1.0,
        'age' => 0.9,
        'behaviors' => 0.8,
        'behaviors_count' => 3,
        'attributes' => 0.7,
        'attributes_count' => 2,
    ];

    $reasons = [];
    $result = callPrivateMethod($this->controller, 'computeOutputLayer', [$hiddenActivations, $inputFeatures, &$reasons]);

    expect($result['score'])->toBeGreaterThanOrEqual(0);
    expect($result['score'])->toBeLessThanOrEqual(100);
    expect($result['reasons'])->toBeArray();
});

test('compatibility score generates appropriate reasons for high match', function () {
    $hiddenActivations = [
        'primary' => 0.7,
        'secondary' => 0.6,
        'interaction' => 0.5,
        'bonus' => 0.8,
    ];

    $inputFeatures = [
        'breed' => 1.0,
        'sex' => 1.0,
        'age' => 0.9,
        'behaviors' => 0.6,
        'behaviors_count' => 2,
        'attributes' => 0.6,
        'attributes_count' => 2,
    ];

    $reasons = [];
    $result = callPrivateMethod($this->controller, 'computeOutputLayer', [$hiddenActivations, $inputFeatures, &$reasons]);

    // Should include relevant reasons
    expect($result['reasons'])->toContain('Perfect breed match');
    expect($result['reasons'])->toContain('Sex preference match');
    expect($result['reasons'])->toContain('Age within preferred range');
    expect($result['reasons'])->toContain('Matching behaviors');
    expect($result['reasons'])->toContain('Matching attributes');
});

test('compatibility score generates general reason for low match', function () {
    $hiddenActivations = [
        'primary' => 0.1,
        'secondary' => 0.1,
        'interaction' => 0.0,
        'bonus' => 0.3,
    ];

    $inputFeatures = [
        'breed' => 0.0,
        'sex' => 0.0,
        'age' => 0.3,
        'behaviors' => 0.0,
        'behaviors_count' => 0,
        'attributes' => 0.0,
        'attributes_count' => 0,
    ];

    $reasons = [];
    $result = callPrivateMethod($this->controller, 'computeOutputLayer', [$hiddenActivations, $inputFeatures, &$reasons]);

    // Should include general compatibility reason
    expect($result['reasons'])->toContain('General compatibility');
});
