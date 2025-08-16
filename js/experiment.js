/**
 * ExperimentController - Main controller for the Images Free Viewing experiment
 * Orchestrates all components and manages experiment flow
 */

class ExperimentController {
    constructor() {
        this.currentState = 'welcome';
        
        // 3-Round System State
        this.totalRounds = 3;
        this.currentRound = 1;
        this.trialsPerRound = 20;
        this.imageTrialsPerRound = 12;
        this.fillerTrialsPerRound = 8;
        
        // Trial Counters
        this.roundTrialCounter = 0;     // 1-20 within current round
        this.globalTrialCounter = 0;    // 1-60 overall
        this.usedImages = new Set();     // Global image uniqueness tracking
        
        // Timing
        this.roundStartTime = null;
        
        // Password protection state
        this.pendingRound = null;
        
        // Legacy counters (to be removed eventually)
        this.currentTrial = 0;
        this.maxTrials = 12;
        this.fillerTrialCounter = 0;
        this.globalTrialNumber = 0;
        this.imageTrialCounter = 0;
        
        // Initialize components
        this.mouseView = null;
        this.imageManager = null;
        this.dataManager = null;
        
        // Experiment settings
        this.settings = {
            imageViewingTime: 15000, // 15 seconds automatic progression
            enableMouseTracking: true,
            enablePractice: false,  // DISABLED - No practice round
            showTimer: false, // Hide timer during main trials
            apertureSize: '20%' // Aperture size for mouse spotlight (increased from 12%)
        };
        
        // State tracking
        this.experimentStarted = false;
        this.isExperimentRunning = false;
        this.currentTrialData = null;
        this.currentMouseData = [];
        
        console.log('ExperimentController initialized');
    }
    
    async init() {
        try {
            // Initialize components
            this.initializeComponents();
            
            // Set up event listeners
            this.bindEvents();
            
            // Initialize first screen
            this.showScreen('welcome');
            
            console.log('Experiment controller ready');
        } catch (error) {
            console.error('Failed to initialize experiment:', error);
            this.showError('Failed to initialize experiment. Please refresh the page.');
        }
    }
    
    initializeComponents() {
        // Initialize managers (removed practice manager)
        console.log('🔄 Creating ImageManager instance...');
        this.imageManager = new ImageManager();
        console.log('✅ ImageManager created:', this.imageManager);
        console.log('🔍 Checking for initializeDynamicPositioning method:', typeof this.imageManager.initializeDynamicPositioning);
        
        this.dataManager = new DataManager();
        
        // Initialize dynamic positioning system
        console.log('🚀 Calling initializeDynamicPositioning...');
        this.imageManager.initializeDynamicPositioning();
        
        // Expose imageManager globally for testing
        window.imageManager = this.imageManager;
        
        console.log('All components initialized - MouseView.js will be activated during trials');
        console.log('3-Round System: Practice disabled, direct to experiment');
        console.log('Dynamic positioning system activated for responsive image layout');
        console.log('Test dynamic positioning: window.imageManager.testDynamicPositioning()');
    }
    
