/**
 * DataManager - Handles data collection and export for 3-round experiment system
 * Updated for new-data.json structure with round tracking
 */

class DataManager {
    constructor() {
        this.participantData = {
            participant_id: this.generateParticipantId(),
            session: '001',
            date: new Date().toISOString(),
            start_time: new Date().toISOString(),
            browser: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            device_pixel_ratio: window.devicePixelRatio || 1,
            user_agent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
        };
        
        this.trialData = [];
        this.mouseTrackingData = [];
        this.experimentStartTime = null;
        this.currentTrialStartTime = null;
        
        console.log('DataManager initialized for 3-round experiment, participant:', this.participantData.participant_id);
    }
    
    generateParticipantId() {
        // Generate 6-digit random ID similar to PsychoPy version
        return Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    }
    
    setParticipantInfo(participantId, session = '001') {
        this.participantData.participant_id = participantId;
        this.participantData.session = session;
        console.log('Participant info updated:', participantId, session);
    }
    
    startExperiment() {
        this.experimentStartTime = performance.now();
        this.participantData.experiment_start_time = new Date().toISOString();
        console.log('3-round experiment started at:', this.participantData.experiment_start_time);
    }
    
    startTrial(trialIndex, trialType = 'image') {
        this.currentTrialStartTime = performance.now();
        return {
            trialIndex: trialIndex,
            trialType: trialType,
            startTime: this.currentTrialStartTime,
            relativeStartTime: this.currentTrialStartTime - this.experimentStartTime
        };
    }
    
    endTrial() {
        if (!this.currentTrialStartTime) {
            console.warn('endTrial called without startTrial');
            return null;
        }
        
        const endTime = performance.now();
        const duration = endTime - this.currentTrialStartTime;
        
        return {
            endTime: endTime,
            duration: duration
        };
    }
    
