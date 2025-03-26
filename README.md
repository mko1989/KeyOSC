# KeyOSC

KeyOSC is an OSC bridge application that enables remote control of Apple Keynote presentations through OSC (Open Sound Control) commands. It's specifically designed to work with the Elgato Stream Deck and Companion software, allowing for seamless control of Keynote presentations during live events.

## Features

- Remote control of Keynote presentations via OSC
- Navigation between slides (next, previous)
- Open presentations from file paths
- Start presentations from the beginning
- Get presentation status and information
- Easy-to-use interface for configuration and monitoring

## Requirements

- macOS (required for Keynote)
- Keynote application
- OSC-compatible controller (like Elgato Stream Deck with Companion software)

## Installation
Download the KeyOSC-1.0.0.dmg file from the releases section
Open the DMG file and drag KeyOSC to your Applications folder
Launch KeyOSC from your Applications folder

## Usage
### Basic Configuration
Launch KeyOSC
Set your preferred OSC port (default: 8111)
Select the directory where your Keynote presentations are stored

### OSC Commands
KeyOSC supports the following OSC commands:

- `/keyosc/list [path]` - List presentations in the specified directory
- `/keyosc/open [filepath]` - Open a presentation
- `/keyosc/start-from-beginning` - Start the current presentation from slide 1
- `/keyosc/next` - Go to the next slide/build
- `/keyosc/previous` - Go to the previous slide
- `/keyosc/goto [slide_number]` - Go to a specific slide
- `/keyosc/close` - Close the current presentation

### Companion Integration
To use with Elgato Stream Deck and Companion:

1. Install the KeyOSC module in Companion
2. Configure the OSC server IP address (typically localhost or 127.0.0.1)
3. Set the OSC port to match KeyOSC's port (default: 8111)
4. Configure Stream Deck buttons to trigger the desired OSC commands

## Development
### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)