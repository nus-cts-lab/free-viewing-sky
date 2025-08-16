# Free-Viewing-Task

Web-based psychological experiment using mouse spotlight to simulate eye tracking for studying attention patterns to emotional stimuli.

## Experiment Description

Participants complete a 3-round free-viewing task where they view emotional images (dysphoric, threat, positive, filler) displayed in four screen quadrants. Mouse cursor movements simulate eye tracking, with a "spotlight" effect revealing only the area around the cursor. Each trial lasts 15 seconds across 60 total trials (20 per round).

## Quick Start

1. **Clone repository**

   ```bash
   git clone <repository-url>
   cd free-viewing-sky
   ```

2. **Run locally**

   ```bash
   python3 -m http.server 8000
   # Navigate to: http://localhost:8000
   ```

3. **Complete experiment**
   - Enter participant information
   - Complete 3 rounds (20 trials each)
   - Download generated data files

## Keyboard Controls

- **Space**: Start experiment (on welcome screen) or continue to next trial
- **Escape**: Emergency exit with confirmation dialog (Upon confirmation, redirects to end screen to download partial data)
- **Enter**: Submit password for Round 2/3 access

## Repository Structure

```
├── index.html              # Main experiment interface
├── js/
│   ├── experiment.js        # Main experiment controller
│   ├── data-manager.js      # Data collection & export
│   ├── image-manager.js     # Image selection & positioning
│   └── practice-manager.js  # Practice trial handler
├── css/
│   ├── experiment.css       # Main experiment styles
│   └── mouseview.css        # Mouse tracking styles
├── data/
│   └── new-data.json        # Image categorization data
├── images/                  # Stimulus images
└── test-*.html             # Testing utilities
```

## Data Export

### CSV Files Generated

- **Trial Data**: `trial_data_ppt{ID}_s{session}_{timestamp}.csv`
  - Trial-level metadata (trial type, images shown, positions, timing, round information)
- **Mouse Tracking**: `mouse_data_ppt{ID}_s{session}_{timestamp}.csv`
  - Detailed cursor coordinates with timestamps and movement metrics
- **Participant Info**: `participant_{ID}_information.csv`
  - Basic participant demographics and session details

### Heatmap Visualizations

- **ZIP File**: `trial_heatmaps_ppt{ID}_{timestamp}.zip`
- **Organization**: Round_1/, Round_2/, Round_3/ folders each containing:
  - **Grid-based_Density_Calculation/**: Custom intensity-based heat visualization with black background
  - **Simpleheat.js_Library/**: Standard heatmap library visualization with optimized background
- **Format**: 120 PNG files total (60 trials × 2 visualization styles)

**Heatmap folder structure:**

```
trial_heatmaps_ppt123456_2025-01-16T10-30-45.zip
├── Round_1/
│   ├── Grid-based_Density_Calculation/
│   │   ├── trial_R1T01_image_custom.png
│   │   ├── trial_R1T02_filler_custom.png
│   │   └── ... (20 files)
│   └── Simpleheat.js_Library/
│       ├── trial_R1T01_image_mouseview.png
│       ├── trial_R1T02_filler_mouseview.png
│       └── ... (20 files)
├── Round_2/
│   ├── Grid-based_Density_Calculation/
│   └── Simpleheat.js_Library/
└── Round_3/
    ├── Grid-based_Density_Calculation/
    └── Simpleheat.js_Library/
```

**Example filenames:**

```
trial_data_ppt123456_s001_2025-01-16T10-30-45.csv
mouse_data_ppt123456_s001_2025-01-16T10-30-45.csv
participant_123456_information.csv
trial_heatmaps_ppt123456_2025-01-16T10-30-45.zip
```