    bindEvents() {
        // Welcome screen events
        const startBtn = document.getElementById('start-experiment');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.handleStartExperiment());
        }
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Participant form events
        const participantForm = document.getElementById('participant-form');
        if (participantForm) {
            participantForm.addEventListener('submit', (e) => this.handleParticipantForm(e));
        }
        
        
        // Continue trial button
        const continueTrialBtn = document.getElementById('continue-trial');
        if (continueTrialBtn) {
            continueTrialBtn.addEventListener('click', () => this.continueToNextTrial());
        }
        
        // Download buttons
        const downloadTrialBtn = document.getElementById('download-trial-data');
        const downloadMouseBtn = document.getElementById('download-mouse-data');
        const downloadParticipantBtn = document.getElementById('download-participant-info');
        const downloadTrialHeatmapsBtn = document.getElementById('download-trial-heatmaps');
        const restartBtn = document.getElementById('restart-experiment');
        
        if (downloadTrialBtn) {
            downloadTrialBtn.addEventListener('click', () => this.dataManager.exportTrialData());
        }
        if (downloadMouseBtn) {
            downloadMouseBtn.addEventListener('click', () => this.dataManager.exportMouseData());
        }
        if (downloadParticipantBtn) {
            downloadParticipantBtn.addEventListener('click', () => this.dataManager.exportParticipantInfo());
        }
        if (downloadTrialHeatmapsBtn) {
            downloadTrialHeatmapsBtn.addEventListener('click', () => this.generateTrialHeatmaps());
        }
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartExperiment());
        }
        
        
        // Inter-round progression buttons
        const proceedRound2Btn = document.getElementById('proceed-round2');
        const proceedRound3Btn = document.getElementById('proceed-round3');
        const startRound2Btn = document.getElementById('start-round2');
        const startRound3Btn = document.getElementById('start-round3');
        
        if (proceedRound2Btn) {
            proceedRound2Btn.addEventListener('click', () => this.showRoundInstructions(2));
        }
        if (proceedRound3Btn) {
            proceedRound3Btn.addEventListener('click', () => this.showRoundInstructions(3));
        }
        if (startRound2Btn) {
            startRound2Btn.addEventListener('click', () => this.showPasswordScreen(2));
        }
        if (startRound3Btn) {
            startRound3Btn.addEventListener('click', () => this.showPasswordScreen(3));
        }
        
        // Round 2 password events
        const round2PasswordSubmitBtn = document.getElementById('round2-password-submit');
        const round2PasswordCancelBtn = document.getElementById('round2-password-cancel');
        const round2PasswordInput = document.getElementById('round2-password-input');
        
        if (round2PasswordSubmitBtn) {
            round2PasswordSubmitBtn.addEventListener('click', () => this.handlePasswordSubmit(2));
        }
        if (round2PasswordCancelBtn) {
            round2PasswordCancelBtn.addEventListener('click', () => this.showRoundInstructions(2));
        }
        if (round2PasswordInput) {
            round2PasswordInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handlePasswordSubmit(2);
                }
            });
        }
        
        // Round 3 password events
        const round3PasswordSubmitBtn = document.getElementById('round3-password-submit');
        const round3PasswordCancelBtn = document.getElementById('round3-password-cancel');
        const round3PasswordInput = document.getElementById('round3-password-input');
        
        if (round3PasswordSubmitBtn) {
            round3PasswordSubmitBtn.addEventListener('click', () => this.handlePasswordSubmit(3));
        }
        if (round3PasswordCancelBtn) {
            round3PasswordCancelBtn.addEventListener('click', () => this.showRoundInstructions(3));
        }
        if (round3PasswordInput) {
            round3PasswordInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handlePasswordSubmit(3);
                }
            });
        }
        
        console.log('Event listeners bound (including inter-round buttons)');
    }
    
    async handleStartExperiment() {
        this.showScreen('participant');
    }
    
    async handleParticipantForm(event) {
        event.preventDefault();
        
        const participantId = document.getElementById('participant-id').value;
        const participantEmail = document.getElementById('participant-email').value;
        const session = document.getElementById('session').value;
        
        if (!participantId.trim()) {
            alert('Please enter a participant ID');
            return;
        }
        
        if (!participantEmail.trim()) {
            alert('Please enter an email address');
            return;
        }
        
        // Set participant data
        this.dataManager.setParticipantInfo(participantId, session, participantEmail);
        
        // Start loading images
        await this.loadImages();
    }
    
    async loadImages() {
        this.showScreen('loading');
        this.updateLoadingMessage('Loading experiment configuration...');
        
        try {
            // Load configuration
            const configLoaded = await this.imageManager.loadConfig();
            if (!configLoaded) {
                throw new Error('Failed to load experiment configuration');
            }
            
            // Settings are now hardcoded in constructor for 3-round system
            // No config-based settings update needed with new-data.json structure
            console.log('3-Round experiment settings:');
            console.log('- Image viewing time:', this.settings.imageViewingTime, 'ms');
            console.log('- Rounds:', this.totalRounds);
            console.log('- Trials per round:', this.trialsPerRound);
            
            // Preload images
            this.updateLoadingMessage('Loading images...');
            const imagesLoaded = await this.imageManager.preloadAllImages(
                (loaded, total, imagePath) => {
                    this.updateLoadingMessage(`Loading images... ${loaded}/${total}`);
                }
            );
            
            if (!imagesLoaded) {
                throw new Error('Failed to load all images');
            }
            
            // Wait for loading screen to fully disappear before starting
            this.updateLoadingMessage('Ready!');
            await this.delay(500); // Give loading screen time to show "Ready!" 
            
            // Start 3-round experiment system
            console.log('Config loaded, starting 3-round experiment...');
            await this.startRound(1);
            
        } catch (error) {
            console.error('Error during loading:', error);
            this.showError('Failed to load experiment data. Please check the image files and try again.');
        }
    }
    
    updateLoadingMessage(message) {
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
    }
    
    
    
    async showMainStartButton() {
        const mainStartButton = document.getElementById('main-start-button');
        const imageContainer = document.getElementById('image-container');
        
        // Hide images
        this.imageManager.hideImages(imageContainer);
        
        // Disable MouseView during button display
        try {
            if (typeof mouseview !== 'undefined' && mouseview.removeAll) {
                mouseview.removeAll();
            }
        } catch (error) {
            console.log('MouseView removeAll skipped during main start button');
        }
        
        // Show main start button and wait for click
        if (mainStartButton) {
            mainStartButton.style.display = 'block';
            
            return new Promise((resolve) => {
                const startButton = mainStartButton.querySelector('.start-button');
                
                const handleClick = () => {
                    mainStartButton.style.display = 'none';
                    startButton.removeEventListener('click', handleClick);
                    resolve();
                };
                
                startButton.addEventListener('click', handleClick);
            });
        }
    }

    async showNextTrialButton() {
        const nextTrialButton = document.getElementById('next-trial-button');
        const imageContainer = document.getElementById('image-container');
        
        // Hide images
        this.imageManager.hideImages(imageContainer);
        
        // Disable MouseView during button display
        try {
            if (typeof mouseview !== 'undefined' && mouseview.removeAll) {
                mouseview.removeAll();
            }
        } catch (error) {
            console.log('MouseView removeAll skipped during next trial button');
        }
        
        // Show next trial button and wait for click
        if (nextTrialButton) {
            nextTrialButton.style.display = 'block';
            
            return new Promise((resolve) => {
                const nextButton = nextTrialButton.querySelector('.next-button');
                
                const handleClick = () => {
                    nextTrialButton.style.display = 'none';
                    nextButton.removeEventListener('click', handleClick);
                    resolve();
                };
                
                nextButton.addEventListener('click', handleClick);
            });
        }
    }

    
    
    async waitForUserProgression() {
        const continueBtn = document.getElementById('continue-trial');
        
        return new Promise((resolve) => {
            // Show continue button
            continueBtn.style.display = 'block';
            
            const handleContinue = () => {
                continueBtn.style.display = 'none';
                continueBtn.removeEventListener('click', handleContinue);
                resolve();
            };
            
            const handleKeyPress = (e) => {
                if (e.code === 'Space' || e.code === 'Enter') {
                    e.preventDefault();
                    continueBtn.style.display = 'none';
                    document.removeEventListener('keydown', handleKeyPress);
                    resolve();
                }
            };
            
            continueBtn.addEventListener('click', handleContinue);
            document.addEventListener('keydown', handleKeyPress);
        });
    }
    
    continueToNextTrial() {
        const continueBtn = document.getElementById('continue-trial');
        continueBtn.style.display = 'none';
        
        // This will be handled by the promise in waitForUserProgression
    }
    
    
    async finishExperiment() {
        this.isExperimentRunning = false;
        
        // Clean up any running timers
        this.hideTrialCountdown();
        
        // Deactivate mouse tracking
        try {
            if (typeof mouseview !== 'undefined' && mouseview.removeAll) {
                mouseview.removeAll();
            }
        } catch (error) {
            console.log('MouseView removeAll skipped during finish (error):', error.message);
        }
        
        // Clean up experiment state (cursor was never hidden)
        // document.body.classList.remove('experiment-active'); // Not needed anymore
        
        // Show end screen
        this.showScreen('end');
        
        // Auto-download data (no automatic heatmap)
        setTimeout(() => {
            this.dataManager.exportAllData();
        }, 1000);
        
        console.log('Experiment completed');
        console.log('Summary:', this.dataManager.getSummaryStats());
    }
    
    restartExperiment() {
        // Reset 3-round system state
        this.currentRound = 1;
        this.roundTrialCounter = 0;
        this.globalTrialCounter = 0;
        this.usedImages.clear();
        this.roundStartTime = null;
        
        // Reset legacy state
        this.currentState = 'welcome';
        this.currentTrial = 0;
        this.fillerTrialCounter = 0;
        this.globalTrialNumber = 0;
        this.imageTrialCounter = 0;
        this.experimentStarted = false;
        this.isExperimentRunning = false;
        
        // Clear data
        this.dataManager.clearData();
        
        // Reset UI (cursor was never hidden)
        // document.body.classList.remove('experiment-active'); // Not needed anymore
        try {
            if (typeof mouseview !== 'undefined' && mouseview.removeAll) {
                mouseview.removeAll();
            }
        } catch (error) {
            console.log('MouseView removeAll skipped during restart (error):', error.message);
        }
        
        // Show welcome screen
        this.showScreen('welcome');
        
        console.log('Experiment restarted');
    }
    
    handleKeyPress(event) {
        switch (event.code) {
            case 'Space':
                if (this.currentState === 'welcome') {
                    event.preventDefault();
                    this.handleStartExperiment();
                } else if (this.currentState === 'experiment') {
                    // Handle space bar for trial progression
                    const continueBtn = document.getElementById('continue-trial');
                    if (continueBtn.style.display === 'block') {
                        event.preventDefault();
                        this.continueToNextTrial();
                    }
                }
                break;
                
            case 'Escape':
                if (this.isExperimentRunning) {
                    if (confirm('Are you sure you want to exit the experiment?')) {
                        this.emergencyExit();
                    }
                }
                break;
                
        }
    }
    
    emergencyExit() {
        this.isExperimentRunning = false;
        try {
            if (typeof mouseview !== 'undefined' && mouseview.removeAll) {
                mouseview.removeAll();
            }
        } catch (error) {
            console.log('MouseView removeAll skipped during emergency exit (error):', error.message);
        }
        // document.body.classList.remove('experiment-active'); // Not needed anymore
        
        // Clean up any running timers
        this.hideTrialCountdown();
        
        // Try to save partial data
        if (this.dataManager.getTrialData().length > 0) {
            this.dataManager.exportAllData();
        }
        
        this.showScreen('end');
        console.log('Emergency exit - partial data saved');
    }
    
    
    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Deactivate MouseView for all screens except during actual trials
        // MouseView should only be active during 'experiment' screen trials
        if (screenName !== 'experiment') {
            try {
                if (typeof mouseview !== 'undefined' && mouseview.removeAll) {
                    mouseview.removeAll();
                }
            } catch (error) {
                // Ignore errors when nothing to remove during initialization
                console.log('MouseView removeAll skipped (nothing to remove)');
            }
        }
        
        
        // Show target screen
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentState = screenName;
        }
        
        console.log(`Showing screen: ${screenName}`);
    }
    
    showError(message) {
        alert(message); // Simple error display - could be enhanced with a modal
        console.error('Experiment error:', message);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    showTrialCountdown() {
        // Create countdown element for main trials
        let countdown = document.getElementById('trial-countdown');
        if (!countdown) {
            countdown = document.createElement('div');
            countdown.id = 'trial-countdown';
            countdown.style.cssText = `
                position: absolute;
                top: 20px;
                left: 20px;
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                font-size: 1.2em;
                z-index: 200;
                font-weight: bold;
                opacity: 1;
                pointer-events: none;
            `;
            document.getElementById('experiment-screen').appendChild(countdown);
        }
        
        // Start countdown
        let timeLeft = this.settings.imageViewingTime / 1000;
        countdown.textContent = `Time: ${timeLeft}s`;
        countdown.style.display = 'block';
        
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
    
    hideTrialCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        const countdown = document.getElementById('trial-countdown');
        if (countdown) {
            countdown.style.display = 'none';
        }
    }
    
    // Public API methods for external control
    
    getCurrentState() {
        return this.currentState;
    }
    
    getCurrentTrial() {
        return this.currentTrial;
    }
    
    isRunning() {
        return this.isExperimentRunning;
    }
    
    getDataManager() {
        return this.dataManager;
    }
    
    getMouseView() {
        return this.mouseView;
    }
    
    getImageManager() {
        return this.imageManager;
    }
    
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        console.log('Settings updated:', this.settings);
    }

    // Configure MouseView ONLY for image viewing trials
    async configureMouseView() {
        console.log('=== MAIN CONFIGURE MOUSEVIEW CALLED ===');
        try {
            console.log('MouseView available?', typeof mouseview !== 'undefined');
            if (typeof mouseview !== 'undefined') {
                console.log('MouseView object before config:', mouseview);
                console.log('Current params before config:', mouseview.params);
                
                console.log(`Setting aperture to ${this.settings.apertureSize}...`);
                mouseview.params.apertureSize = this.settings.apertureSize; // Configurable spotlight size
                mouseview.params.overlayAlpha = 0.85; // Consistent opacity for all trials
                mouseview.params.overlayColour = 'black'; // Consistent color for all trials
                mouseview.params.apertureGauss = 15; // Consistent edge smoothing for all trials
                
                console.log('Params after setting:', mouseview.params);
                console.log('Calling mouseview.init()...');
                mouseview.init();
                console.log('Params after init():', mouseview.params);
                
                // Wait for MouseView overlay to be ready before continuing
                await this.waitForMouseViewReady();
                
                console.log('MouseView configured and ready for trial');
                
                console.log('=== MAIN TRIAL MOUSEVIEW DEBUG ===');
                console.log('Main trial aperture size:', mouseview.params.apertureSize);
                console.log('Main trial overlay alpha:', mouseview.params.overlayAlpha);
                console.log('=== END MAIN TRIAL DEBUG ===');
            } else {
                console.error('MouseView is undefined in main trial!');
            }
        } catch (error) {
            console.error('Error configuring MouseView:', error);
            console.error('Error stack:', error.stack);
        }
        console.log('=== END MAIN CONFIGURE MOUSEVIEW ===');
    }

    // Wait for MouseView overlay to be ready and visible
    async waitForMouseViewReady() {
        return new Promise((resolve) => {
            const checkOverlay = () => {
                const overlay = document.querySelector('#mouseview-overlay') || 
                               document.querySelector('.mouseview-overlay');
                
                console.log('Checking MouseView overlay readiness...');
                
                if (overlay) {
                    console.log('Overlay found:', overlay);
                    console.log('Overlay style:', overlay.style.cssText);
                    console.log('Overlay opacity:', overlay.style.opacity);
                    
                    // Consider overlay ready if it exists and has been initialized
                    resolve();
                } else {
                    console.log('Overlay not ready, checking again in 50ms...');
                    setTimeout(checkOverlay, 50);
                }
            };
            checkOverlay();
        });
    }


    async generateTrialHeatmaps() {
        console.log('Starting trial heatmap generation...');
        
        // Debug: Check total trials before generation
        const totalDataTrials = this.dataManager.getTrialData().length;
        console.log(`=== HEATMAP GENERATION DEBUG ===`);
        console.log('Total trials in data manager:', totalDataTrials);
        console.log('Global trial number reached:', this.globalTrialNumber);
        console.log('Image trials completed:', this.imageTrialCounter);
        console.log('Filler trials completed:', this.fillerTrialCounter);
        console.log('Expected total (should be 20):', this.imageTrialCounter + this.fillerTrialCounter);
        console.log('=== END HEATMAP GENERATION DEBUG ===');
        
        // Show progress UI
        const progressDiv = document.getElementById('heatmap-progress');
        const progressText = document.getElementById('heatmap-progress-text');
        const progressBar = document.getElementById('heatmap-progress-bar');
        const downloadBtn = document.getElementById('download-trial-heatmaps');
        
        if (progressDiv && downloadBtn) {
            progressDiv.style.display = 'block';
            downloadBtn.disabled = true;
            downloadBtn.textContent = 'Generating...';
        }
        
        try {
            const result = await this.dataManager.generateAllTrialHeatmaps(
                (current, total, message) => {
                    // Update progress
                    const percent = Math.round((current / total) * 100);
                    if (progressText) {
                        progressText.textContent = message || `Generating heatmap ${current} of ${total}...`;
                    }
                    if (progressBar) {
                        progressBar.style.width = `${percent}%`;
                    }
                }
            );
            
            // Show completion message
            if (progressText) {
                progressText.textContent = `✓ Generated ${result.success} heatmaps successfully!`;
            }
            if (progressBar) {
                progressBar.style.width = '100%';
            }
            
            console.log('Trial heatmap generation completed:', result);
            
            // Hide progress after delay
            setTimeout(() => {
                if (progressDiv) {
                    progressDiv.style.display = 'none';
                }
            }, 3000);
            
        } catch (error) {
            console.error('Error generating trial heatmaps:', error);
            
            if (progressText) {
                progressText.textContent = '✗ Error generating heatmaps. Check console for details.';
            }
            
            // Hide progress after delay
            setTimeout(() => {
                if (progressDiv) {
                    progressDiv.style.display = 'none';
                }
            }, 5000);
        } finally {
            // Re-enable button
            if (downloadBtn) {
                downloadBtn.disabled = false;
                downloadBtn.textContent = 'Download Trial Heatmaps (ZIP)';
            }
        }
    }

    // ====== NEW 3-ROUND SYSTEM METHODS ======

    async startRound(roundNumber) {
        console.log(`=== Starting Round ${roundNumber} of ${this.totalRounds} ===`);
        
        this.currentRound = roundNumber;
        this.roundTrialCounter = 0;
        this.roundStartTime = performance.now();
        
        // Initialize experiment data collection on first round
        if (roundNumber === 1) {
            this.experimentStarted = true;
            this.isExperimentRunning = true;
            this.dataManager.startExperiment();
        }
        
        // Show experiment screen
        this.showScreen('experiment');
        
        // Configure progress display
        this.setupRoundUI();
        
        // Configure MouseView for trials
        await this.configureMouseView();
        
        console.log(`Round ${roundNumber} setup complete, starting trials...`);
        await this.runRoundTrials();
    }

    setupRoundUI() {
        // Hide practice indicators
        const practiceIndicator = document.getElementById('practice-indicator');
        if (practiceIndicator) {
            practiceIndicator.style.display = 'none';
        }
        
        
        // Log progress to console
        this.logRoundProgress();
    }

    async runRoundTrials() {
        console.log(`Running ${this.trialsPerRound} trials for Round ${this.currentRound}...`);
        
        // Generate trial pattern for this round (12 image + 8 filler, randomized)
        const trialPattern = this.generateTrialPattern();
        console.log('Trial pattern for round:', trialPattern);
        
        // Run all trials in the round
        for (let i = 0; i < this.trialsPerRound; i++) {
            if (!this.isExperimentRunning) {
                console.log('Experiment stopped, breaking trial loop');
                break;
            }
            
            this.roundTrialCounter++;
            this.globalTrialCounter++;
            
            const trialType = trialPattern[i];
            console.log(`Round ${this.currentRound}, Trial ${this.roundTrialCounter}: ${trialType}`);
            
            try {
                await this.runSingleTrial(trialType);
            } catch (error) {
                console.error(`Error in Round ${this.currentRound}, Trial ${this.roundTrialCounter}:`, error);
                // Continue with next trial
            }
            
            // Log progress
            this.logRoundProgress();
            
            // Brief inter-trial interval
            await this.delay(250);
        }
        
        console.log(`Round ${this.currentRound} trials completed`);
        await this.completeRound();
    }

    async runSingleTrial(trialType) {
        console.log(`=== Single Trial: ${trialType} (Round ${this.currentRound}, Trial ${this.roundTrialCounter}) ===`);
        
        // Show start/next button
        if (this.globalTrialCounter === 1) {
            await this.showMainStartButton();
        } else {
            await this.showNextTrialButton();
        }
        
        // Start trial data collection
        const trialInfo = this.dataManager.startTrial(this.globalTrialCounter - 1, trialType);
        trialInfo.roundNumber = this.currentRound;
        trialInfo.roundTrialIndex = this.roundTrialCounter;
        
        // Log trial start event
        try {
            if (typeof mouseview !== 'undefined') {
                mouseview.logEvent(`trial_start_R${this.currentRound}T${this.roundTrialCounter}_${trialType}`);
            }
        } catch (error) {
            console.log('Event logging not available:', error);
        }
        
        // Get images for this trial using new selection system
        let imageData;
        try {
            imageData = this.imageManager.selectImagesForTrial(trialType, this.usedImages);
            console.log(`Selected images for ${trialType} trial:`, imageData);
        } catch (error) {
            console.error('Error selecting images:', error);
            throw error; // Don't continue trial if image selection fails
        }
        
        // Configure MouseView and start tracking
        try {
            this.configureMouseView();
            if (typeof mouseview !== 'undefined') {
                mouseview.startTracking();
            }
        } catch (error) {
            console.error('Error starting mouse tracking:', error);
        }
        
        // Display images
        const imageContainer = document.getElementById('image-container');
        try {
            this.imageManager.displayImages(imageData, imageContainer);
            
            // Log images displayed event with image categories
            if (typeof mouseview !== 'undefined') {
                const imageList = trialType === 'image' 
                    ? `${imageData.dysphoric},${imageData.threat},${imageData.positive},${imageData.filler}`
                    : `${imageData.filler1},${imageData.filler2},${imageData.filler3},${imageData.filler4}`;
                mouseview.logEvent(`images_displayed_${imageList}`);
            }
        } catch (error) {
            console.error('Error displaying images:', error);
        }
        
        // Show countdown and wait for viewing time
        if (this.settings.imageViewingTime > 0) {
            if (this.settings.showTimer) {
                this.showTrialCountdown();
            }
            await this.delay(this.settings.imageViewingTime);
            this.hideTrialCountdown();
        }
        
        // Log trial end event before stopping tracking
        try {
            if (typeof mouseview !== 'undefined') {
                mouseview.logEvent(`trial_end_R${this.currentRound}T${this.roundTrialCounter}`);
            }
        } catch (error) {
            console.log('Event logging not available:', error);
        }
        
        // Stop tracking and collect current session mouse data
        let mouseData = [];
        try {
            if (typeof mouseview !== 'undefined') {
                mouseview.stopTracking();
                // Access current session data directly (not stored localStorage data)
                mouseData = mouseview.datalogger?.data || [];
                if (mouseview.datalogger) {
                    mouseview.datalogger.data = []; // Clear for next trial
                }
            }
        } catch (error) {
            console.error('Error collecting mouse data:', error);
        }
        
        // Record trial data BEFORE hiding images (so image bounds are still available)
        this.dataManager.recordTrialData(trialInfo, imageData, mouseData);
        this.dataManager.recordMouseData(mouseData, this.globalTrialCounter - 1, trialType, this.currentRound, this.roundTrialCounter, trialInfo.startTime);
        
        // Hide images AFTER recording data
        this.imageManager.hideImages(imageContainer);
        
        console.log(`Trial ${this.roundTrialCounter} of Round ${this.currentRound} completed`);
    }

    async completeRound() {
        console.log(`=== Round ${this.currentRound} Complete ===`);
        
        const roundElapsed = this.getRoundElapsedTime();
        console.log(`Round ${this.currentRound} took ${this.formatTime(roundElapsed)}`);
        
        if (this.currentRound < this.totalRounds) {
            // More rounds to go - show inter-round screen
            console.log(`Showing inter-round screen for Round ${this.currentRound} → ${this.currentRound + 1}`);
            this.showInterRoundScreen();
        } else {
            // All rounds complete - finish experiment
            console.log('All rounds completed, finishing experiment');
            await this.finishAllRounds();
        }
    }

    showInterRoundScreen() {
        const roundElapsed = this.getRoundElapsedTime();
        
        // Show the appropriate inter-round screen
        this.showScreen(`round${this.currentRound}-complete`);
        
        console.log(`Inter-round screen displayed for Round ${this.currentRound}`);
        console.log(`Round ${this.currentRound} completed: ${this.trialsPerRound} trials in ${this.formatTime(roundElapsed)}`);
    }

    async proceedToNextRound() {
        console.log(`Proceeding from Round ${this.currentRound} to Round ${this.currentRound + 1}`);
        
        const nextRound = this.currentRound + 1;
        if (nextRound <= this.totalRounds) {
            // Show instructions first instead of starting round directly
            this.showRoundInstructions(nextRound);
        } else {
            console.error('Attempted to proceed beyond final round');
            await this.finishAllRounds();
        }
    }
    
    /**
     * Show instruction screen for the specified round
     */
    showRoundInstructions(roundNumber) {
        console.log(`Showing instructions for Round ${roundNumber}`);
        
        if (roundNumber === 2) {
            this.showScreen('round2-instructions');
        } else if (roundNumber === 3) {
            this.showScreen('round3-instructions');
        } else {
            console.error(`Invalid round number for instructions: ${roundNumber}`);
            // Fallback to starting round directly
            this.startRoundAfterInstructions(roundNumber);
        }
    }
    
    /**
     * Start the specified round after instructions have been shown
     */
    async startRoundAfterInstructions(roundNumber) {
        console.log(`Starting Round ${roundNumber} after instructions`);
        await this.startRound(roundNumber);
    }
    
    /**
     * Show password screen for the specified round
     */
    showPasswordScreen(roundNumber) {
        console.log(`Showing password screen for Round ${roundNumber}`);
        
        if (roundNumber === 2) {
            this.showScreen('round2-password');
            
            // Focus password input
            setTimeout(() => {
                const input = document.getElementById('round2-password-input');
                if (input) {
                    input.focus();
                }
            }, 100);
        } else if (roundNumber === 3) {
            this.showScreen('round3-password');
            
            // Focus password input
            setTimeout(() => {
                const input = document.getElementById('round3-password-input');
                if (input) {
                    input.focus();
                }
            }, 100);
        } else {
            console.error(`Invalid round number for password screen: ${roundNumber}`);
            // Fallback to starting round directly
            this.startRoundAfterInstructions(roundNumber);
        }
    }
    
    /**
     * Handle password submission for specific round
     */
    handlePasswordSubmit(roundNumber) {
        const inputId = `round${roundNumber}-password-input`;
        const errorId = `round${roundNumber}-password-error`;
        
        const input = document.getElementById(inputId);
        const errorDiv = document.getElementById(errorId);
        
        if (!input) {
            console.error(`Password input not found for Round ${roundNumber}`);
            return;
        }
        
        const enteredPassword = input.value.trim();
        const correctPassword = 'ctsfreeviewing';
        
        if (enteredPassword === correctPassword) {
            console.log(`Password correct for Round ${roundNumber}`);
            
            // Clear input and error
            input.value = '';
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
            
            // Start the round
            this.startRoundAfterInstructions(roundNumber);
        } else {
            console.log(`Incorrect password entered for Round ${roundNumber}`);
            
            // Show error message
            if (errorDiv) {
                errorDiv.style.display = 'block';
            }
            
            // Clear input and refocus
            input.value = '';
            input.focus();
            
            // Hide error after 3 seconds
            setTimeout(() => {
                if (errorDiv) {
                    errorDiv.style.display = 'none';
                }
            }, 3000);
        }
    }

    async finishAllRounds() {
        console.log('=== All 3 Rounds Complete ===');
        
        this.isExperimentRunning = false;
        
        // Clean up any running timers
        this.hideTrialCountdown();
        
        // Deactivate mouse tracking
        try {
            if (typeof mouseview !== 'undefined' && mouseview.removeAll) {
                mouseview.removeAll();
            }
        } catch (error) {
            console.log('MouseView cleanup completed with minor error:', error.message);
        }
        
        // Calculate total experiment time for console logging
        const totalTime = this.globalTrialCounter > 0 ? 
            (performance.now() - this.dataManager.experimentStartTime) / 1000 : 0;
        
        // Show end screen with manual download options
        this.showScreen('end');
        
        console.log('3-Round experiment completed successfully!');
        console.log('Final stats:');
        console.log(`- Total trials: ${this.globalTrialCounter}`);
        console.log(`- Total time: ${this.formatTime(totalTime)}`);
        console.log(`- Data summary:`, this.dataManager.getSummaryStats?.() || 'N/A');
    }

    generateTrialPattern() {
        // Create array with 12 'image' and 8 'filler' trials, then shuffle
        const pattern = [];
        for (let i = 0; i < this.imageTrialsPerRound; i++) {
            pattern.push('image');
        }
        for (let i = 0; i < this.fillerTrialsPerRound; i++) {
            pattern.push('filler');
        }
        this.shuffleArray(pattern);
        return pattern;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    logRoundProgress() {
        console.log(`Round ${this.currentRound}/${this.totalRounds}, Trial ${this.roundTrialCounter}/${this.trialsPerRound}, Global: ${this.globalTrialCounter}`);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    getRoundElapsedTime() {
        if (!this.roundStartTime) return 0;
        return (performance.now() - this.roundStartTime) / 1000;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExperimentController;
} else if (typeof window !== 'undefined') {
    window.ExperimentController = ExperimentController;
}