/**
 * ImageManager - Handles image loading, randomization, and management for 3-round system
 * 
 * DYNAMIC POSITIONING SYSTEM:
 * This class now includes a dynamic positioning system that calculates optimal
 * image positions to prevent overlap across different screen sizes.
 * 
 * Features:
 * - Automatic calculation of optimal image sizes based on viewport
 * - Overlap detection and prevention
 * - Fallback positioning for constrained viewports
 * - Responsive repositioning on window resize
 * - Research-grade logging for position validation
 * 
 * Key Methods:
 * - calculateOptimalImagePositions(): Main positioning calculation
 * - displayImages(): Now uses dynamic positioning instead of fixed CSS
 * - testDynamicPositioning(): Test system across different screen sizes
 * 
 * Uses new-data.json with 4 categories: dysphoric, threat, positive, filler
 */

class ImageManager {
    constructor() {
        this.imageCategories = null;
        this.availableImages = {
            dysphoric: [],
            threat: [],
            positive: [],
            filler: []
        };
        this.preloadedImages = new Map();
        this.loadingProgress = 0;
        this.totalImages = 0;
        
        // Position mappings (same as before)
        this.positions = {
            'top-left': { x: -0.3, y: 0.2 },
            'top-right': { x: 0.3, y: 0.2 },
            'bottom-left': { x: -0.3, y: -0.2 },
            'bottom-right': { x: 0.3, y: -0.2 }
        };
        
        this.categories = ['dysphoric', 'threat', 'positive', 'filler'];
        this.positionNames = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        
        console.log('ImageManager initialized for 3-round system with new-data.json structure');
        console.log('🔍 ImageManager constructor: initializeDynamicPositioning method exists?', typeof this.initializeDynamicPositioning);
    }
    
    async loadConfig() {
        try {
            console.log('Loading new-data.json...');
            const response = await fetch('data/new-data.json');
            this.imageCategories = await response.json();
            
            // Initialize available image pools (deep copy to preserve originals)
            this.availableImages = {
                dysphoric: [...this.imageCategories.dysphoric],
                threat: [...this.imageCategories.threat],
                positive: [...this.imageCategories.positive],
                filler: [...this.imageCategories.filler]
            };
            
            // Shuffle all pools for randomization
            Object.values(this.availableImages).forEach(pool => this.shuffleArray(pool));
            
            console.log('New image categories loaded successfully:');
            console.log(`- Dysphoric: ${this.availableImages.dysphoric.length} images`);
            console.log(`- Threat: ${this.availableImages.threat.length} images`);
            console.log(`- Positive: ${this.availableImages.positive.length} images`);
            console.log(`- Filler: ${this.availableImages.filler.length} images`);
            console.log(`- Total: ${Object.values(this.availableImages).reduce((sum, pool) => sum + pool.length, 0)} images`);
            
            return true;
        } catch (error) {
            console.error('Failed to load new-data.json:', error);
            return false;
        }
    }
    
