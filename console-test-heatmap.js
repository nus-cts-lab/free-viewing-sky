// Browser console test for heatmap generation
// 1. Open the main experiment (index.html)
// 2. Complete participant form to reach end screen
// 3. Open browser console and paste this code
// 4. Run testHeatmapGeneration()

function injectTestData() {
    console.log('🧪 Injecting test data...');
    
    // Get the experiment controller instance
    const experiment = window.experiment || window.ExperimentController;
    if (!experiment) {
        console.error('❌ Experiment controller not found');
        return false;
    }
    
    const dataManager = experiment.getDataManager();
    if (!dataManager) {
        console.error('❌ DataManager not found');
        return false;
    }
    
    // Clear existing data to be safe
    dataManager.trialData = [];
    dataManager.mouseTrackingData = [];
    
    // Create 3 test trials (one per round)
    for (let round = 1; round <= 3; round++) {
        const trial = {
            trial_idx: round,
            round_number: round,
            round_trial_idx: 1,
            trial_type: round === 2 ? 'filler' : 'image',
            trial_duration_ms: 15000,
            mouse_data_points: 120,
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight,
            timestamp: new Date().toISOString()
        };
        
        dataManager.trialData.push(trial);
        
        // Generate realistic mouse data
        const mouseData = [];
        for (let i = 0; i < 120; i++) {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            // Create different patterns for each round
            let x, y;
            if (round === 1) {
                // Diagonal pattern
                x = (centerX * 0.3) + (i * 3);
                y = (centerY * 0.3) + (i * 2);
            } else if (round === 2) {
                // Circular pattern
                const angle = (i / 120) * Math.PI * 4;
                x = centerX + Math.cos(angle) * 200;
                y = centerY + Math.sin(angle) * 150;
            } else {
                // Random clusters in quadrants
                const quadrant = Math.floor(i / 30);
                const qx = quadrant % 2 === 0 ? 0.25 : 0.75;
                const qy = quadrant < 2 ? 0.25 : 0.75;
                x = (window.innerWidth * qx) + (Math.random() - 0.5) * 100;
                y = (window.innerHeight * qy) + (Math.random() - 0.5) * 100;
            }
            
            // Ensure within bounds
            x = Math.max(0, Math.min(window.innerWidth - 1, x));
            y = Math.max(0, Math.min(window.innerHeight - 1, y));
            
            mouseData.push({
                trial_idx: round,
                round_number: round,
                round_trial_idx: 1,
                trial_type: trial.trial_type,
                point_index: i + 1,
                mouse_x: Math.round(x),
                mouse_y: Math.round(y),
                timestamp: Date.now() + (i * 16),
                time_in_trial: i * 16,
                time: i * 16,  // Add 'time' property for new timestamp-based calculations
                quadrant: dataManager.getQuadrant(x, y)
            });
        }
        
        dataManager.mouseTrackingData.push(...mouseData);
    }
    
    console.log(`✅ Test data injected: ${dataManager.trialData.length} trials, ${dataManager.mouseTrackingData.length} mouse points`);
    return true;
}

async function testHeatmapGeneration() {
    console.log('🚀 Starting heatmap test...');
    
    // Inject test data first
    if (!injectTestData()) {
        console.error('❌ Failed to inject test data');
        return;
    }
    
    // Get experiment instance
    const experiment = window.experiment || window.ExperimentController;
    
    try {
        // Trigger heatmap generation (same as clicking the button)
        await experiment.generateTrialHeatmaps();
        console.log('✅ Heatmap generation test completed!');
    } catch (error) {
        console.error('❌ Heatmap generation failed:', error);
    }
}

console.log('🧪 Heatmap test functions loaded!');
console.log('📋 Usage:');
console.log('   1. injectTestData() - Creates 3 trials with mouse data');
console.log('   2. testHeatmapGeneration() - Runs full test');
console.log('   3. Or just: testHeatmapGeneration() (includes data injection)');