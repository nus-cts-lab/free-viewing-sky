/**
 * ImageManager - Handles image loading, randomization, and management for 3-round system
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
        
        // Map position names to image elements
        const imageElements = {
            'top-left': container.querySelector('#top-left-image'),
            'top-right': container.querySelector('#top-right-image'),
            'bottom-left': container.querySelector('#bottom-left-image'),
            'bottom-right': container.querySelector('#bottom-right-image')
        };
        
        // Display images based on their assigned positions
        if (imageData.positions) {
            Object.keys(imageData.positions).forEach(category => {
                const position = imageData.positions[category];
                const imageElement = imageElements[position];
                
                if (imageElement && position) {
                    let imagePath = '';
                    
                    // Determine image path based on category
                    if (category === 'dysphoric' || category === 'threat' || category === 'positive' || category === 'filler') {
                        imagePath = `images/${imageData[category]}`;
                    } else if (category.startsWith('filler')) {
                        imagePath = `images/${imageData[category]}`;
                    }
                    
                    if (imagePath) {
                        imageElement.src = imagePath;
                        imageElement.style.display = 'block';
                        imageElement.style.opacity = '1';
                        
                        console.log(`Displaying ${category} image: ${imagePath} at ${position}`);
                    }
                }
            });
        }
        
        console.log('Images displayed successfully');
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