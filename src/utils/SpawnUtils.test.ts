import { spawnUtils } from './SpawnUtils';

/**
 * Simple test functions for spawn utilities
 * Run these in the browser console to verify overlap prevention
 */

export function testOverlapDetection() {
  console.log('🧪 Testing overlap detection...');
  
  // Mock enemies
  const enemies = [
    {x: 100, y: 100},
    {x: 200, y: 200},
    {x: 300, y: 300}
  ];
  
  // Test cases
  const testCases = [
    {x: 100, y: 100, minDistance: 50, expected: true},   // Should overlap
    {x: 150, y: 150, minDistance: 50, expected: true},   // Should overlap
    {x: 400, y: 400, minDistance: 50, expected: false},  // Should not overlap
    {x: 50, y: 50, minDistance: 50, expected: false},    // Should not overlap
  ];
  
  testCases.forEach((testCase, index) => {
    const result = spawnUtils.hasOverlap(testCase.x, testCase.y, enemies, testCase.minDistance);
    const passed = result === testCase.expected;
    console.log(`Test ${index + 1}: ${passed ? '✅' : '❌'} Expected ${testCase.expected}, got ${result}`);
  });
}

export function testValidPositionFinding() {
  console.log('🧪 Testing valid position finding...');
  
  // Mock enemies in center area
  const enemies = [
    {x: 400, y: 300},
    {x: 420, y: 320},
    {x: 380, y: 280}
  ];
  
  const validPos = spawnUtils.findValidPosition(400, 300, enemies, 50);
  console.log('Valid position found:', validPos);
  
  if (validPos) {
    const hasOverlap = spawnUtils.hasOverlap(validPos.x, validPos.y, enemies, 50);
    console.log(`Position overlap check: ${hasOverlap ? '❌' : '✅'} (should be false)`);
  }
}

export function testCirclePattern() {
  console.log('🧪 Testing circle pattern generation...');
  
  const enemies = [
    {x: 400, y: 300} // Center enemy
  ];
  
  const positions = spawnUtils.generateCirclePositions(400, 300, 6, enemies, 40);
  console.log('Circle positions:', positions);
  
  // Check for overlaps
  let hasOverlaps = false;
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const distance = spawnUtils.distance(positions[i], positions[j]);
      if (distance < 40) {
        hasOverlaps = true;
        console.log(`❌ Overlap detected between positions ${i} and ${j}: distance ${distance}`);
      }
    }
  }
  
  if (!hasOverlaps) {
    console.log('✅ No overlaps detected in circle pattern');
  }
}

export function runAllTests() {
  console.log('🚀 Running all spawn utility tests...\n');
  testOverlapDetection();
  console.log('');
  testValidPositionFinding();
  console.log('');
  testCirclePattern();
  console.log('\n✨ All tests completed!');
}

// Export for browser console access
(window as any).spawnTests = {
  testOverlapDetection,
  testValidPositionFinding,
  testCirclePattern,
  runAllTests
}; 