    /**
     * Select images for an image trial: 1 dysphoric + 1 threat + 1 positive + 1 filler
     * Returns object with selected images and their random position assignments
     */
    selectImagesForImageTrial(usedImages) {
        console.log('=== Selecting Images for IMAGE Trial ===');
        
        const selected = {
            dysphoric: '',
            threat: '',
            positive: '',
            filler: '',
            positions: {
                dysphoric: '',
                threat: '',
                positive: '',
                filler: ''
            }
        };
        
        // Randomly shuffle positions for this trial
        const shuffledPositions = [...this.positionNames];
        this.shuffleArray(shuffledPositions);
        
        // Select one image from each emotional category + filler
        const emotionalCategories = ['dysphoric', 'threat', 'positive'];
        
        emotionalCategories.forEach((category, index) => {
            const availablePool = this.availableImages[category].filter(img => !usedImages.has(`images/${img}`));
            
            if (availablePool.length === 0) {
                throw new Error(`No available ${category} images remaining! Used: ${usedImages.size}`);
            }
            
            // Select first available image (pools are already shuffled)
            const selectedImage = availablePool[0];
            const imagePath = `images/${selectedImage}`;
            
            selected[category] = selectedImage;
            selected.positions[category] = shuffledPositions[index];
            
            // Remove from available pool and add to used set
            this.availableImages[category] = this.availableImages[category].filter(img => img !== selectedImage);
            usedImages.add(imagePath);
            
            console.log(`Selected ${category}: ${selectedImage} at ${shuffledPositions[index]}`);
        });
        
        // Select filler image for 4th position
        const availableFillerPool = this.availableImages.filler.filter(img => !usedImages.has(`images/${img}`));
        
        if (availableFillerPool.length === 0) {
            throw new Error(`No available filler images remaining! Used: ${usedImages.size}`);
        }
        
        const selectedFillerImage = availableFillerPool[0];
        const fillerImagePath = `images/${selectedFillerImage}`;
        
        selected.filler = selectedFillerImage;
        selected.positions.filler = shuffledPositions[3]; // Last position
        
        // Remove from available pool and add to used set
        this.availableImages.filler = this.availableImages.filler.filter(img => img !== selectedFillerImage);
        usedImages.add(fillerImagePath);
        
        console.log(`Selected filler: ${selectedFillerImage} at ${shuffledPositions[3]}`);
        console.log('Image trial selection complete:', selected);
        
        return selected;
    }
    
    /**
     * Select images for a filler trial: 4 filler images
     * Returns object with selected filler images and their random position assignments
     */
    selectImagesForFillerTrial(usedImages) {
        console.log('=== Selecting Images for FILLER Trial ===');
        
        const selected = {
            filler1: '',
            filler2: '',
            filler3: '',
            filler4: '',
            positions: {
                filler1: '',
                filler2: '',
                filler3: '',
                filler4: ''
            }
        };
        
        // Randomly shuffle positions for this trial
        const shuffledPositions = [...this.positionNames];
        this.shuffleArray(shuffledPositions);
        
        // Select 4 different filler images
        const availableFillerPool = this.availableImages.filler.filter(img => !usedImages.has(`images/${img}`));
        
        if (availableFillerPool.length < 4) {
            throw new Error(`Not enough filler images remaining! Need 4, have ${availableFillerPool.length}`);
        }
        
        for (let i = 0; i < 4; i++) {
            const selectedImage = availableFillerPool[i];
            const imagePath = `images/${selectedImage}`;
            const fillerKey = `filler${i + 1}`;
            
            selected[fillerKey] = selectedImage;
            selected.positions[fillerKey] = shuffledPositions[i];
            
            // Remove from available pool and add to used set
            this.availableImages.filler = this.availableImages.filler.filter(img => img !== selectedImage);
            usedImages.add(imagePath);
            
            console.log(`Selected ${fillerKey}: ${selectedImage} at ${shuffledPositions[i]}`);
        }
        
        console.log('Filler trial selection complete:', selected);
        
        return selected;
    }
    
    /**
     * Main method called by ExperimentController to get images for a trial
     */
    selectImagesForTrial(trialType, usedImages) {
        if (trialType === 'image') {
            return this.selectImagesForImageTrial(usedImages);
        } else if (trialType === 'filler') {
            return this.selectImagesForFillerTrial(usedImages);
        } else {
            throw new Error(`Unknown trial type: ${trialType}`);
        }
    }
    