    /**
     * Record trial data for 3-round system with enhanced round tracking
     */
    recordTrialData(trialInfo, imageData, mouseData = null) {
        const timing = this.endTrial();
        
        if (!timing) {
            console.error('Could not record trial data - no timing information');
            return;
        }
        
        console.log('=== RECORDING TRIAL DATA ===');
        console.log('trialInfo:', trialInfo);
        console.log('imageData:', imageData);
        
        // Create enhanced trial record with round tracking
        const trialRecord = {
            // Global trial tracking (1-60)
            trial_idx: trialInfo.trialIndex + 1, // 1-based indexing
            
            // Round tracking  
            round_number: trialInfo.roundNumber || 1, // 1, 2, 3
            round_trial_idx: trialInfo.roundTrialIndex || 1, // 1-20 within round
            
            // Trial classification
            trial_type: trialInfo.trialType || 'image', // 'image' or 'filler'
            
            // Image fields for image trials (dysphoric, threat, positive, filler)
            img_dysphoric: '',
            img_threat: '',
            img_positive: '', 
            img_filler: '', // Single filler for image trials
            
            // Position fields for image trials
            position_dysphoric: '',
            position_threat: '',
            position_positive: '',
            position_filler: '',
            
            // Filler trial fields (4 fillers for filler trials)
            filler_1: '',
            filler_2: '',
            filler_3: '',
            filler_4: '',
            
            // Filler position fields
            position_filler_1: '',
            position_filler_2: '',
            position_filler_3: '',
            position_filler_4: '',
            
            // Timing information
            trial_start_time: new Date(Date.now() - (performance.now() - trialInfo.startTime)).toISOString(),
            trial_duration_ms: timing.duration,
            relative_start_time_ms: trialInfo.relativeStartTime,
            
            // Additional metadata
            timestamp: new Date().toISOString(),
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight
        };
        
        // Populate image fields based on trial type and new data structure
        if (trialInfo.trialType === 'image') {
            console.log('Processing IMAGE trial - 4 categories');
            
            // For image trials: 1 dysphoric, 1 threat, 1 positive, 1 filler
            trialRecord.img_dysphoric = imageData.dysphoric || '';
            trialRecord.img_threat = imageData.threat || '';
            trialRecord.img_positive = imageData.positive || '';
            trialRecord.img_filler = imageData.filler || '';
            
            // Positions for image trials
            if (imageData.positions) {
                trialRecord.position_dysphoric = imageData.positions.dysphoric || '';
                trialRecord.position_threat = imageData.positions.threat || '';
                trialRecord.position_positive = imageData.positions.positive || '';
                trialRecord.position_filler = imageData.positions.filler || '';
            }
            
            console.log('Image trial populated:', {
                dysphoric: trialRecord.img_dysphoric,
                threat: trialRecord.img_threat,
                positive: trialRecord.img_positive,
                filler: trialRecord.img_filler
            });
            
        } else if (trialInfo.trialType === 'filler') {
            console.log('Processing FILLER trial - 4 fillers');
            
            // For filler trials: 4 different filler images
            trialRecord.filler_1 = imageData.filler1 || '';
            trialRecord.filler_2 = imageData.filler2 || '';
            trialRecord.filler_3 = imageData.filler3 || '';
            trialRecord.filler_4 = imageData.filler4 || '';
            
            // Positions for filler trials
            if (imageData.positions) {
                trialRecord.position_filler_1 = imageData.positions.filler1 || '';
                trialRecord.position_filler_2 = imageData.positions.filler2 || '';
                trialRecord.position_filler_3 = imageData.positions.filler3 || '';
                trialRecord.position_filler_4 = imageData.positions.filler4 || '';
            }
            
            console.log('Filler trial populated:', {
                filler1: trialRecord.filler_1,
                filler2: trialRecord.filler_2,
                filler3: trialRecord.filler_3,
                filler4: trialRecord.filler_4
            });
        }
        
        // Add mouse tracking summary if available
        if (mouseData && mouseData.length > 0) {
            trialRecord.mouse_data_points = mouseData.length;
            
            // Calculate mouse movement statistics
            const validPoints = mouseData.filter(point => 
                point && 
                typeof point.x === 'number' && !isNaN(point.x) && 
                typeof point.y === 'number' && !isNaN(point.y)
            );
            
            if (validPoints.length > 0) {
                trialRecord.avg_mouse_x = Math.round(validPoints.reduce((sum, point) => sum + point.x, 0) / validPoints.length);
                trialRecord.avg_mouse_y = Math.round(validPoints.reduce((sum, point) => sum + point.y, 0) / validPoints.length);
                
                // Calculate movement distance
                let totalDistance = 0;
                for (let i = 1; i < validPoints.length; i++) {
                    const dx = validPoints[i].x - validPoints[i-1].x;
                    const dy = validPoints[i].y - validPoints[i-1].y;
                    totalDistance += Math.sqrt(dx*dx + dy*dy);
                }
                trialRecord.total_mouse_distance = Math.round(totalDistance);
                
            } else {
                trialRecord.avg_mouse_x = 0;
                trialRecord.avg_mouse_y = 0;
                trialRecord.total_mouse_distance = 0;
            }
            
            // Calculate time spent in each quadrant (legacy)
            const quadrantTimes = this.calculateQuadrantTimes(mouseData);
            trialRecord.time_top_left = quadrantTimes.topLeft;
            trialRecord.time_top_right = quadrantTimes.topRight;
            trialRecord.time_bottom_left = quadrantTimes.bottomLeft;
            trialRecord.time_bottom_right = quadrantTimes.bottomRight;
            
            // NEW: Calculate time spent on each specific image
            const imageTimes = this.calculateImageViewingTimes(mouseData, imageData, trialInfo.trialType);
            
            // Add image-specific timing data to trial record
            if (trialInfo.trialType === 'image') {
                trialRecord.time_on_dysphoric = imageTimes.dysphoric || 0;
                trialRecord.time_on_threat = imageTimes.threat || 0;
                trialRecord.time_on_positive = imageTimes.positive || 0;
                trialRecord.time_on_filler = imageTimes.filler || 0;
            } else if (trialInfo.trialType === 'filler') {
                trialRecord.time_on_filler_1 = imageTimes.filler1 || 0;
                trialRecord.time_on_filler_2 = imageTimes.filler2 || 0;
                trialRecord.time_on_filler_3 = imageTimes.filler3 || 0;
                trialRecord.time_on_filler_4 = imageTimes.filler4 || 0;
            }
            
        } else {
            // Default values when no mouse data
            trialRecord.mouse_data_points = 0;
            trialRecord.avg_mouse_x = 0;
            trialRecord.avg_mouse_y = 0;
            trialRecord.total_mouse_distance = 0;
            trialRecord.time_top_left = 0;
            trialRecord.time_top_right = 0;
            trialRecord.time_bottom_left = 0;
            trialRecord.time_bottom_right = 0;
        }
        
        this.trialData.push(trialRecord);
        
        console.log(`Trial ${trialRecord.trial_idx} (Round ${trialRecord.round_number}, Trial ${trialRecord.round_trial_idx}) recorded`);
        console.log('Total trials recorded:', this.trialData.length);
        console.log('=== END RECORDING TRIAL DATA ===');
    }
    
