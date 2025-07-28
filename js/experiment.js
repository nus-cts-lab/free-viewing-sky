/**
 * ExperimentController - Main controller for the Images Free Viewing experiment
 * Orchestrates all components and manages experiment flow
 */

class ExperimentController {
    constructor() {
        this.currentState = 'welcome';
        this.currentTrial = 0;
        this.maxTrials = 12;
        this.fillerTrialCounter = 0;
        this.globalTrialNumber = 0; // Tracks total trial number including fillers
        this.imageTrialCounter = 0; // Tracks image trials separately
        
        // Initialize components
        this.mouseView = null;
        this.imageManager = null;
        this.dataManager = null;
        this.practiceManager = null;
        
        // Experiment settings
        this.settings = {
            fixationDuration: 2000, // ms (2 seconds)
            imageViewingTime: 15000, // 15 seconds automatic progression
            enableMouseTracking: true,
            enablePractice: true,
            debug: false
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

        // Initialize managers
        this.imageManager = new ImageManager();
        this.dataManager = new DataManager();
        this.practiceManager = new PracticeManager(this.dataManager, this.imageManager);
        
        console.log('All components initialized - MouseView.js will be activated during trials');
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
        
        // Skip practice button
        const skipPracticeBtn = document.getElementById('skip-practice');
        if (skipPracticeBtn) {
            skipPracticeBtn.addEventListener('click', () => this.skipPractice());
        }
        
        // Continue trial button
        const continueTrialBtn = document.getElementById('continue-trial');
        if (continueTrialBtn) {
            continueTrialBtn.addEventListener('click', () => this.continueToNextTrial());
        }
        
        // Download buttons
        const downloadTrialBtn = document.getElementById('download-trial-data');
        const downloadMouseBtn = document.getElementById('download-mouse-data');
        const downloadTrialHeatmapsBtn = document.getElementById('download-trial-heatmaps');
        const restartBtn = document.getElementById('restart-experiment');
        
        if (downloadTrialBtn) {
            downloadTrialBtn.addEventListener('click', () => this.dataManager.exportTrialData());
        }
        if (downloadMouseBtn) {
            downloadMouseBtn.addEventListener('click', () => this.dataManager.exportMouseData());
        }
        if (downloadTrialHeatmapsBtn) {
            downloadTrialHeatmapsBtn.addEventListener('click', () => this.generateTrialHeatmaps());
        }
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartExperiment());
        }
        
        // Transition screen button
        const startMainBtn = document.getElementById('start-main-experiment');
        if (startMainBtn) {
            startMainBtn.addEventListener('click', () => this.startMainExperiment());
        }
        