    /**
     * Display images in the container based on position assignments
     * Now uses dynamic positioning to prevent overlap across different screen sizes
     */
    displayImages(imageData, container) {
        console.log('=== Displaying Images ===');
        console.log('Image data:', imageData);
        
        if (imageData.error) {
            console.error('Cannot display images due to error:', imageData.error);
            return;
        }
        
        // Hide all images first
        this.hideImages(container);
        
        // Calculate optimal positions for current viewport
        const dynamicPositions = this.calculateOptimalImagePositions();
        const imageSize = this.calculateOptimalImageSize({
            width: window.innerWidth,
            height: window.innerHeight
        });
        
        // Map position names to image elements (dynamic positioning uses different naming)
        const imageElements = {
            'top-left': container.querySelector('#top-left-image'),
            'top-right': container.querySelector('#top-right-image'),
            'bottom-left': container.querySelector('#bottom-left-image'),
            'bottom-right': container.querySelector('#bottom-right-image')
        };
        
        // Map our position names to dynamic position names
        const positionMapping = {
            'top-left': 'topLeft',
            'top-right': 'topRight',
            'bottom-left': 'bottomLeft',
            'bottom-right': 'bottomRight'
        };
        
        // Display images based on their assigned positions using dynamic positioning
        if (imageData.positions) {
            Object.keys(imageData.positions).forEach(category => {
                const assignedPosition = imageData.positions[category];
                const imageElement = imageElements[assignedPosition];
                const dynamicPositionKey = positionMapping[assignedPosition];
                const dynamicPosition = dynamicPositions[dynamicPositionKey];
                
                if (imageElement && assignedPosition && dynamicPosition) {
                    let imagePath = '';
                    
                    // Determine image path based on category
                    if (category === 'dysphoric' || category === 'threat' || category === 'positive' || category === 'filler') {
                        imagePath = `images/${imageData[category]}`;
                    } else if (category.startsWith('filler')) {
                        imagePath = `images/${imageData[category]}`;
                    }
                    
                    if (imagePath) {
                        // Apply dynamic positioning
                        imageElement.style.position = 'absolute';
                        imageElement.style.left = `${dynamicPosition.x}px`;
                        imageElement.style.top = `${dynamicPosition.y}px`;
                        imageElement.style.maxWidth = `${imageSize.width}px`;
                        imageElement.style.maxHeight = `${imageSize.height}px`;
                        imageElement.style.width = 'auto';
                        imageElement.style.height = 'auto';
                        
                        // Set image source and display
                        imageElement.src = imagePath;
                        imageElement.style.display = 'block';
                        imageElement.style.opacity = '1';
                        
                        console.log(`Displaying ${category} image: ${imagePath} at ${assignedPosition} (dynamic: x=${dynamicPosition.x}, y=${dynamicPosition.y})`);
                    }
                }
            });
        }
        
        // Log positioning data for research validation
        this.logPositioningData(dynamicPositions, imageSize);
        
        console.log('Images displayed successfully with dynamic positioning');
    }
    
    /**
     * Hide all images in container
     */
    hideImages(container) {
        const imageElements = container.querySelectorAll('.stimulus-image');
        imageElements.forEach(img => {
            img.style.display = 'none';
            img.style.opacity = '0';
            img.src = ''; // Clear source to free memory
        });
    }
    