    /**
     * Record detailed mouse tracking data with round information
     */
    recordMouseData(mouseData, trialIndex, trialType, roundNumber = 1, roundTrialIndex = 1) {
        if (!mouseData || mouseData.length === 0) {
            console.log('No mouse data to record for trial', trialIndex + 1);
            return;
        }
        
        console.log(`Recording ${mouseData.length} mouse data points for trial ${trialIndex + 1}`);
        
        mouseData.forEach((point, pointIndex) => {
            if (point && typeof point.x === 'number' && typeof point.y === 'number') {
                const mouseRecord = {
                    // Trial identification
                    trial_idx: trialIndex + 1,
                    round_number: roundNumber,
                    round_trial_idx: roundTrialIndex,
                    trial_type: trialType,
                    
                    // Point identification
                    point_index: pointIndex + 1,
                    
                    // Mouse position
                    mouse_x: Math.round(point.x),
                    mouse_y: Math.round(point.y),
                    
                    // Timing
                    timestamp: point.timestamp || Date.now(),
                    time_in_trial: point.timeInTrial || 0,
                    
                    // Screen quadrant
                    quadrant: this.getQuadrant(point.x, point.y),
                    
                    // Movement metrics (if available)
                    velocity: point.velocity || 0,
                    distance_from_previous: point.distanceFromPrevious || 0
                };
                
                this.mouseTrackingData.push(mouseRecord);
            }
        });
        
        console.log(`Mouse tracking data recorded. Total points: ${this.mouseTrackingData.length}`);
    }
    
    /**
     * Calculate time spent in each screen quadrant
     */
    calculateQuadrantTimes(mouseData) {
        const quadrantTimes = {
            topLeft: 0,
            topRight: 0,
            bottomLeft: 0,
            bottomRight: 0
        };
        
        if (!mouseData || mouseData.length === 0) return quadrantTimes;
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Assuming roughly 60fps mouse tracking, each point represents ~16.67ms
        const timePerPoint = 16.67; // milliseconds
        
        mouseData.forEach(point => {
            if (point && typeof point.x === 'number' && typeof point.y === 'number') {
                if (point.x < centerX && point.y < centerY) {
                    quadrantTimes.topLeft += timePerPoint;
                } else if (point.x >= centerX && point.y < centerY) {
                    quadrantTimes.topRight += timePerPoint;
                } else if (point.x < centerX && point.y >= centerY) {
                    quadrantTimes.bottomLeft += timePerPoint;
                } else {
                    quadrantTimes.bottomRight += timePerPoint;
                }
            }
        });
        
        // Round to nearest millisecond
        Object.keys(quadrantTimes).forEach(key => {
            quadrantTimes[key] = Math.round(quadrantTimes[key]);
        });
        
        return quadrantTimes;
    }
    
