/**
 * PracticeManager - Handles practice trials with real images
 * Replaces abstract calibration with meaningful task practice
 */

class PracticeManager {
    constructor(dataManager, imageManager, experimentSettings = null) {
        this.dataManager = dataManager;
        this.imageManager = imageManager;
        this.experimentSettings = experimentSettings;
        
        this.practiceTrials = [];
        this.currentTrialIndex = 0;
        this.isPracticing = false;
        this.practiceData = [];
        
        this.trialDuration = 15000; // 15 seconds per practice trial (same as main experiment)
        this.fixationDuration = 2000; // 2 second fixation (same as main experiment)
        
        this.onComplete = null;
        this.onProgress = null;
    }
    
    async loadPracticeTrials() {
        // Create one practice trial with random images from all available images
        const allImages = {
            dysphoric: [],
            threat: [],
            positive: [],
            neutral: []
        };
        
        // Collect all images by category from main trials
        if (this.imageManager.config && this.imageManager.config.imageTrials) {
            this.imageManager.config.imageTrials.forEach(trial => {
                allImages.dysphoric.push(trial.dysphoric);
                allImages.threat.push(trial.threat);
                allImages.positive.push(trial.positive);
                allImages.neutral.push(trial.neutral);
            });
            
            // Shuffle each category and pick one random image from each
            this.shuffleArray(allImages.dysphoric);
            this.shuffleArray(allImages.threat);
            this.shuffleArray(allImages.positive);
            this.shuffleArray(allImages.neutral);
            
            // Create positions for the single practice trial
            const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
            this.shuffleArray(positions);
            
            // Create single practice trial
            this.practiceTrials = [{
                images: {
                    dysphoric: {
                        src: allImages.dysphoric[0],
                        position: positions[0],
                        category: 'dysphoric'
                    },
                    threat: {
                        src: allImages.threat[0],
                        position: positions[1], 
                        category: 'threat'
                    },
                    positive: {
                        src: allImages.positive[0],
                        position: positions[2],
                        category: 'positive'
                    },
                    neutral: {
                        src: allImages.neutral[0],
                        position: positions[3],
                        category: 'neutral'
                    }
                },
                positions: {
                    dysphoric: positions[0],
                    threat: positions[1],
                    positive: positions[2],
                    neutral: positions[3]
                }
            }];
            
            console.log('Single practice trial loaded with random images:', this.practiceTrials);
            return true;
        }
        
        console.error('No image trials found in config for practice');
        return false;
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    async startPractice(onProgress = null, onComplete = null) {
        this.onProgress = onProgress;
        this.onComplete = onComplete;
        this.isPracticing = true;
        this.currentTrialIndex = 0;
        this.practiceData = [];
        
        // Load practice trials if not already loaded
        if (this.practiceTrials.length === 0) {
            const loaded = await this.loadPracticeTrials();
            if (!loaded) {
                console.error('Failed to load practice trials');
                this.completePractice();
                return;
            }
        }
        
        // Start practice trial directly (which will show fixation first)
        // No need to show practice screen - experiment.js already switched to experiment screen
        await this.runPracticeTrial();
        
        console.log('Practice started');
    }
    
    showPracticeScreen() {
        // Use the dedicated practice screen
        const practiceScreen = document.getElementById('practice-screen');
        if (practiceScreen) {
            const instructions = document.getElementById('practice-instructions');
            if (instructions) {
                instructions.innerHTML = `
                    <p>Let's practice! You'll see 4 images arranged in different positions.</p>
                    <p>Move your mouse cursor to look at the images - it acts as your "spotlight" of attention.</p>
                    <p>There's no right or wrong way to look. Just explore the images naturally.</p>
                    <p>The practice trial lasts 15 seconds (same as the main experiment).</p>
                `;
            }
            
            const progress = document.getElementById('practice-progress');
            if (progress) {
                progress.textContent = `Practice Trial (1 round with 4 images)`;
            }
        }
        
        // Show practice screen
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        practiceScreen.classList.add('active');
    }
    
    async runPracticeTrial() {
        if (this.currentTrialIndex >= this.practiceTrials.length) {
            await this.completePractice();
            return;
        }
        
        const trial = this.practiceTrials[this.currentTrialIndex];
        const trialStartTime = performance.now();
        
        // Update progress
        this.updateProgress();
        
        try {
            // Show fixation cross
            await this.showFixation();
            
            // Show images with mouse spotlight
            await this.showPracticeImages(trial);
            
            // Collect mouse data for this trial
            const trialEndTime = performance.now();
            let mouseData = [];
            try {
                if (typeof mouseview !== 'undefined') {
                    // Stop tracking (this logs to console but doesn't return data)
                    mouseview.stopTracking();
                    
                    // Get the actual data using proper API method
                    mouseData = mouseview.getData() || [];
                    
                    // Clear data for next trial (to avoid accumulation)
                    mouseview.clearData();
                }
            } catch (error) {
                console.error('Error stopping practice tracking:', error);
            }
            
            // Record practice performance
            this.recordPracticeData(trial, trialStartTime, trialEndTime, mouseData);
            
            // Move to next trial
            this.currentTrialIndex++;
            
            // Brief pause between trials
            await this.delay(500);
            
            // Continue to next trial
            if (this.isPracticing) {
                await this.runPracticeTrial();
            }
            
        } catch (error) {
            console.error('Error in practice trial:', error);
            this.currentTrialIndex++;
            if (this.isPracticing) {
                await this.runPracticeTrial();
            }
        }
    }
    
    async showFixation() {
        // Get experiment screen elements (we'll reuse them)
        const experimentScreen = document.getElementById('experiment-screen');
        const fixationCross = document.getElementById('fixation-cross');
        const imageContainer = document.getElementById('image-container');
        
        // Temporarily show experiment screen for fixation
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        experimentScreen.classList.add('active');
        
        // Hide images and show fixation
        this.imageManager.hideImages(imageContainer);
        fixationCross.classList.add('active');
        
        // Disable MouseView during fixation so cross is fully visible
        try {
            if (typeof mouseview !== 'undefined' && mouseview.removeAll) {
                mouseview.removeAll();
            }
        } catch (error) {
            console.log('MouseView removeAll skipped during practice fixation');
        }
        
        // Wait for fixation duration
        await this.delay(this.fixationDuration);
        
        // Hide fixation
        fixationCross.classList.remove('active');
    }
    
    async showPracticeImages(trial) {
        console.log('=== SHOW PRACTICE IMAGES CALLED ===');
        const imageContainer = document.getElementById('image-container');
        
        // Configure MouseView for practice trial
        console.log('About to call configureMouseView for practice...');
        this.configureMouseView();
        console.log('Finished configureMouseView for practice.');
        
        // Display images first
        this.imageManager.displayImages(trial, imageContainer);
        
        // Start mouse tracking after images are displayed
        try {
            if (typeof mouseview !== 'undefined') {
                mouseview.startTracking();
            }
        } catch (error) {
            console.error('Error starting practice tracking:', error);
        }
        
        // Show countdown timer only if enabled
        if (this.experimentSettings && this.experimentSettings.showPracticeTimer) {
            this.showCountdown();
        }
        
        // Wait for trial duration
        await this.delay(this.trialDuration);
        
        // Hide images
        this.imageManager.hideImages(imageContainer);
        this.hideCountdown();
        
        // Practice indicator management is handled by experiment controller
    }
    
    showCountdown() {
        // Create countdown element
        let countdown = document.getElementById('practice-countdown');
        if (!countdown) {
            countdown = document.createElement('div');
            countdown.id = 'practice-countdown';
            countdown.style.cssText = `
                position: absolute;
                top: 60px;
                left: 20px;
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                font-size: 1.2em;
                z-index: 300;
                font-weight: bold;
                opacity: 1;
                pointer-events: none;
                display: block;
            `;
            document.getElementById('experiment-screen').appendChild(countdown);
        }
        
        // Ensure countdown is visible and start countdown
        countdown.style.display = 'block';
        let timeLeft = this.trialDuration / 1000;
        countdown.textContent = `Time: ${timeLeft}s`;
        
        const countdownInterval = setInterval(() => {
            timeLeft--;
            countdown.textContent = `Time: ${timeLeft}s`;
            
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);
        
        // Store interval ID for cleanup
        this.countdownInterval = countdownInterval;
    }
    
    hideCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        const countdown = document.getElementById('practice-countdown');
        if (countdown) {
            countdown.style.display = 'none';
        }
    }
    
    recordPracticeData(trial, startTime, endTime, mouseData) {
        const practiceRecord = {
            trial_idx: this.currentTrialIndex + 1,
            trial_type: 'practice',
            images: trial.images,
            positions: trial.positions,
            start_time: startTime,
            end_time: endTime,
            duration: endTime - startTime,
            mouse_data_points: mouseData ? mouseData.length : 0,
            timestamp: new Date().toISOString()
        };
        
        // Calculate basic performance metrics
        if (mouseData && mouseData.length > 0) {
            // Average mouse position
            practiceRecord.avg_mouse_x = mouseData.reduce((sum, p) => sum + p.x, 0) / mouseData.length;
            practiceRecord.avg_mouse_y = mouseData.reduce((sum, p) => sum + p.y, 0) / mouseData.length;
            
            // Movement smoothness (lower = smoother)
            let totalMovement = 0;
            for (let i = 1; i < mouseData.length; i++) {
                const dx = mouseData[i].x - mouseData[i-1].x;
                const dy = mouseData[i].y - mouseData[i-1].y;
                totalMovement += Math.sqrt(dx*dx + dy*dy);
            }
            practiceRecord.total_movement = totalMovement;
            practiceRecord.movement_smoothness = totalMovement / mouseData.length;
            
            // Time in each quadrant
            const quadrantTimes = this.calculateQuadrantTimes(mouseData);
            practiceRecord.time_top_left = quadrantTimes.topLeft;
            practiceRecord.time_top_right = quadrantTimes.topRight;
            practiceRecord.time_bottom_left = quadrantTimes.bottomLeft;
            practiceRecord.time_bottom_right = quadrantTimes.bottomRight;
        }
        
        this.practiceData.push(practiceRecord);
        console.log(`Practice trial ${practiceRecord.trial_idx} completed:`, practiceRecord);
    }
    
    calculateQuadrantTimes(mouseData) {
        if (!mouseData || mouseData.length === 0) {
            return { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 };
        }
        
        const quadrantTimes = { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 };
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        for (let i = 1; i < mouseData.length; i++) {
            const point = mouseData[i];
            const prevPoint = mouseData[i - 1];
            const timeDiff = point.relativeTime - prevPoint.relativeTime;
            
            if (point.x < centerX && point.y < centerY) {
                quadrantTimes.topLeft += timeDiff;
            } else if (point.x >= centerX && point.y < centerY) {
                quadrantTimes.topRight += timeDiff;
            } else if (point.x < centerX && point.y >= centerY) {
                quadrantTimes.bottomLeft += timeDiff;
            } else {
                quadrantTimes.bottomRight += timeDiff;
            }
        }
        
        return quadrantTimes;
    }
    
    updateProgress() {
        // Progress indicator setup is now handled by experiment controller
        // This method is kept for compatibility but doesn't need to do anything
        console.log('Practice progress updated');
    }
    
    async completePractice() {
        this.isPracticing = false;
        
        // Deactivate mouseView
        try {
            if (typeof mouseview !== 'undefined' && mouseview.removeAll) {
                mouseview.removeAll();
            }
        } catch (error) {
            console.log('MouseView removeAll skipped (nothing to remove)');
        }
        
        // Calculate overall practice performance
        const overallPerformance = this.assessPracticePerformance();
        
        // Store practice data in trial data instead
        console.log('Practice completed with performance:', overallPerformance);
        
        // Call completion callback directly (transition screen handles the rest)
        console.log('Practice completed, calling completion callback');
        
        if (this.onComplete) {
            this.onComplete(overallPerformance);
        }
        
        console.log('Practice completed:', overallPerformance);
    }
    
    assessPracticePerformance() {
        if (this.practiceData.length === 0) {
            return {
                trials_completed: 0,
                avg_movement_smoothness: 0,
                total_mouse_points: 0,
                performance_quality: 'no_data'
            };
        }
        
        const totalPoints = this.practiceData.reduce((sum, trial) => sum + trial.mouse_data_points, 0);
        const avgSmoothness = this.practiceData.reduce((sum, trial) => sum + (trial.movement_smoothness || 0), 0) / this.practiceData.length;
        
        let quality = 'good';
        if (totalPoints < 100) quality = 'poor';
        else if (avgSmoothness > 50) quality = 'fair';
        else if (avgSmoothness < 10) quality = 'excellent';
        
        return {
            trials_completed: this.practiceData.length,
            avg_movement_smoothness: Math.round(avgSmoothness * 100) / 100,
            total_mouse_points: totalPoints,
            performance_quality: quality
        };
    }
    
    skipPractice() {
        if (this.isPracticing) {
            this.isPracticing = false;
            try {
                if (typeof mouseview !== 'undefined' && mouseview.removeAll) {
                    mouseview.removeAll();
                }
            } catch (error) {
                console.log('MouseView removeAll skipped (nothing to remove)');
            }
            
            const skippedResults = {
                type: 'practice',
                trials_completed: 0,
                performance_quality: 'skipped',
                timestamp: new Date().toISOString(),
                skipped: true
            };
            
            console.log('Practice skipped:', skippedResults);
            
            if (this.onComplete) {
                this.onComplete(skippedResults);
            }
            
            console.log('Practice skipped');
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Configure MouseView ONLY for practice trials (matches main experiment settings)
    configureMouseView() {
        console.log('=== PRACTICE CONFIGURE MOUSEVIEW CALLED ===');
        try {
            console.log('MouseView available?', typeof mouseview !== 'undefined');
            if (typeof mouseview !== 'undefined') {
                console.log('MouseView object before config:', mouseview);
                console.log('Current params before config:', mouseview.params);
                
                console.log('Setting aperture to 12%...');
                mouseview.params.apertureSize = '12%'; // Consistent spotlight size for all trials
                mouseview.params.overlayAlpha = 0.85; // Consistent opacity for all trials
                mouseview.params.overlayColour = 'black'; // Consistent color for all trials
                mouseview.params.apertureGauss = 15; // Consistent edge smoothing for all trials
                
                console.log('Params after setting:', mouseview.params);
                console.log('Calling mouseview.init()...');
                mouseview.init();
                console.log('Params after init():', mouseview.params);
                console.log('MouseView configured for practice trial');
                
                // Additional debugging - check actual DOM elements
                setTimeout(() => {
                    const overlay = document.querySelector('#mouseview-overlay');
                    const aperture = document.querySelector('#mouseview-aperture');
                    console.log('=== PRACTICE DOM DEBUG ===');
                    console.log('Overlay element:', overlay);
                    console.log('Aperture element:', aperture);
                    if (overlay) {
                        console.log('Overlay style:', overlay.style.cssText);
                    }
                    if (aperture) {
                        console.log('Aperture style:', aperture.style.cssText);
                    }
                    console.log('=== END PRACTICE DOM DEBUG ===');
                }, 100);
                
                console.log('=== PRACTICE MOUSEVIEW DEBUG ===');
                console.log('Practice aperture size:', mouseview.params.apertureSize);
                console.log('Practice overlay alpha:', mouseview.params.overlayAlpha);
                console.log('=== END PRACTICE DEBUG ===');
            } else {
                console.error('MouseView is undefined in practice!');
            }
        } catch (error) {
            console.error('Error configuring MouseView:', error);
            console.error('Error stack:', error.stack);
        }
        console.log('=== END PRACTICE CONFIGURE MOUSEVIEW ===');
    }
    
    getPracticeData() {
        return this.practiceData;
    }
    
    isPracticeComplete() {
        return this.practiceData.length >= this.practiceTrials.length;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PracticeManager;
} else if (typeof window !== 'undefined') {
    window.PracticeManager = PracticeManager;
}