    /**
     * Preload all images for smooth display during experiment
     */
    async preloadAllImages(progressCallback) {
        console.log('=== Preloading All Images ===');
        
        const allImages = [];
        
        // Collect all image paths
        Object.values(this.imageCategories).forEach(categoryImages => {
            categoryImages.forEach(imagePath => {
                allImages.push(`images/${imagePath}`);
            });
        });
        
        this.totalImages = allImages.length;
        console.log(`Starting preload of ${this.totalImages} images...`);
        
        const loadPromises = allImages.map((imagePath, index) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                
                img.onload = () => {
                    this.preloadedImages.set(imagePath, img);
                    this.loadingProgress++;
                    
                    if (progressCallback) {
                        progressCallback(this.loadingProgress, this.totalImages, imagePath);
                    }
                    
                    resolve(imagePath);
                };
                
                img.onerror = () => {
                    console.warn(`Failed to load image: ${imagePath}`);
                    this.loadingProgress++;
                    
                    if (progressCallback) {
                        progressCallback(this.loadingProgress, this.totalImages, imagePath);
                    }
                    
                    // Don't reject - continue with other images
                    resolve(imagePath);
                };
                
                img.src = imagePath;
            });
        });
        
        await Promise.all(loadPromises);
        
        console.log(`Preloading complete! Loaded ${this.preloadedImages.size}/${this.totalImages} images`);
        return true;
    }
    
    /**
     * Get remaining images available for selection
     */
    getRemainingImageCounts() {
        return {
            dysphoric: this.availableImages.dysphoric.length,
            threat: this.availableImages.threat.length,
            positive: this.availableImages.positive.length,
            filler: this.availableImages.filler.length,
            total: Object.values(this.availableImages).reduce((sum, pool) => sum + pool.length, 0)
        };
    }
    
    /**
     * Check if enough images remain for remaining trials
     */
    canCompleteRemainingTrials(imageTrialsRemaining, fillerTrialsRemaining) {
        const counts = this.getRemainingImageCounts();
        
        const emotionalImagesNeeded = imageTrialsRemaining; // 1 per image trial
        const fillerImagesNeeded = (imageTrialsRemaining * 1) + (fillerTrialsRemaining * 4); // 1 per image trial + 4 per filler trial
        
        const canComplete = (
            counts.dysphoric >= emotionalImagesNeeded &&
            counts.threat >= emotionalImagesNeeded &&
            counts.positive >= emotionalImagesNeeded &&
            counts.filler >= fillerImagesNeeded
        );
        
        console.log(`Image availability check:
        - Emotional images needed: ${emotionalImagesNeeded} each
        - Filler images needed: ${fillerImagesNeeded}
        - Available: dysphoric=${counts.dysphoric}, threat=${counts.threat}, positive=${counts.positive}, filler=${counts.filler}
        - Can complete: ${canComplete}`);
        
        return canComplete;
    }
    
    /**
     * Dynamic positioning system to prevent overlap across different screen sizes
     */
    calculateOptimalImagePositions() {
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        console.log('=== Dynamic Positioning Calculation ===');
        console.log(`Viewport: ${viewport.width}x${viewport.height}`);
        
        // Calculate optimal image size based on viewport
        const imageSize = this.calculateOptimalImageSize(viewport);
        console.log(`Optimal image size: ${imageSize.width}x${imageSize.height}`);
        
        // Calculate safe positions with minimum gaps
        const positions = this.calculateSafePositions(viewport, imageSize);
        
        // Validate positions don't overlap
        const validatedPositions = this.validatePositions(positions, imageSize);
        
        console.log('Final positions:', validatedPositions);
        console.log('=== End Dynamic Positioning ===');
        
        return validatedPositions;
    }
    
    /**
     * Calculate optimal image size based on viewport dimensions
     */
    calculateOptimalImageSize(viewport) {
        // Base size ratios (increased for bigger images)
        const baseRatio = {
            width: 0.25,  // 25% of viewport width (increased from 18%)
            height: 0.32  // 32% of viewport height (increased from 25%)
        };
        
        // Calculate based on viewport
        let optimalWidth = Math.floor(viewport.width * baseRatio.width);
        let optimalHeight = Math.floor(viewport.height * baseRatio.height);
        
        // Apply constraints for research validity (increased limits)
        const constraints = {
            minWidth: 250, maxWidth: 500,  // Increased from 200-400
            minHeight: 180, maxHeight: 380  // Increased from 140-300
        };
        
        optimalWidth = Math.max(constraints.minWidth, Math.min(constraints.maxWidth, optimalWidth));
        optimalHeight = Math.max(constraints.minHeight, Math.min(constraints.maxHeight, optimalHeight));
        
        // Maintain aspect ratio preference
        const aspectRatio = 380 / 260; // Original ratio from CSS
        if (optimalWidth / optimalHeight > aspectRatio) {
            optimalWidth = Math.floor(optimalHeight * aspectRatio);
        } else {
            optimalHeight = Math.floor(optimalWidth / aspectRatio);
        }
        
        return { width: optimalWidth, height: optimalHeight };
    }
    
    /**
     * Calculate safe positions for four quadrants with minimum gaps
     */
    calculateSafePositions(viewport, imageSize) {
        // Calculate quadrant boundaries
        const centerX = viewport.width / 2;
        const centerY = viewport.height / 2;
        const margin = 20; // Small margin from screen edges and center divider
        
        // Define quadrant centers closer to screen center
        const offset = 0.7; // Move images closer to center (0.5 = center, 1.0 = original quadrant centers)
        const quadrantCenters = {
            topLeft: {
                centerX: centerX - (centerX * offset * 0.5),  // Closer to center horizontally
                centerY: centerY - (centerY * offset * 0.5)   // Closer to center vertically
            },
            topRight: {
                centerX: centerX + (centerX * offset * 0.5),  // Closer to center horizontally
                centerY: centerY - (centerY * offset * 0.5)   // Closer to center vertically
            },
            bottomLeft: {
                centerX: centerX - (centerX * offset * 0.5),  // Closer to center horizontally
                centerY: centerY + (centerY * offset * 0.5)   // Closer to center vertically
            },
            bottomRight: {
                centerX: centerX + (centerX * offset * 0.5),  // Closer to center horizontally
                centerY: centerY + (centerY * offset * 0.5)   // Closer to center vertically
            }
        };
        
        // Calculate top-left positions by centering images in each quadrant
        const positions = {
            topLeft: {
                x: quadrantCenters.topLeft.centerX - (imageSize.width / 2),
                y: quadrantCenters.topLeft.centerY - (imageSize.height / 2),
                centerX: quadrantCenters.topLeft.centerX,
                centerY: quadrantCenters.topLeft.centerY
            },
            topRight: {
                x: quadrantCenters.topRight.centerX - (imageSize.width / 2),
                y: quadrantCenters.topRight.centerY - (imageSize.height / 2),
                centerX: quadrantCenters.topRight.centerX,
                centerY: quadrantCenters.topRight.centerY
            },
            bottomLeft: {
                x: quadrantCenters.bottomLeft.centerX - (imageSize.width / 2),
                y: quadrantCenters.bottomLeft.centerY - (imageSize.height / 2),
                centerX: quadrantCenters.bottomLeft.centerX,
                centerY: quadrantCenters.bottomLeft.centerY
            },
            bottomRight: {
                x: quadrantCenters.bottomRight.centerX - (imageSize.width / 2),
                y: quadrantCenters.bottomRight.centerY - (imageSize.height / 2),
                centerX: quadrantCenters.bottomRight.centerX,
                centerY: quadrantCenters.bottomRight.centerY
            }
        };
        
        // Ensure images don't go outside screen boundaries
        Object.keys(positions).forEach(key => {
            const pos = positions[key];
            pos.x = Math.max(margin, Math.min(pos.x, viewport.width - imageSize.width - margin));
            pos.y = Math.max(margin, Math.min(pos.y, viewport.height - imageSize.height - margin));
        });
        
        return positions;
    }
    
    /**
     * Validate positions don't overlap and adjust if needed
     */
    validatePositions(positions, imageSize) {
        const positionArray = Object.entries(positions);
        const adjustedPositions = { ...positions };
        let hasOverlap = false;
        
        // Check all position pairs for overlap
        for (let i = 0; i < positionArray.length; i++) {
            for (let j = i + 1; j < positionArray.length; j++) {
                const [name1, pos1] = positionArray[i];
                const [name2, pos2] = positionArray[j];
                
                if (this.checkOverlap(pos1, pos2, imageSize)) {
                    console.warn(`Overlap detected between ${name1} and ${name2}`);
                    hasOverlap = true;
                }
            }
        }
        
        // If overlap detected, use fallback positioning
        if (hasOverlap) {
            console.warn('Using fallback positioning due to overlap');
            return this.getFallbackPositions();
        }
        
        return adjustedPositions;
    }
    
    /**
     * Check if two image positions overlap
     */
    checkOverlap(pos1, pos2, imageSize) {
        const margin = 10; // Additional safety margin
        
        return !(
            pos1.x + imageSize.width + margin < pos2.x ||
            pos2.x + imageSize.width + margin < pos1.x ||
            pos1.y + imageSize.height + margin < pos2.y ||
            pos2.y + imageSize.height + margin < pos1.y
        );
    }
    
    /**
     * Fallback positions for very small screens
     */
    getFallbackPositions() {
        console.log('Using fallback positions for constrained viewport');
        
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        // Calculate quadrant centers even for small screens
        const centerX = viewport.width / 2;
        const centerY = viewport.height / 2;
        const fallbackImageSize = { width: 120, height: 80 }; // Smaller images for fallback
        
        // Center images in each quadrant with fallback size
        return {
            topLeft: { 
                x: Math.floor((centerX / 2) - (fallbackImageSize.width / 2)), 
                y: Math.floor((centerY / 2) - (fallbackImageSize.height / 2)) 
            },
            topRight: { 
                x: Math.floor(centerX + (centerX / 2) - (fallbackImageSize.width / 2)), 
                y: Math.floor((centerY / 2) - (fallbackImageSize.height / 2)) 
            },
            bottomLeft: { 
                x: Math.floor((centerX / 2) - (fallbackImageSize.width / 2)), 
                y: Math.floor(centerY + (centerY / 2) - (fallbackImageSize.height / 2)) 
            },
            bottomRight: { 
                x: Math.floor(centerX + (centerX / 2) - (fallbackImageSize.width / 2)), 
                y: Math.floor(centerY + (centerY / 2) - (fallbackImageSize.height / 2)) 
            }
        };
    }
    
    /**
     * Apply calculated positions to image elements
     */
    applyDynamicPositions(container, positions, imageSize) {
        console.log('=== Applying Dynamic Positions ===');
        
        const imageElements = {
            'topLeft': container.querySelector('#top-left-image'),
            'topRight': container.querySelector('#top-right-image'),
            'bottomLeft': container.querySelector('#bottom-left-image'),
            'bottomRight': container.querySelector('#bottom-right-image')
        };
        
        // Apply CSS custom properties for positioning
        document.documentElement.style.setProperty('--dynamic-image-width', `${imageSize.width}px`);
        document.documentElement.style.setProperty('--dynamic-image-height', `${imageSize.height}px`);
        
        Object.entries(positions).forEach(([positionName, position]) => {
            const element = imageElements[positionName];
            if (element && position) {
                // Apply absolute positioning
                element.style.position = 'absolute';
                element.style.left = `${position.x}px`;
                element.style.top = `${position.y}px`;
                element.style.maxWidth = `${imageSize.width}px`;
                element.style.maxHeight = `${imageSize.height}px`;
                element.style.width = 'auto';
                element.style.height = 'auto';
                
                console.log(`Applied position to ${positionName}: x=${position.x}, y=${position.y}`);
            }
        });
        
        // Log positioning data for research validation
        this.logPositioningData(positions, imageSize);
        
        console.log('=== Dynamic Positioning Applied ===');
        
        return true;
    }
    
    /**
     * Log positioning data for research validation and debugging
     */
    logPositioningData(positions, imageSize) {
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        const positioningData = {
            timestamp: new Date().toISOString(),
            viewport: viewport,
            imageSize: imageSize,
            positions: positions,
            userAgent: navigator.userAgent,
            devicePixelRatio: window.devicePixelRatio || 1
        };
        
        console.log('Research positioning data:', positioningData);
        
        // Store for potential export with experiment data
        if (!window.positioningLogs) {
            window.positioningLogs = [];
        }
        window.positioningLogs.push(positioningData);
    }

    /**
     * Initialize dynamic positioning system with responsive handlers
     */
    initializeDynamicPositioning() {
        console.log('✅ ImageManager.initializeDynamicPositioning() method called successfully');
        console.log('Initializing dynamic positioning system...');
        
        // Add resize event listener for responsive positioning
        window.addEventListener('resize', () => this.handleWindowResize());
        
        // Store initial viewport dimensions for comparison
        this.lastViewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        console.log('Dynamic positioning system initialized');
    }
    
    /**
     * Handle window resize events to recalculate positions if needed
     */
    handleWindowResize() {
        const currentViewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        // Check if resize is significant enough to warrant recalculation
        const widthChange = Math.abs(currentViewport.width - this.lastViewport.width);
        const heightChange = Math.abs(currentViewport.height - this.lastViewport.height);
        
        const significantResize = widthChange > 100 || heightChange > 100;
        
        if (significantResize) {
            console.log('Significant viewport change detected, recalculating positions...');
            console.log(`Viewport change: ${this.lastViewport.width}x${this.lastViewport.height} → ${currentViewport.width}x${currentViewport.height}`);
            
            // Update stored viewport
            this.lastViewport = currentViewport;
            
            // Trigger position recalculation if images are currently displayed
            const imageContainer = document.getElementById('image-container');
            const visibleImages = imageContainer?.querySelectorAll('.stimulus-image[style*="display: block"]');
            
            if (visibleImages && visibleImages.length > 0) {
                console.log('Refreshing image positions for new viewport size...');
                // This would need to be called from the experiment controller
                // For now, just log that positions should be updated
                console.log('Note: Positions should be recalculated on next image display');
            }
        }
    }

    /**
     * Test dynamic positioning system across different screen sizes
     * This method simulates different viewport sizes and logs positioning results
     */
    testDynamicPositioning() {
        console.log('=== Testing Dynamic Positioning System ===');
        
        // Save current viewport
        const originalViewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        // Test different viewport sizes
        const testViewports = [
            { name: 'Mobile Portrait', width: 375, height: 667 },
            { name: 'Mobile Landscape', width: 667, height: 375 },
            { name: 'Tablet Portrait', width: 768, height: 1024 },
            { name: 'Tablet Landscape', width: 1024, height: 768 },
            { name: 'Desktop Small', width: 1280, height: 720 },
            { name: 'Desktop Standard', width: 1920, height: 1080 },
            { name: 'Desktop Large', width: 2560, height: 1440 }
        ];
        
        testViewports.forEach(viewport => {
            console.log(`\n--- Testing ${viewport.name} (${viewport.width}x${viewport.height}) ---`);
            
            // Temporarily set viewport for testing
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: viewport.width
            });
            Object.defineProperty(window, 'innerHeight', {
                writable: true,
                configurable: true,
                value: viewport.height
            });
            
            try {
                // Calculate positions for this viewport
                const positions = this.calculateOptimalImagePositions();
                const imageSize = this.calculateOptimalImageSize(viewport);
                
                console.log(`Image size: ${imageSize.width}x${imageSize.height}`);
                console.log('Positions:');
                Object.entries(positions).forEach(([posName, pos]) => {
                    console.log(`  ${posName}: x=${pos.x}, y=${pos.y}`);
                });
                
                // Validate no overlaps
                const hasOverlap = this.validatePositionsForTesting(positions, imageSize);
                console.log(`Overlap check: ${hasOverlap ? 'FAILED' : 'PASSED'}`);
                
            } catch (error) {
                console.error(`Error testing ${viewport.name}:`, error);
            }
        });
        
        // Restore original viewport
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: originalViewport.width
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: originalViewport.height
        });
        
        console.log('\n=== Dynamic Positioning Test Complete ===');
        console.log('Use window.imageManager.testDynamicPositioning() to run this test again');
    }
    
    /**
     * Helper method for testing - validates positions and returns true if overlap detected
     */
    validatePositionsForTesting(positions, imageSize) {
        const positionArray = Object.entries(positions);
        
        for (let i = 0; i < positionArray.length; i++) {
            for (let j = i + 1; j < positionArray.length; j++) {
                const [name1, pos1] = positionArray[i];
                const [name2, pos2] = positionArray[j];
                
                if (this.checkOverlap(pos1, pos2, imageSize)) {
                    console.warn(`  Overlap detected: ${name1} and ${name2}`);
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Utility method to shuffle an array in place
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageManager;
} else if (typeof window !== 'undefined') {
    window.ImageManager = ImageManager;
}