    /**
     * Calculate time spent viewing each specific image based on mouse position and image bounds
     * This provides more precise timing than quadrant-based calculation
     */
    calculateImageViewingTimes(mouseData, imageData, trialType) {
        const imageTimes = {};
        
        if (!mouseData || mouseData.length === 0) {
            // Return zero times for all images
            if (trialType === 'image') {
                return { dysphoric: 0, threat: 0, positive: 0, filler: 0 };
            } else if (trialType === 'filler') {
                return { filler1: 0, filler2: 0, filler3: 0, filler4: 0 };
            }
            return {};
        }
        
        // Get current image positions and sizes from the DOM
        const imageContainer = document.getElementById('image-container');
        if (!imageContainer) {
            console.warn('Image container not found for timing calculation');
            return imageTimes;
        }
        
        const imageElements = {
            'top-left': imageContainer.querySelector('#top-left-image'),
            'top-right': imageContainer.querySelector('#top-right-image'),
            'bottom-left': imageContainer.querySelector('#bottom-left-image'),
            'bottom-right': imageContainer.querySelector('#bottom-right-image')
        };
        
        // Get bounding rectangles for each image
        const imageBounds = {};
        Object.entries(imageElements).forEach(([position, element]) => {
            if (element && element.style.display !== 'none') {
                const rect = element.getBoundingClientRect();
                imageBounds[position] = {
                    left: rect.left,
                    right: rect.right,
                    top: rect.top,
                    bottom: rect.bottom
                };
            }
        });
        
        // Map image categories to their positions
        const imagePositionMap = {};
        if (trialType === 'image' && imageData.positions) {
            imagePositionMap[imageData.positions.dysphoric] = 'dysphoric';
            imagePositionMap[imageData.positions.threat] = 'threat';
            imagePositionMap[imageData.positions.positive] = 'positive';
            imagePositionMap[imageData.positions.filler] = 'filler';
        } else if (trialType === 'filler' && imageData.positions) {
            imagePositionMap[imageData.positions.filler1] = 'filler1';
            imagePositionMap[imageData.positions.filler2] = 'filler2';
            imagePositionMap[imageData.positions.filler3] = 'filler3';
            imagePositionMap[imageData.positions.filler4] = 'filler4';
        }
        
        // Initialize timing counters
        Object.values(imagePositionMap).forEach(imageName => {
            imageTimes[imageName] = 0;
        });
        
        // Calculate time per mouse data point (assuming ~60fps tracking)
        const timePerPoint = 16.67; // milliseconds
        
        // Analyze each mouse data point
        mouseData.forEach(point => {
            if (point && typeof point.x === 'number' && typeof point.y === 'number') {
                // Check which image (if any) the mouse is over
                Object.entries(imageBounds).forEach(([position, bounds]) => {
                    const imageName = imagePositionMap[position];
                    if (imageName && 
                        point.x >= bounds.left && point.x <= bounds.right &&
                        point.y >= bounds.top && point.y <= bounds.bottom) {
                        imageTimes[imageName] += timePerPoint;
                    }
                });
            }
        });
        
        // Round to nearest millisecond
        Object.keys(imageTimes).forEach(key => {
            imageTimes[key] = Math.round(imageTimes[key]);
        });
        
        console.log('Image viewing times calculated:', imageTimes);
        
        return imageTimes;
    }
    