        console.log('Event listeners bound');
    }
    
    async handleStartExperiment() {
        this.showScreen('participant');
    }
    
    async handleParticipantForm(event) {
        event.preventDefault();
        
        const participantId = document.getElementById('participant-id').value;
        const session = document.getElementById('session').value;
        
        if (!participantId.trim()) {
            alert('Please enter a participant ID');
            return;
        }
        
        // Set participant data
        this.dataManager.setParticipantInfo(participantId, session);
        
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
            
            // Update settings from config
            if (this.imageManager.config && this.imageManager.config.config) {
                this.settings.imageViewingTime = this.imageManager.config.config.imageViewingTime;
                this.settings.fixationDuration = this.imageManager.config.config.fixationDuration;
                this.maxTrials = this.imageManager.config.config.numImageTrials || 12;
                console.log('Updated experiment settings from config:');
                console.log('- Image viewing time:', this.settings.imageViewingTime, 'ms');
                console.log('- Fixation duration:', this.settings.fixationDuration, 'ms');
                console.log('- Max trials:', this.maxTrials);
            }
            
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
            
            // Start practice trials or experiment
            console.log('Config loaded, starting practice...');
            if (this.settings.enablePractice) {
                await this.startPractice();
            } else {
                await this.startExperiment();
            }
            
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
    
    async startPractice() {
        console.log('Starting practice phase...');
        // Skip practice instructions screen - go directly to experiment screen for practice trial
        this.showScreen('experiment');
        
        // Force hide main progress indicator using CSS class
        const mainProgressIndicator = document.getElementById('progress-indicator');
        if (mainProgressIndicator) {
            mainProgressIndicator.classList.add('hide-during-practice');
        }
        
        // Wait a moment to ensure DOM is ready
        await this.delay(50);
        
        const practiceIndicator = document.getElementById('practice-indicator');
        if (practiceIndicator) {
            practiceIndicator.textContent = 'Practice Round';
            practiceIndicator.style.display = 'block';
            practiceIndicator.style.visibility = 'visible';
            practiceIndicator.style.zIndex = '1000';
            practiceIndicator.style.position = 'absolute';
            practiceIndicator.style.top = '20px';
            practiceIndicator.style.right = '20px';
            practiceIndicator.style.background = 'rgba(255, 165, 0, 0.9)';
            practiceIndicator.style.color = 'white';
            practiceIndicator.style.padding = '10px 15px';
            practiceIndicator.style.borderRadius = '5px';
            practiceIndicator.style.fontWeight = 'bold';
            practiceIndicator.style.opacity = '1';
        }
        
        try {
            await this.practiceManager.startPractice(
                (current, total) => {
                    console.log(`Practice progress: ${current}/${total}`);
                },
                (results) => {
                    console.log('Practice completed, showing transition screen:', results);
                    setTimeout(() => {
                        this.showTransitionScreen();
                    }, 500);
                }
            );
            console.log('Practice manager started successfully');
        } catch (error) {
            console.error('Practice error:', error);
            this.showError('Practice failed. Starting experiment without practice.');
            setTimeout(() => {
                this.startExperiment();
            }, 1000);
        }
    }
    
    skipPractice() {
        this.practiceManager.skipPractice();
        this.showTransitionScreen();
    }
    
    showTransitionScreen() {
        console.log('Showing transition screen...');
        
        // Hide practice indicator since practice is complete
        const practiceIndicator = document.getElementById('practice-indicator');
        if (practiceIndicator) {
            practiceIndicator.style.display = 'none';
        }
        
        // Hide main progress indicator during transition
        const mainProgressIndicator = document.getElementById('progress-indicator');
        if (mainProgressIndicator) {
            mainProgressIndicator.style.display = 'none';
        }
        
        // Ensure MouseView is deactivated for transition screen
        try {
            if (typeof mouseview !== 'undefined' && mouseview.removeAll) {
                mouseview.removeAll();
            }
        } catch (error) {
            console.log('MouseView removeAll skipped during transition (error):', error.message);
        }
        
        this.showScreen('transition');
    }
    
    async startMainExperiment() {
        console.log('Starting main experiment from transition screen...');
        
        // Ensure clean state before starting main experiment
        this.currentTrial = 0;
        this.fillerTrialCounter = 0;
        this.globalTrialNumber = 0;
        this.imageTrialCounter = 0;
        this.isExperimentRunning = false; // Will be set to true in startExperiment()
        
        // Small delay to ensure transition screen is fully processed
        await this.delay(100);
        
        this.startExperiment();
    }
    
    async startExperiment() {
        console.log('Starting main experiment...');
        this.experimentStarted = true;
        this.isExperimentRunning = true;
        this.currentTrial = 0;
        this.fillerTrialCounter = 0;
        this.globalTrialNumber = 0;
        this.imageTrialCounter = 0;
        
        // Debug: Check if image manager is ready
        console.log('Image manager ready:', !!this.imageManager);
        console.log('Config loaded:', !!this.imageManager.config);
        console.log('Image trials:', this.imageManager.imageTrials ? this.imageManager.imageTrials.length : 'none');
        console.log('Max trials:', this.maxTrials);
        
        // Initialize experiment data collection
        this.dataManager.startExperiment();
        
        // Show experiment screen
        this.showScreen('experiment');
        
        // Hide practice indicator (if visible) and ensure main progress indicator is visible
        const practiceIndicator = document.getElementById('practice-indicator');
        if (practiceIndicator) {
            practiceIndicator.style.display = 'none';
        }
        
        // Ensure main progress indicator is visible for main experiment
        const mainProgressIndicator = document.getElementById('progress-indicator');
        if (mainProgressIndicator) {
            mainProgressIndicator.classList.remove('hide-during-practice');
            mainProgressIndicator.style.display = 'block';
            mainProgressIndicator.style.visibility = 'visible';
            mainProgressIndicator.style.opacity = '1';
            mainProgressIndicator.style.zIndex = '200';
            console.log('=== PROGRESS INDICATOR DEBUG ===');
            console.log('Progress indicator made visible');
            console.log('Current display:', mainProgressIndicator.style.display);
            console.log('Current visibility:', mainProgressIndicator.style.visibility);
            console.log('=== END PROGRESS DEBUG ===');
        }
        
        // Configure MouseView for main experiment trials only
        this.configureMouseView();
        
        // Hide cursor
        document.body.classList.add('experiment-active');
        
        // Start first trial
        console.log('About to start first trial...');
        await this.runTrial();
        
        console.log('Experiment started');
    }
    
    async runTrial() {
        // Calculate total trials (20 = 12 image + 8 filler)
        const totalTrials = this.imageManager.fillerPattern.length;
        
        console.log(`Running trial ${this.globalTrialNumber + 1} of ${totalTrials}`);
        
        if (this.globalTrialNumber >= totalTrials) {
            console.log('All trials completed, finishing experiment');
            await this.finishExperiment();
            return;
        }
        
        // Increment global trial number
        this.globalTrialNumber++;
        
        // Update progress indicator with total trials
        this.updateProgress(this.globalTrialNumber, totalTrials);
        
        try {
            // Show fixation cross for ALL trials
            console.log('Showing fixation cross...');
            await this.showFixation();
            
            // Check if this position is a filler trial or image trial
            const isFillerTrial = this.imageManager.fillerPattern[this.globalTrialNumber - 1];
            
            console.log(`=== TRIAL ${this.globalTrialNumber} LOGIC DEBUG ===`);
            console.log('globalTrialNumber:', this.globalTrialNumber);
            console.log('Pattern index:', this.globalTrialNumber - 1);
            console.log('fillerPattern[index]:', isFillerTrial);
            console.log('imageTrialCounter:', this.imageTrialCounter);
            console.log('fillerTrialCounter:', this.fillerTrialCounter);
            console.log('Full filler pattern:', this.imageManager.fillerPattern);
            console.log('=== END TRIAL LOGIC DEBUG ===');
            
            if (isFillerTrial) {
                console.log('Showing filler trial...');
                await this.showFillerTrial();
            } else {
                console.log('Showing image trial...');
                await this.showImageTrial();
            }
            
            // Brief inter-trial interval
            await this.delay(250);
            
            // Continue to next trial
            if (this.isExperimentRunning) {
                await this.runTrial();
            }
            
        } catch (error) {
            console.error('Error during trial:', error);
            this.showError('An error occurred during the trial. Continuing to next trial.');
            if (this.isExperimentRunning) {
                await this.runTrial();
            }
        }
    }
    
    async showFixation() {
        const fixationCross = document.getElementById('fixation-cross');
        const imageContainer = document.getElementById('image-container');
        
        // Hide images and show fixation
        this.imageManager.hideImages(imageContainer);
        fixationCross.classList.add('active');
        
        // Disable MouseView during fixation so cross is fully visible
        try {
            if (typeof mouseview !== 'undefined' && mouseview.removeAll) {
                mouseview.removeAll();
            }
        } catch (error) {
            console.log('MouseView removeAll skipped during fixation');
        }
        
        // Wait for fixation duration
        await this.delay(this.settings.fixationDuration);
        
        // Hide fixation
        fixationCross.classList.remove('active');
    }
    
    async showImageTrial() {
        const trialInfo = this.dataManager.startTrial(this.globalTrialNumber - 1, 'image');
        const imageData = this.imageManager.getTrialImages(this.imageTrialCounter);
        const imageContainer = document.getElementById('image-container');
        
        // Increment image trial counter
        this.imageTrialCounter++;
        
        // Configure MouseView for this trial
        this.configureMouseView();
        
        // Start mouse tracking
        try {
            if (typeof mouseview !== 'undefined') {
                mouseview.startTracking();
                console.log(`Mouse tracking started for trial ${this.currentTrial + 1}`);
            }
        } catch (error) {
            console.error('Error starting image trial:', error);
        }
        
        // Display images
        this.imageManager.displayImages(imageData, imageContainer);
        
        // Show countdown timer for timed trials
        if (this.settings.imageViewingTime > 0) {
            this.showTrialCountdown();
            await this.delay(this.settings.imageViewingTime);
            this.hideTrialCountdown();
        } else {
            // Show continue button and wait for user
            await this.waitForUserProgression();
        }
        
        // Stop tracking and collect data
        let mouseData = [];
        try {
            if (typeof mouseview !== 'undefined') {
                // Stop tracking first
                mouseview.stopTracking();
                
                // Get data using direct access (more reliable than getData() which has JSON parsing issues)
                mouseData = mouseview.datalogger?.data || [];
                
                // Clear data for next trial (to avoid accumulation)
                if (mouseview.datalogger) {
                    mouseview.datalogger.data = [];
                }
                
                console.log('Mouse tracking stopped, data collected');
                console.log('=== IMAGE TRIAL MOUSE DATA DEBUG ===');
                console.log('MouseData length:', mouseData.length);
                console.log('MouseData sample (first 3 points):', mouseData.slice(0, 3));
                console.log('=== END MOUSE DATA DEBUG ===');
            }
        } catch (error) {
            console.error('Error stopping mouse tracking:', error);
        }
        
        // Record trial data
        this.dataManager.recordTrialData(trialInfo, imageData, mouseData);
        this.dataManager.recordMouseData(mouseData, this.globalTrialNumber - 1, 'image');
        
        // Debug: Verify trial indexing
        console.log(`=== IMAGE TRIAL RECORDING DEBUG ===`);
        console.log('Global trial number:', this.globalTrialNumber);
        console.log('Image trial counter:', this.imageTrialCounter);
        console.log('Trial index used for data recording:', this.globalTrialNumber - 1);
        console.log('=== END IMAGE TRIAL RECORDING DEBUG ===');
        
        // Hide images
        this.imageManager.hideImages(imageContainer);
        
        console.log(`Image trial ${this.imageTrialCounter} completed`);
    }
    
    async showFillerTrial() {
        const fillerIndex = this.fillerTrialCounter % this.imageManager.neutralFillers.length;
        const trialInfo = this.dataManager.startTrial(this.globalTrialNumber - 1, 'filler');
        const fillerData = this.imageManager.getFillerImages(fillerIndex);
        const imageContainer = document.getElementById('image-container');
        
        // Increment filler trial counter
        this.fillerTrialCounter++;
        
        // Brief delay before filler
        await this.delay(500);
        
        // Show fixation again
        await this.showFixation();
        
        // Configure MouseView for filler trial (same as main trials)
        this.configureMouseView();
        
        // Start mouse tracking for filler
        try {
            if (typeof mouseview !== 'undefined') {
                mouseview.startTracking();
                console.log(`Mouse tracking started for filler ${this.fillerTrialCounter + 1}`);
            }
        } catch (error) {
            console.error('Error starting filler tracking:', error);
        }
        
        // Display filler images
        this.imageManager.displayImages(fillerData, imageContainer);
        
        // Wait for viewing time with countdown
        if (this.settings.imageViewingTime > 0) {
            this.showTrialCountdown();
            await this.delay(this.settings.imageViewingTime);
            this.hideTrialCountdown();
        } else {
            await this.waitForUserProgression();
        }
        
        // Stop tracking and collect data
        let mouseData = [];
        try {
            if (typeof mouseview !== 'undefined') {
                // Stop tracking first
                mouseview.stopTracking();
                
                // Get data using direct access (more reliable than getData() which has JSON parsing issues)
                mouseData = mouseview.datalogger?.data || [];
                
                // Clear data for next trial (to avoid accumulation)
                if (mouseview.datalogger) {
                    mouseview.datalogger.data = [];
                }
                
                console.log('Filler mouse tracking stopped, data collected');
                console.log('=== FILLER TRIAL MOUSE DATA DEBUG ===');
                console.log('MouseData length:', mouseData.length);
                console.log('MouseData sample (first 3 points):', mouseData.slice(0, 3));
                console.log('=== END MOUSE DATA DEBUG ===');
            }
        } catch (error) {
            console.error('Error stopping filler tracking:', error);
        }
        
        // Record filler trial data
        this.dataManager.recordTrialData(trialInfo, fillerData, mouseData);
        this.dataManager.recordMouseData(mouseData, this.globalTrialNumber - 1, 'filler');
        
        // Debug: Verify trial indexing
        console.log(`=== FILLER TRIAL RECORDING DEBUG ===`);
        console.log('Global trial number:', this.globalTrialNumber);
        console.log('Filler trial counter:', this.fillerTrialCounter);
        console.log('Trial index used for data recording:', this.globalTrialNumber - 1);
        console.log('=== END FILLER TRIAL RECORDING DEBUG ===');
        
        // Hide images
        this.imageManager.hideImages(imageContainer);
        
        console.log(`Filler trial ${this.fillerTrialCounter} completed`);
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
    
    updateProgress(current, total) {
        console.log('=== UPDATE PROGRESS DEBUG ===');
        console.log('Called with current:', current, 'total:', total);
        
        const currentTrialElement = document.getElementById('current-trial');
        const totalTrialsElement = document.getElementById('total-trials');
        
        console.log('Current trial element:', currentTrialElement);
        console.log('Total trials element:', totalTrialsElement);
        
        if (currentTrialElement) {
            currentTrialElement.textContent = current;
            console.log('Set current trial to:', current);
        }
        if (totalTrialsElement) {
            totalTrialsElement.textContent = total;
            console.log('Set total trials to:', total);
        }
        
        // Check if progress indicator is visible
        const progressIndicator = document.getElementById('progress-indicator');
        if (progressIndicator) {
            console.log('Progress indicator display:', progressIndicator.style.display);
            console.log('Progress indicator visibility:', progressIndicator.style.visibility);
        }
        
        console.log('=== END UPDATE PROGRESS DEBUG ===');
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
        
        // Restore cursor
        document.body.classList.remove('experiment-active');
        
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
        // Reset state
        this.currentState = 'welcome';
        this.currentTrial = 0;
        this.fillerTrialCounter = 0;
        this.globalTrialNumber = 0;
        this.imageTrialCounter = 0;
        this.experimentStarted = false;
        this.isExperimentRunning = false;
        
        // Clear data
        this.dataManager.clearData();
        
        // Reset UI
        document.body.classList.remove('experiment-active');
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
                } else if (this.currentState === 'transition') {
                    event.preventDefault();
                    this.startMainExperiment();
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
                
            case 'KeyD':
                if (event.ctrlKey || event.metaKey) {
                    // Ctrl+D or Cmd+D for debug mode
                    event.preventDefault();
                    this.toggleDebugMode();
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
        document.body.classList.remove('experiment-active');
        
        // Clean up any running timers
        this.hideTrialCountdown();
        
        // Try to save partial data
        if (this.dataManager.getTrialData().length > 0) {
            this.dataManager.exportAllData();
        }
        
        this.showScreen('end');
        console.log('Emergency exit - partial data saved');
    }
    
    toggleDebugMode() {
        this.settings.debug = !this.settings.debug;
        
        // Toggle debug elements
        const labels = document.querySelectorAll('.image-label');
        labels.forEach(label => {
            label.classList.toggle('show-labels', this.settings.debug);
        });
        
        console.log('Debug mode:', this.settings.debug ? 'ON' : 'OFF');
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
    configureMouseView() {
        console.log('=== MAIN CONFIGURE MOUSEVIEW CALLED ===');
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
                console.log('MouseView configured for trial');
                
                // Additional debugging - check actual DOM elements
                setTimeout(() => {
                    const overlay = document.querySelector('#mouseview-overlay');
                    const aperture = document.querySelector('#mouseview-aperture');
                    console.log('=== MAIN DOM DEBUG ===');
                    console.log('Overlay element:', overlay);
                    console.log('Aperture element:', aperture);
                    if (overlay) {
                        console.log('Overlay style:', overlay.style.cssText);
                    }
                    if (aperture) {
                        console.log('Aperture style:', aperture.style.cssText);
                    }
                    console.log('=== END MAIN DOM DEBUG ===');
                }, 100);
                
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExperimentController;
} else if (typeof window !== 'undefined') {
    window.ExperimentController = ExperimentController;
}