    /**
     * Get screen quadrant for mouse position
     */
    getQuadrant(x, y) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        if (x < centerX && y < centerY) return 'top-left';
        if (x >= centerX && y < centerY) return 'top-right';
        if (x < centerX && y >= centerY) return 'bottom-left';
        return 'bottom-right';
    }
    
    /**
     * Get trial data for analysis
     */
    getTrialData() {
        return this.trialData;
    }
    
    /**
     * Get mouse tracking data for analysis
     */
    getMouseData() {
        return this.mouseTrackingData;
    }
    
    /**
     * Clear all collected data (for restart)
     */
    clearData() {
        this.trialData = [];
        this.mouseTrackingData = [];
        this.experimentStartTime = null;
        this.currentTrialStartTime = null;
        console.log('All experiment data cleared');
    }
    
    /**
     * Get summary statistics for the experiment
     */
    getSummaryStats() {
        const totalTrials = this.trialData.length;
        const imageTrials = this.trialData.filter(t => t.trial_type === 'image').length;
        const fillerTrials = this.trialData.filter(t => t.trial_type === 'filler').length;
        const totalMousePoints = this.mouseTrackingData.length;
        
        const roundBreakdown = {};
        for (let round = 1; round <= 3; round++) {
            const roundTrials = this.trialData.filter(t => t.round_number === round);
            roundBreakdown[`round_${round}`] = {
                trials: roundTrials.length,
                image_trials: roundTrials.filter(t => t.trial_type === 'image').length,
                filler_trials: roundTrials.filter(t => t.trial_type === 'filler').length
            };
        }
        
        return {
            participant_id: this.participantData.participant_id,
            total_trials: totalTrials,
            image_trials: imageTrials,
            filler_trials: fillerTrials,
            total_mouse_points: totalMousePoints,
            round_breakdown: roundBreakdown,
            experiment_duration: this.experimentStartTime ? 
                Math.round((performance.now() - this.experimentStartTime) / 1000) + ' seconds' : 'Not started'
        };
    }
    
    /**
     * Export trial data as CSV
     */
    exportTrialData() {
        if (this.trialData.length === 0) {
            console.warn('No trial data to export');
            return;
        }
        
        // Get all field names from the first trial record (excluding internal fields)
        const sampleRecord = this.trialData[0];
        const fieldNames = Object.keys(sampleRecord).filter(key => !key.startsWith('_'));
        
        // Create CSV header
        const csvHeader = fieldNames.join(',');
        
        // Create CSV rows
        const csvRows = this.trialData.map(record => {
            return fieldNames.map(field => {
                const value = record[field];
                // Handle string values that might contain commas
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value}"`;
                }
                return value || '';
            }).join(',');
        });
        
        const csvContent = [csvHeader, ...csvRows].join('\n');
        
        // Create and download file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `trial_data_${this.participantData.participant_id}_3rounds_${timestamp}.csv`;
        
        this.downloadCSV(csvContent, filename);
        console.log(`Trial data exported: ${filename}`);
    }
    
    /**
     * Export mouse tracking data as CSV  
     */
    exportMouseData() {
        if (this.mouseTrackingData.length === 0) {
            console.warn('No mouse tracking data to export');
            return;
        }
        
        const fieldNames = Object.keys(this.mouseTrackingData[0]);
        const csvHeader = fieldNames.join(',');
        
        const csvRows = this.mouseTrackingData.map(record => {
            return fieldNames.map(field => record[field] || '').join(',');
        });
        
        const csvContent = [csvHeader, ...csvRows].join('\n');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `mouse_data_${this.participantData.participant_id}_3rounds_${timestamp}.csv`;
        
        this.downloadCSV(csvContent, filename);
        console.log(`Mouse tracking data exported: ${filename}`);
    }
    
    /**
     * Export all data (both trial and mouse data)
     */
    exportAllData() {
        console.log('Exporting all 3-round experiment data...');
        this.exportTrialData();
        this.exportMouseData();
        
        // Log summary
        const summary = this.getSummaryStats();
        console.log('Export complete. Summary:', summary);
    }
    
    /**
     * Helper method to download CSV content
     */
    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Generate trial heatmaps for all trials (placeholder for heatmap functionality)
     */
    async generateAllTrialHeatmaps(progressCallback) {
        console.log('Starting heatmap generation for all 3 rounds...');
        
        const totalTrials = this.trialData.length;
        let generated = 0;
        const results = { success: 0, errors: 0 };
        
        for (let i = 0; i < totalTrials; i++) {
            const trial = this.trialData[i];
            
            try {
                if (progressCallback) {
                    progressCallback(i + 1, totalTrials, `Generating heatmap for trial ${trial.trial_idx} (Round ${trial.round_number})`);
                }
                
                // Simulate heatmap generation delay
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Here you would implement actual heatmap generation logic
                // For now, we'll just simulate success
                results.success++;
                generated++;
                
            } catch (error) {
                console.error(`Error generating heatmap for trial ${trial.trial_idx}:`, error);
                results.errors++;
            }
        }
        
        console.log(`Heatmap generation complete: ${results.success} successful, ${results.errors} errors`);
        return results;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
} else if (typeof window !== 'undefined') {
    window.DataManager = DataManager;
}